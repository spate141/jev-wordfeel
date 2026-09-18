import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

import {
  BODY_LIMIT_BYTES,
  defaultCore,
  handleAnalyzeRequest,
  JSON_TYPE,
  PayloadTooLargeError,
  type ApiResult,
  type ApiRoute,
  type CoreAdapter,
} from "./handler.ts";
import type { ApiErrorCode, ApiErrorResponse } from "./types.ts";

export { PayloadTooLargeError } from "./handler.ts";
export type { CoreAdapter } from "./handler.ts";

/** The routes `handler.ts` serves, keyed by the path this server listens on. */
const API_ROUTES: Record<string, ApiRoute> = {
  "/api/analyze": "analyze",
  "/api/analyze-facet": "analyze-facet",
};

export interface AppOptions {
  readonly core?: CoreAdapter;
  readonly publicDir?: string;
  readonly rateLimitPerMinute?: number;
  readonly maxConcurrent?: number;
  readonly trustProxy?: boolean;
  readonly now?: () => number;
}

interface RateBucket {
  count: number;
  resetAt: number;
}

export const createRequestHandler = (options: AppOptions = {}) => {
  const core: CoreAdapter = options.core ?? defaultCore;
  const publicDir = resolve(options.publicDir ?? "web/dist");
  const rateLimitPerMinute = options.rateLimitPerMinute ?? 30;
  const maxConcurrent = options.maxConcurrent ?? 4;
  const trustProxy = options.trustProxy ?? false;
  const now = options.now ?? Date.now;
  const buckets = new Map<string, RateBucket>();
  let active = 0;

  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    setSecurityHeaders(response);

    const url = new URL(request.url ?? "/", "http://wordfeel.local");
    const route = API_ROUTES[url.pathname];
    if (route) {
      if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        return sendError(response, 405, "invalid_request", "This endpoint accepts POST requests only.");
      }

      const clientId = getClientId(request, trustProxy);
      const retryAfter = consumeRateLimit(buckets, clientId, rateLimitPerMinute, now());
      if (retryAfter !== null) {
        response.setHeader("Retry-After", String(retryAfter));
        return sendError(response, 429, "rate_limit", "Too many requests. Please wait and try again.");
      }
      if (active >= maxConcurrent) {
        response.setHeader("Retry-After", "1");
        return sendError(response, 429, "busy", "The sensory cabinet is busy. Please try again shortly.");
      }

      active += 1;
      try {
        await handleApiRequest(request, response, route, core);
      } finally {
        active -= 1;
      }
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.setHeader("Allow", "GET, HEAD");
      response.statusCode = 405;
      response.end();
      return;
    }
    serveStatic(request, response, publicDir, url.pathname);
  };
};

/**
 * Adapt one Node request onto the runtime-agnostic handler.
 *
 * The abort controller bridges a dropped socket to the core's `AbortSignal`, so a visitor who
 * closes the tab stops four Jev requests rather than paying for them.
 */
const handleApiRequest = async (
  request: IncomingMessage,
  response: ServerResponse,
  route: ApiRoute,
  core: CoreAdapter,
): Promise<void> => {
  const controller = new AbortController();
  const abort = () => {
    if (!response.writableEnded) controller.abort();
  };
  request.once("aborted", abort);
  response.once("close", abort);

  let result: ApiResult;
  try {
    result = await handleAnalyzeRequest(route, () => readJsonBody(request), core, {
      signal: controller.signal,
    });
  } finally {
    request.off("aborted", abort);
    response.off("close", abort);
  }
  sendJson(response, result.status, result.body);
};

const readJsonBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > BODY_LIMIT_BYTES) throw new PayloadTooLargeError();
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) throw new SyntaxError("The request body must be JSON.");
  return JSON.parse(raw) as unknown;
};

const consumeRateLimit = (
  buckets: Map<string, RateBucket>,
  clientId: string,
  limit: number,
  currentTime: number,
): number | null => {
  const existing = buckets.get(clientId);
  if (!existing || currentTime >= existing.resetAt) {
    buckets.set(clientId, { count: 1, resetAt: currentTime + 60_000 });
    if (buckets.size > 1_000) {
      for (const [key, bucket] of buckets) if (currentTime >= bucket.resetAt) buckets.delete(key);
    }
    return null;
  }
  if (existing.count >= limit) return Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1_000));
  existing.count += 1;
  return null;
};

const getClientId = (request: IncomingMessage, trustProxy: boolean): string => {
  if (trustProxy) {
    const forwarded = request.headers["x-forwarded-for"];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
    if (first?.trim()) return first.trim();
  }
  return request.socket.remoteAddress ?? "unknown";
};

const serveStatic = (
  request: IncomingMessage,
  response: ServerResponse,
  publicDir: string,
  pathname: string,
): void => {
  const decoded = safeDecode(pathname);
  if (decoded === null) {
    response.statusCode = 400;
    response.end();
    return;
  }
  const requested = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const candidate = resolve(publicDir, normalize(requested));
  const insidePublic = candidate === publicDir || candidate.startsWith(`${publicDir}${sep}`);
  const file = insidePublic && existsSync(candidate) && statSync(candidate).isFile()
    ? candidate
    : join(publicDir, "index.html");

  if (!existsSync(file)) {
    response.statusCode = 503;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("The web application has not been built. Run npm run build:web.");
    return;
  }
  response.statusCode = 200;
  response.setHeader("Content-Type", contentType(file));
  response.setHeader(
    "Cache-Control",
    file.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable",
  );
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
};

const safeDecode = (value: string): string | null => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

const contentType = (file: string): string =>
  ({
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".json": JSON_TYPE,
  })[extname(file)] ?? "application/octet-stream";

const setSecurityHeaders = (response: ServerResponse): void => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "DENY");
};

const sendJson = (response: ServerResponse, status: number, value: unknown): void => {
  if (response.writableEnded || response.destroyed) return;
  response.statusCode = status;
  response.setHeader("Content-Type", JSON_TYPE);
  response.end(JSON.stringify(value));
};

const sendError = (
  response: ServerResponse,
  status: number,
  code: ApiErrorCode,
  message: string,
): void => sendJson(response, status, { error: { code, message } } satisfies ApiErrorResponse);

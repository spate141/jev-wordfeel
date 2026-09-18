/**
 * The Cloudflare Pages Functions adapter.
 *
 * Both API routes are the same request shape, so they share one adapter over `server/handler.ts`.
 * This file is the only Workers-specific code in the project: it turns a Web `Request` into the
 * handler's arguments and its `ApiResult` back into a `Response`. All validation, routing, and error
 * mapping stay in the shared handler, so this deployment and `npm start` answer identically.
 *
 * There is no environment to read on this runtime, so the API key is passed in from the Pages
 * secret explicitly. It exists only here, server-side; nothing in `web/` ever sees it.
 */

import {
  BODY_LIMIT_BYTES,
  errorResult,
  handleAnalyzeRequest,
  JSON_TYPE,
  PayloadTooLargeError,
  type ApiResult,
  type ApiRoute,
} from "../server/handler.ts";
import type { AnalyzeOptions } from "../src/types.ts";

/** Bindings this deployment expects. `TYPESAFE_API_KEY` is a Pages secret, never a plain variable. */
export interface Env {
  readonly TYPESAFE_API_KEY?: string;
  readonly TYPESAFE_MODEL?: string;
}

/** The headers `server/app.ts` sets on every response, plus one that keeps answers out of caches. */
const RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  "Content-Type": JSON_TYPE,
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

/** Answer one API request, or reject anything that is not a POST. */
export const respondToAnalyze = async (
  route: ApiRoute,
  request: Request,
  env: Env,
): Promise<Response> => {
  if (request.method !== "POST") {
    return toResponse(
      errorResult(405, "invalid_request", "This endpoint accepts POST requests only."),
      { Allow: "POST" },
    );
  }

  const result = await handleAnalyzeRequest(
    route,
    () => readJsonBody(request),
    undefined,
    analyzeOptions(request, env),
  );
  return toResponse(result);
};

/**
 * Resolve credentials from the bindings.
 *
 * Keys are omitted rather than set to `undefined` so an unset variable falls through to the core's
 * own defaults. A missing key raises `ConfigurationError` inside `resolveConfig`, which the shared
 * handler reports as a 503 carrying no internal detail.
 */
const analyzeOptions = (request: Request, env: Env): AnalyzeOptions => ({
  signal: request.signal,
  ...(env.TYPESAFE_API_KEY ? { apiKey: env.TYPESAFE_API_KEY } : {}),
  ...(env.TYPESAFE_MODEL ? { model: env.TYPESAFE_MODEL } : {}),
});

/**
 * Read and parse the body under the same 4 KiB cap the Node server enforces.
 *
 * `Content-Length` is checked first so an oversized body is refused before it is buffered, and the
 * decoded byte length is checked again for a chunked request that declared no length.
 */
const readJsonBody = async (request: Request): Promise<unknown> => {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > BODY_LIMIT_BYTES) throw new PayloadTooLargeError();

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > BODY_LIMIT_BYTES) throw new PayloadTooLargeError();
  if (!raw) throw new SyntaxError("The request body must be JSON.");
  return JSON.parse(raw) as unknown;
};

const toResponse = (result: ApiResult, extraHeaders: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { ...RESPONSE_HEADERS, ...extraHeaders },
  });

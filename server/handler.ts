/**
 * The API, with no runtime attached.
 *
 * Request validation, facet routing, and the error-to-status mapping live here so the Node server
 * (`app.ts`) and the Cloudflare Pages Functions (`functions/api/*`) answer identically. Neither
 * this module nor anything it imports touches a Node builtin, which is what lets the same logic run
 * on a worker runtime. Everything runtime-specific — sockets, static files, rate limiting, header
 * writing — stays with the caller.
 */

import {
  analyzeFacet as coreAnalyzeFacet,
  analyzeWord as coreAnalyzeWord,
  ConfigurationError,
  InputValidationError,
  isFacet,
  normalizeInput,
} from "../src/index.ts";
import type { AnalysisResult, AnalyzeOptions, Facet, FacetResult } from "../src/types.ts";
import type { AnalyzeFacetResponse, ApiErrorCode, ApiErrorResponse } from "./types.ts";

export const JSON_TYPE = "application/json; charset=utf-8";

/** A word or short phrase plus a facet name; anything larger is not a legitimate request. */
export const BODY_LIMIT_BYTES = 4 * 1024;

/** The two POST routes this API exposes, named without their `/api/` prefix. */
export type ApiRoute = "analyze" | "analyze-facet";

/** The core entry points the API calls. Tests substitute a fake in place of real Jev requests. */
export interface CoreAdapter {
  analyzeWord(input: string, options?: AnalyzeOptions): Promise<AnalysisResult>;
  analyzeFacet<F extends Facet>(
    facet: F,
    input: string,
    options?: AnalyzeOptions,
  ): Promise<FacetResult<F>>;
}

/** The real core. */
export const defaultCore: CoreAdapter = {
  analyzeWord: coreAnalyzeWord,
  analyzeFacet: coreAnalyzeFacet,
};

/** Raised by a caller's body reader once a request body exceeds `BODY_LIMIT_BYTES`. */
export class PayloadTooLargeError extends Error {}

/** A status and a JSON-serializable body, for the caller to write however its runtime demands. */
export interface ApiResult {
  readonly status: number;
  readonly body: unknown;
}

/** Build an error envelope. Messages are written for a stranger: they never carry internal detail. */
export const errorResult = (status: number, code: ApiErrorCode, message: string): ApiResult => ({
  status,
  body: { error: { code, message } } satisfies ApiErrorResponse,
});

/**
 * Run one API request.
 *
 * The body arrives as a reader rather than a value so that a caller's own parse and size failures
 * land in the same catch ladder as the core's, and therefore map to the same responses.
 *
 * `options` carries the abort signal, and — off Node, where there is no environment to read —
 * the resolved credentials.
 */
export const handleAnalyzeRequest = async (
  route: ApiRoute,
  readBody: () => Promise<unknown>,
  core: CoreAdapter = defaultCore,
  options: AnalyzeOptions = {},
): Promise<ApiResult> => {
  try {
    const body = await readBody();
    if (!isRecord(body) || typeof body.input !== "string") {
      return errorResult(400, "invalid_request", "Provide an input string.");
    }

    if (route === "analyze") {
      return { status: 200, body: await core.analyzeWord(body.input, options) };
    }

    if (!isFacet(body.facet)) {
      return errorResult(400, "invalid_request", "Provide a valid facet.");
    }
    const normalized = normalizeInput(body.input);
    const result = await core.analyzeFacet(body.facet, body.input, options);
    const envelope: AnalyzeFacetResponse = {
      input: body.input,
      normalized_input: normalized,
      facet: body.facet,
      result,
    };
    return { status: 200, body: envelope };
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return errorResult(413, "payload_too_large", "The request body is too large.");
    }
    if (error instanceof SyntaxError || error instanceof InputValidationError) {
      return errorResult(400, "invalid_request", safeMessage(error));
    }
    if (error instanceof ConfigurationError) {
      // A missing or unusable key is the operator's problem, not the visitor's, and its own message
      // names the environment variable — so it is deliberately not forwarded.
      return errorResult(
        503,
        "not_configured",
        "The service is not configured. Please contact the site owner.",
      );
    }
    return errorResult(500, "internal_error", "The request could not be completed.");
  }
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const safeMessage = (error: SyntaxError | InputValidationError): string =>
  error instanceof InputValidationError ? error.message : "The request body is not valid JSON.";

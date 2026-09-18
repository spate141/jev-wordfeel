/**
 * Error types and the mapping from provider failures to our facet error codes.
 *
 * Every arm below is keyed off a class the SDK actually exports, so nothing here depends on an
 * invented provider contract.
 */

import {
  APIConnectionError,
  APIError,
  APITimeoutError,
  APIUserAbortError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
} from "@typesafe-ai/sdk";

import type { FacetErrorCode, FacetFailure } from "./types.ts";

/** Invalid local configuration: missing credentials, unusable timeout, unknown facet. */
export class ConfigurationError extends Error {
  override readonly name = "ConfigurationError";
}

/** The caller's input is not an acceptable word or short phrase. Launches zero requests. */
export class InputValidationError extends Error {
  override readonly name = "InputValidationError";
}

/** A provider response that did not satisfy the contract in `validate.ts`. */
export class InvalidResponseError extends Error {
  override readonly name = "InvalidResponseError";
}

/** The mapped error, before it is paired with a duration. */
export interface MappedFacetError {
  readonly code: FacetErrorCode;
  readonly message: string;
  readonly http_status?: number;
}

/**
 * Map an unknown thrown value onto a facet error code.
 *
 * `signalAborted` disambiguates the one case the SDK cannot: a request that fails because we
 * cancelled it can surface as a generic connection error depending on where the abort lands.
 */
export const mapFacetError = (error: unknown, signalAborted = false): MappedFacetError => {
  // Cancellation wins over everything: an aborted request may surface as a connection failure.
  if (error instanceof APIUserAbortError || (signalAborted && !(error instanceof APIError))) {
    return { code: "cancelled", message: "Request was cancelled before it completed." };
  }

  if (error instanceof APITimeoutError) {
    return { code: "timeout", message: `Request timed out after ${error.timeoutMs}ms.` };
  }

  if (error instanceof InvalidResponseError) {
    return { code: "invalid_response", message: error.message };
  }

  if (error instanceof APIError) {
    const code: FacetErrorCode =
      error instanceof AuthenticationError || error instanceof PermissionDeniedError
        ? "authentication"
        : error instanceof RateLimitError
          ? "rate_limit"
          : "provider_error";
    return { code, message: describeApiError(error), http_status: error.status };
  }

  // APITimeoutError extends APIConnectionError, so this arm is reached only by real transport
  // failures: DNS, TLS, a dropped socket.
  if (error instanceof APIConnectionError) {
    return { code: "network", message: error.message };
  }

  return { code: "provider_error", message: messageOf(error) };
};

/**
 * Describe an API error for a human.
 *
 * The SDK's message already carries the status and any server-supplied detail. We append the
 * request ID because it is what support needs, and nothing else: headers and the request body
 * can carry credentials.
 */
const describeApiError = (error: APIError): string =>
  error.requestId ? `${error.message} (request id: ${error.requestId})` : error.message;

/** Best-effort message for a non-Error throw, without leaking an arbitrary object's contents. */
const messageOf = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return "The provider request failed for an unknown reason.";
};

/** Build a `FacetFailure` from a thrown value and the elapsed time of the attempt. */
export const toFacetFailure = (
  error: unknown,
  latencyMs: number,
  signalAborted = false,
): FacetFailure => ({
  status: "error",
  error: mapFacetError(error, signalAborted),
  latency_ms: latencyMs,
});

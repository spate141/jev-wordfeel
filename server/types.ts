import type { Facet, FacetResult } from "../src/types.ts";

export interface AnalyzeRequest {
  readonly input: string;
}

export interface AnalyzeFacetRequest extends AnalyzeRequest {
  readonly facet: Facet;
}

export interface AnalyzeFacetResponse<F extends Facet = Facet> {
  readonly input: string;
  readonly normalized_input: string;
  readonly facet: F;
  readonly result: FacetResult<F>;
}

export type ApiErrorCode =
  | "invalid_request"
  | "payload_too_large"
  | "rate_limit"
  | "busy"
  | "not_configured"
  | "internal_error";

export interface ApiErrorResponse {
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
  };
}

import type { AnalysisResult, Facet, FacetResult } from "../../src/types.ts";
import type { AnalyzeFacetResponse, ApiErrorResponse } from "../../server/types.ts";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const requestAnalysis = async (
  input: string,
  signal?: AbortSignal,
): Promise<AnalysisResult> => requestJson<AnalysisResult>("/api/analyze", { input }, signal);

export const requestFacet = async <F extends Facet>(
  input: string,
  facet: F,
  signal?: AbortSignal,
): Promise<{ normalizedInput: string; result: FacetResult<F> }> => {
  const response = await requestJson<AnalyzeFacetResponse<F>>(
    "/api/analyze-facet",
    { input, facet },
    signal,
  );
  return { normalizedInput: response.normalized_input, result: response.result };
};

const requestJson = async <T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });

  const data = (await response.json().catch(() => null)) as T | ApiErrorResponse | null;
  if (!response.ok) {
    const error = data && typeof data === "object" && "error" in data
      ? (data as ApiErrorResponse).error
      : null;
    throw new ApiError(error?.message ?? "The service could not complete the request.", response.status, error?.code ?? "request_failed");
  }
  return data as T;
};

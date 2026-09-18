/**
 * The application contract.
 *
 * These types describe what wordfeel returns, not the provider's raw wire schema. The provider's
 * own shapes live in `@typesafe-ai/sdk`; `client.ts` and `validate.ts` are the only modules that
 * touch them.
 */

import type {
  Facet,
  LabelOf,
  MaterialLabel,
  ShapeLabel,
  SmellLabel,
  TasteLabel,
} from "./taxonomies.ts";

export type { Facet, LabelOf, MaterialLabel, ShapeLabel, SmellLabel, TasteLabel };

/** Why a facet failed. Distinguishes transport problems from the valid `no_association` answer. */
export type FacetErrorCode =
  | "timeout"
  | "cancelled"
  | "authentication"
  | "rate_limit"
  | "network"
  | "provider_error"
  | "invalid_response";

/** Token usage reported by the provider for this facet's request, or `null` when absent. */
export interface FacetUsage {
  readonly input_tokens: number;
  readonly output_tokens: number;
}

/** One label and its unmodified probability. */
export interface RankedLabel<Label extends string> {
  readonly label: Label;
  readonly probability: number;
}

/**
 * A facet that answered.
 *
 * `probabilities` is the model's full native distribution, unrounded and with every candidate
 * present, including zero-valued ones and `no_association`.
 */
export interface FacetSuccess<Label extends string> {
  readonly status: "ok";
  /** Provider-reported model. */
  readonly model: string;
  readonly choice: Label;
  /** Full native distribution over this facet's candidates. */
  readonly probabilities: Readonly<Record<Label, number>>;
  /**
   * Provider-reported confidence: how concentrated the distribution is. Not accuracy, not
   * sensory intensity. A low value is not an error in this creative application.
   */
  readonly confidence: number;
  /** Descending by probability, with taxonomy display order as the tie-break. */
  readonly ranked: readonly RankedLabel<Label>[];
  readonly latency_ms: number;
  readonly usage: FacetUsage | null;
}

/** A facet that did not answer. Never carries fabricated probabilities. */
export interface FacetFailure {
  readonly status: "error";
  readonly error: {
    readonly code: FacetErrorCode;
    /** Safe and actionable; contains no credentials. */
    readonly message: string;
    readonly http_status?: number;
  };
  readonly latency_ms: number;
}

/** The outcome of one facet request. */
export type FacetResult<F extends Facet> = FacetSuccess<LabelOf<F>> | FacetFailure;

/** Per-facet results, each typed with its own label union. */
export interface FacetResults {
  readonly taste: FacetSuccess<TasteLabel> | FacetFailure;
  readonly material: FacetSuccess<MaterialLabel> | FacetFailure;
  readonly smell: FacetSuccess<SmellLabel> | FacetFailure;
  readonly shape: FacetSuccess<ShapeLabel> | FacetFailure;
}

/** `ok` when all four facets answered, `error` when none did, `partial` otherwise. */
export type AnalysisStatus = "ok" | "partial" | "error";

/** The full result of one `analyzeWord` call. */
export interface AnalysisResult {
  readonly schema_version: "1.0.0";
  readonly prompt_version: "1.0.0";
  readonly taxonomy_version: "1.0.0";
  /** Exactly what the caller passed. */
  readonly input: string;
  /** NFC-normalized, trimmed, whitespace-collapsed. */
  readonly normalized_input: string;
  /** The model wordfeel asked for, which may differ from a facet's reported model. */
  readonly requested_model: string;
  readonly status: AnalysisStatus;
  /** Wall-clock time around the whole fan-out, not the sum of the facet durations. */
  readonly total_latency_ms: number;
  readonly facets: FacetResults;
}

/** Per-call overrides. */
export interface AnalyzeOptions {
  /**
   * Cancels outstanding requests. Already-completed facets keep their results; in-flight ones
   * become `cancelled` failures. A signal already aborted at entry starts no requests at all.
   */
  readonly signal?: AbortSignal;
  /** Overrides `JEV_TIMEOUT_MS` for this call. Applies per facet request. */
  readonly timeoutMs?: number;
  /** Overrides `TYPESAFE_MODEL` for this call. */
  readonly model?: string;
  /** Overrides the API key for this call. Intended for tests and multi-tenant callers. */
  readonly apiKey?: string;
  /** Overrides the API root. */
  readonly baseURL?: string;
  /** Custom fetch implementation. The seam the test suite uses instead of a mocking framework. */
  readonly fetch?: (input: string, init?: RequestInit) => Promise<Response>;
}

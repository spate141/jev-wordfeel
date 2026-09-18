/**
 * Orchestration: one facet, and all four at once.
 *
 * The defining constraint of this project is that an analysis fans out into FOUR separate
 * concurrent Jev requests, one per facet. They are independent by construction: none reads or
 * waits on another's answer, and all four are in flight before any of them resolves.
 */

import { requestFacet } from "./client.ts";
import { resolveConfig, type ResolvedConfig } from "./config.ts";
import { toFacetFailure } from "./errors.ts";
import { normalizeInput } from "./input.ts";
import { PROMPT_VERSION, SCHEMA_VERSION, TAXONOMY_VERSION } from "./prompts.ts";
import { FACETS, type Facet, type LabelOf } from "./taxonomies.ts";
import type {
  AnalysisResult,
  AnalysisStatus,
  AnalyzeOptions,
  FacetResult,
  FacetResults,
  FacetSuccess,
} from "./types.ts";
import { validateAnswer } from "./validate.ts";

/**
 * Monotonic clock, immune to wall-clock adjustments during a request.
 *
 * `performance.now()` rather than `process.hrtime.bigint()` so this module stays free of Node
 * builtins and runs unchanged on a worker runtime; both are monotonic.
 */
const now = (): number => performance.now();

/** Fractional milliseconds elapsed since `start`. Not rounded. */
const elapsedMs = (start: number): number => now() - start;

/** A pre-aborted signal, so `analyzeWord` can report cancellation without starting any request. */
const cancelledBeforeLaunch = () =>
  toFacetFailure(undefined, 0, true) satisfies FacetResult<Facet>;

/**
 * Analyze one facet.
 *
 * Use this to retry a single facet that failed in an earlier `analyzeWord` call. It resolves
 * rather than rejects for provider and validation failures, so a caller composing several facets
 * never loses the others. Invalid input and invalid configuration still throw, because they are
 * the caller's bug and would launch no useful request.
 *
 * @throws {InputValidationError} for input that is not an acceptable word or short phrase.
 * @throws {ConfigurationError} for missing credentials or an unusable timeout.
 */
export const analyzeFacet = async <F extends Facet>(
  facet: F,
  input: string,
  options: AnalyzeOptions = {},
): Promise<FacetResult<F>> => {
  const normalized = normalizeInput(input);
  const config = resolveConfig(options);
  return runFacet(facet, normalized, config, options.signal);
};

/**
 * Run one already-validated facet request.
 *
 * Shared by `analyzeFacet` and the `analyzeWord` fan-out so both perform identical work; the
 * fan-out resolves input and configuration once rather than four times.
 */
const runFacet = async <F extends Facet>(
  facet: F,
  normalizedInput: string,
  config: ResolvedConfig,
  signal: AbortSignal | undefined,
): Promise<FacetResult<F>> => {
  const start = now();
  try {
    const raw = await requestFacet(facet, normalizedInput, config, signal);
    const validated = validateAnswer(facet, raw.answer);
    const success: FacetSuccess<LabelOf<F>> = {
      status: "ok",
      model: raw.model,
      choice: validated.choice,
      probabilities: validated.probabilities,
      confidence: validated.confidence,
      ranked: validated.ranked,
      latency_ms: elapsedMs(start),
      usage: raw.usage,
    };
    return success;
  } catch (error) {
    return toFacetFailure(error, elapsedMs(start), signal?.aborted ?? false);
  }
};

/**
 * Analyze a word or short phrase across all four facets.
 *
 * Input and configuration are validated first, so a bad call launches zero requests. Otherwise
 * the four requests start together and the result is assembled from whatever settles: successful
 * facets are returned even when a sibling fails, times out, or returns something malformed.
 *
 * @throws {InputValidationError} for input that is not an acceptable word or short phrase.
 * @throws {ConfigurationError} for missing credentials or an unusable timeout.
 */
export const analyzeWord = async (
  input: string,
  options: AnalyzeOptions = {},
): Promise<AnalysisResult> => {
  const normalized = normalizeInput(input);
  const config = resolveConfig(options);

  const start = now();

  // A signal already aborted at entry starts no requests at all. This is the documented
  // exception to the rule that one analysis makes exactly four outbound calls.
  if (options.signal?.aborted) {
    return assemble(input, normalized, config, 0, {
      taste: cancelledBeforeLaunch(),
      material: cancelledBeforeLaunch(),
      smell: cancelledBeforeLaunch(),
      shape: cancelledBeforeLaunch(),
    });
  }

  // Each call is initiated synchronously inside this map, before the first await below, so all
  // four requests are in flight together. Elapsed time is wall clock around the whole fan-out,
  // which is roughly the slowest facet rather than the sum of the four.
  const jobs = FACETS.map((facet) => runFacet(facet, normalized, config, options.signal));
  const settled = await Promise.allSettled(jobs);

  const totalLatencyMs = elapsedMs(start);

  // runFacet resolves for every failure it knows about, so a rejection here means a defect in
  // our own code. Surface it as a facet failure rather than losing the other three.
  const results = Object.fromEntries(
    FACETS.map((facet, index) => {
      const outcome = settled[index]!;
      return [
        facet,
        outcome.status === "fulfilled"
          ? outcome.value
          : toFacetFailure(outcome.reason, totalLatencyMs, options.signal?.aborted ?? false),
      ];
    }),
  ) as unknown as FacetResults;

  return assemble(input, normalized, config, totalLatencyMs, results);
};

const assemble = (
  input: string,
  normalizedInput: string,
  config: ResolvedConfig,
  totalLatencyMs: number,
  facets: FacetResults,
): AnalysisResult => ({
  schema_version: SCHEMA_VERSION,
  prompt_version: PROMPT_VERSION,
  taxonomy_version: TAXONOMY_VERSION,
  input,
  normalized_input: normalizedInput,
  requested_model: config.model,
  status: statusOf(facets),
  total_latency_ms: totalLatencyMs,
  facets,
});

/** All four succeeded is `ok`, none succeeded is `error`, anything between is `partial`. */
const statusOf = (facets: FacetResults): AnalysisStatus => {
  const succeeded = FACETS.filter((facet) => facets[facet].status === "ok").length;
  if (succeeded === FACETS.length) return "ok";
  if (succeeded === 0) return "error";
  return "partial";
};

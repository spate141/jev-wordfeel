/**
 * wordfeel: turn a word or short phrase into four sensory association profiles.
 *
 * This is the reusable core. It has no browser, rendering, framework, database, or deployment
 * dependencies, so a later visual demo can consume `analyzeWord` directly.
 *
 * ```ts
 * import { analyzeWord } from "wordfeel";
 *
 * const result = await analyzeWord("Chicago");
 * console.log(result.facets.material);
 * ```
 */

export { analyzeFacet, analyzeWord } from "./analyze.ts";

export {
  ConfigurationError,
  InputValidationError,
  InvalidResponseError,
  mapFacetError,
  type MappedFacetError,
} from "./errors.ts";

export {
  DEFAULT_MODEL,
  DEFAULT_TIMEOUT_MS,
  ENV_VARS,
  resolveConfig,
  type ResolvedConfig,
} from "./config.ts";

export { codePointLength, MAX_INPUT_CODE_POINTS, normalizeInput } from "./input.ts";

export {
  FACET_INSTRUCTIONS,
  instructionsFor,
  PROMPT_VERSION,
  SCHEMA_VERSION,
  SHARED_INSTRUCTIONS,
  STATE_KEY,
  TAXONOMY_VERSION,
} from "./prompts.ts";

export {
  criteriaFor,
  displayIndexOf,
  FACETS,
  isFacet,
  isLabelOf,
  labelsFor,
  MATERIAL_CANDIDATES,
  NO_ASSOCIATION,
  SHAPE_CANDIDATES,
  SMELL_CANDIDATES,
  TASTE_CANDIDATES,
  TAXONOMIES,
  type Candidate,
} from "./taxonomies.ts";

export { PROBABILITY_SUM_TOLERANCE, rankLabels, validateAnswer } from "./validate.ts";

export { resetClientCache } from "./client.ts";

export type {
  AnalysisResult,
  AnalysisStatus,
  AnalyzeOptions,
  Facet,
  FacetErrorCode,
  FacetFailure,
  FacetResult,
  FacetResults,
  FacetSuccess,
  FacetUsage,
  LabelOf,
  MaterialLabel,
  RankedLabel,
  ShapeLabel,
  SmellLabel,
  TasteLabel,
} from "./types.ts";

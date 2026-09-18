import { FACETS, labelsFor, type Facet, type LabelOf } from "../../src/taxonomies.ts";
import type { AnalysisResult, FacetResults, FacetSuccess } from "../../src/types.ts";

export const makeSuccess = <F extends Facet>(
  facet: F,
  choice: LabelOf<F>,
  values: Partial<Record<LabelOf<F>, number>> = {},
): FacetSuccess<LabelOf<F>> => {
  const labels = labelsFor(facet);
  const supplied = labels.reduce((sum, label) => sum + (values[label] ?? 0), 0);
  const probabilities = Object.fromEntries(labels.map((label) => [label, values[label] ?? (label === choice ? 1 - supplied : 0)])) as Record<LabelOf<F>, number>;
  return {
    status: "ok",
    model: "jev-test",
    choice,
    probabilities,
    confidence: probabilities[choice],
    ranked: labels.map((label) => ({ label, probability: probabilities[label] })).sort((a, b) => b.probability - a.probability),
    latency_ms: 123,
    usage: { input_tokens: 12, output_tokens: 2 },
  };
};

export const makeAnalysis = (input = "banana"): AnalysisResult => ({
  schema_version: "1.0.0",
  prompt_version: "1.0.0",
  taxonomy_version: "1.0.0",
  input,
  normalized_input: input,
  requested_model: "jev-latest",
  status: "ok",
  total_latency_ms: 234,
  facets: {
    taste: makeSuccess("taste", "sweet", { sweet: .82, sour: .09, bitter: .04, umami: .03, salty: .02 }),
    material: makeSuccess("material", "wood", { wood: .61, fabric: .14, rubber: .1, stone: .08, water: .04, smoke: .02, no_association: .01 }),
    smell: makeSuccess("smell", "citrus", { citrus: .66, floral: .12, herbal: .1, woody: .05, spicy: .04, earthy: .02, no_association: .01 }),
    shape: makeSuccess("shape", "circle", { circle: .71, spiral: .13, wave: .08, triangle: .04, square: .02, star: .01, no_association: .01 }),
  } satisfies FacetResults,
});

export const allFacets = FACETS;

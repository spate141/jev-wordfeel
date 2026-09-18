/**
 * Fixed v1 taxonomies.
 *
 * These are the product's finite palettes. Materials, smells, and shapes are curated demo
 * vocabularies, not claims of exhaustive scientific classification. The IDs and their display
 * order are part of the public contract: the order below is the stable tie-break for ranking
 * and the order a renderer should use. Changing an ID or a definition means bumping
 * `TAXONOMY_VERSION` in `prompts.ts`.
 *
 * `no_association` is appended to every facet so unfamiliar or unsuitable inputs have an
 * explicit outcome rather than being forced into a category.
 */

/** One candidate label and the definition sent to the model as its criterion. */
export interface Candidate {
  readonly id: string;
  readonly definition: string;
}

/**
 * Shared final candidate for every facet. Its probability stays in the returned distribution;
 * it is never hidden and the other labels are never renormalized without it.
 */
export const NO_ASSOCIATION = {
  id: "no_association",
  definition:
    "The input cannot be meaningfully interpreted, or none of the available categories provides a meaningful literal or metaphorical association for this facet.",
} as const satisfies Candidate;

/** Taste palette. Heat/spiciness, temperature, texture, and aroma are deliberately excluded. */
export const TASTE_CANDIDATES = [
  { id: "sweet", definition: "Sugar-like sweetness, as in honey or ripe fruit." },
  { id: "sour", definition: "Acidic tartness, as in lemon juice or vinegar." },
  { id: "salty", definition: "Salt-like mineral savor, as in brine." },
  {
    id: "bitter",
    definition: "Bitterness associated with unsweetened coffee, cocoa, or bitter greens.",
  },
  {
    id: "umami",
    definition: "Brothy, savory taste associated with mushrooms, stock, or aged cheese.",
  },
  NO_ASSOCIATION,
] as const satisfies readonly Candidate[];

/** Material palette. A symbolic embodiment, not a claim about physical composition. */
export const MATERIAL_CANDIDATES = [
  { id: "glass", definition: "Smooth, transparent or translucent, rigid, and potentially fragile." },
  {
    id: "metal",
    definition: "Hard, metallic, often reflective, with an industrial or conductive character.",
  },
  {
    id: "wood",
    definition: "Solid organic material with grain, fibers, and a natural tactile character.",
  },
  { id: "stone", definition: "Dense, mineral, rocky material suggesting solidity or weight." },
  { id: "fabric", definition: "Flexible woven or fibrous textile; soft, draping, or thread-like." },
  { id: "water", definition: "Flowing liquid associated with ripples, fluidity, or transparency." },
  { id: "smoke", definition: "Diffuse drifting particulate clouds; wispy, hazy, or ephemeral." },
  {
    id: "rubber",
    definition: "Elastic, flexible material that stretches, compresses, and rebounds.",
  },
  NO_ASSOCIATION,
] as const satisfies readonly Candidate[];

/** Scent-family palette. */
export const SMELL_CANDIDATES = [
  { id: "floral", definition: "Blossom or petal aromas, such as rose or jasmine." },
  {
    id: "citrus",
    definition: "Bright aromas of citrus peel or oils, such as lemon or orange.",
  },
  { id: "woody", definition: "Wood, bark, cedar, or sandalwood aromas." },
  { id: "earthy", definition: "Soil, damp earth, moss, or mushroom-like aromas." },
  { id: "smoky", definition: "Smoke, charred wood, embers, or burnt aromas." },
  { id: "herbal", definition: "Green leaves, fresh herbs, grass, mint, or leafy aromas." },
  {
    id: "spicy",
    definition: "Aromatic spices such as cinnamon, clove, or pepper; not heat on the tongue.",
  },
  { id: "oceanic", definition: "Marine, sea-air, seaweed, or coastal aromas." },
  NO_ASSOCIATION,
] as const satisfies readonly Candidate[];

/** Shape palette. */
export const SHAPE_CANDIDATES = [
  { id: "circle", definition: "A smooth closed round shape without corners." },
  { id: "triangle", definition: "A three-sided angular shape with three corners." },
  { id: "square", definition: "A four-sided shape with equal sides and right angles." },
  { id: "star", definition: "A radial shape with multiple outward points." },
  { id: "spiral", definition: "A curve winding around a center while moving inward or outward." },
  { id: "wave", definition: "An undulating curve with alternating rises and falls." },
  NO_ASSOCIATION,
] as const satisfies readonly Candidate[];

/** The four facets, in the order `analyzeWord` fans them out and reports them. */
export const FACETS = ["taste", "material", "smell", "shape"] as const;

export type Facet = (typeof FACETS)[number];

/** Candidate palettes keyed by facet. Single source of truth for labels and definitions. */
export const TAXONOMIES = {
  taste: TASTE_CANDIDATES,
  material: MATERIAL_CANDIDATES,
  smell: SMELL_CANDIDATES,
  shape: SHAPE_CANDIDATES,
} as const;

// Label unions are derived from the tables above so they can never drift from what is sent.
export type TasteLabel = (typeof TASTE_CANDIDATES)[number]["id"];
export type MaterialLabel = (typeof MATERIAL_CANDIDATES)[number]["id"];
export type SmellLabel = (typeof SMELL_CANDIDATES)[number]["id"];
export type ShapeLabel = (typeof SHAPE_CANDIDATES)[number]["id"];

/** The label union for a given facet. */
export type LabelOf<F extends Facet> = (typeof TAXONOMIES)[F][number]["id"];

/** Any label from any facet. */
export type AnyLabel = LabelOf<Facet>;

/** Candidate IDs for a facet, in stable display order. */
export const labelsFor = <F extends Facet>(facet: F): readonly LabelOf<F>[] =>
  TAXONOMIES[facet].map((candidate) => candidate.id) as readonly LabelOf<F>[];

/**
 * Criteria map for a facet's Choice question: label -> definition, in display order.
 *
 * Only static taxonomy text ends up here. User input never reaches a criterion.
 */
export const criteriaFor = (facet: Facet): Record<string, string> =>
  Object.fromEntries(TAXONOMIES[facet].map((candidate) => [candidate.id, candidate.definition]));

/** Zero-based display position of a label, used as the deterministic ranking tie-break. */
export const displayIndexOf = (facet: Facet, label: string): number =>
  TAXONOMIES[facet].findIndex((candidate) => candidate.id === label);

/** Type guard: is `value` one of the given facet's labels? */
export const isLabelOf = <F extends Facet>(facet: F, value: unknown): value is LabelOf<F> =>
  typeof value === "string" && TAXONOMIES[facet].some((candidate) => candidate.id === value);

/** Type guard for facet names, used by the CLI when parsing `--facet`. */
export const isFacet = (value: unknown): value is Facet =>
  typeof value === "string" && (FACETS as readonly string[]).includes(value);

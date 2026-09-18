import { TAXONOMIES, type Facet } from "../../src/taxonomies.ts";
import type { FacetSuccess } from "../../src/types.ts";

export const FACET_META = {
  taste: { number: "01", title: "Taste", aria: "Taste association" },
  material: { number: "02", title: "Material", aria: "Material association" },
  smell: { number: "03", title: "Scent", aria: "Scent association" },
  shape: { number: "04", title: "Shape", aria: "Shape association" },
} as const;

/**
 * Display name and color for every label in every palette.
 *
 * The palette is one muted earth family across all four facets, so the cabinet reads as one
 * cabinet. Within a facet, neighbouring labels sit near each other in hue and separate on
 * value, which keeps a 20-segment probability ribbon legible. Shapes share a single terracotta
 * except where a label carries its own temperature.
 *
 * `visualRegistry.test.ts` asserts this covers every id in `TAXONOMIES`.
 */
export const LABEL_META: Record<string, { label: string; color: string }> = {
  // Taste
  sweet: { label: "Sweet", color: "#d8a03f" },
  sour: { label: "Sour", color: "#b7c749" },
  salty: { label: "Salty", color: "#9eb8c6" },
  bitter: { label: "Bitter", color: "#6d4c40" },
  umami: { label: "Umami", color: "#b06a45" },
  fatty: { label: "Fatty", color: "#e0c98a" },
  astringent: { label: "Astringent", color: "#8e7f63" },
  metallic: { label: "Metallic", color: "#8a949a" },
  mineral: { label: "Mineral", color: "#a8ada3" },
  pungent: { label: "Pungent", color: "#c25534" },
  cooling: { label: "Cooling", color: "#8cc2bd" },
  effervescent: { label: "Effervescent", color: "#c6dbdc" },
  fermented: { label: "Fermented", color: "#a98a52" },
  caramelized: { label: "Caramelized", color: "#b1743a" },
  nutty: { label: "Nutty", color: "#c39a6e" },
  green: { label: "Green", color: "#8fa757" },
  medicinal: { label: "Medicinal", color: "#9aa8b6" },
  bland: { label: "Bland", color: "#ddd6c4" },
  smoky: { label: "Smoky", color: "#737873" },
  cloying: { label: "Cloying", color: "#d79bb0" },

  // Material
  glass: { label: "Glass", color: "#b9d2d1" },
  metal: { label: "Metal", color: "#77817d" },
  wood: { label: "Wood", color: "#9a6947" },
  stone: { label: "Stone", color: "#8d8d80" },
  fabric: { label: "Fabric", color: "#9b7d79" },
  water: { label: "Water", color: "#6096a1" },
  smoke: { label: "Smoke", color: "#7a7d77" },
  rubber: { label: "Rubber", color: "#4d5650" },
  paper: { label: "Paper", color: "#d6cdb8" },
  clay: { label: "Clay", color: "#a9704f" },
  ice: { label: "Ice", color: "#aed3dd" },
  leather: { label: "Leather", color: "#8a5c3b" },
  plastic: { label: "Plastic", color: "#c2b6a6" },
  sand: { label: "Sand", color: "#cbb488" },
  crystal: { label: "Crystal", color: "#c3bcd4" },
  wax: { label: "Wax", color: "#e2d4ad" },
  bone: { label: "Bone", color: "#ddd6c1" },
  moss: { label: "Moss", color: "#6f8355" },
  concrete: { label: "Concrete", color: "#9a9a92" },
  foam: { label: "Foam", color: "#e4e6e0" },
  ash: { label: "Ash", color: "#a3a099" },
  amber: { label: "Amber", color: "#c08a33" },

  // Scent
  floral: { label: "Floral", color: "#c98588" },
  citrus: { label: "Citrus", color: "#d9a83e" },
  woody: { label: "Woody", color: "#986849" },
  earthy: { label: "Earthy", color: "#77704f" },
  herbal: { label: "Herbal", color: "#668065" },
  spicy: { label: "Spicy", color: "#b56b45" },
  oceanic: { label: "Oceanic", color: "#57909b" },
  gourmand: { label: "Gourmand", color: "#d2ab6f" },
  musky: { label: "Musky", color: "#8d7963" },
  ozonic: { label: "Ozonic", color: "#a7bcc4" },
  chemical: { label: "Chemical", color: "#9fb0a0" },
  animalic: { label: "Animalic", color: "#7d5a41" },
  dusty: { label: "Dusty", color: "#b6ad9a" },
  resinous: { label: "Resinous", color: "#a67c3e" },
  fruity: { label: "Fruity", color: "#c4737a" },
  minty: { label: "Minty", color: "#7fb49e" },
  putrid: { label: "Putrid", color: "#8a8f57" },

  // Shape
  circle: { label: "Circle", color: "#ba7655" },
  triangle: { label: "Triangle", color: "#ba7655" },
  square: { label: "Square", color: "#ba7655" },
  star: { label: "Star", color: "#c18b4f" },
  spiral: { label: "Spiral", color: "#ba7655" },
  wave: { label: "Wave", color: "#597c78" },
  line: { label: "Line", color: "#ba7655" },
  arc: { label: "Arc", color: "#ba7655" },
  ring: { label: "Ring", color: "#ba7655" },
  crescent: { label: "Crescent", color: "#8d8296" },
  hexagon: { label: "Hexagon", color: "#a98a52" },
  diamond: { label: "Diamond", color: "#ba7655" },
  cross: { label: "Cross", color: "#8d8d80" },
  zigzag: { label: "Zigzag", color: "#c18b4f" },
  grid: { label: "Grid", color: "#77817d" },
  burst: { label: "Burst", color: "#c25534" },
  knot: { label: "Knot", color: "#8a5c3b" },
  branch: { label: "Branch", color: "#6f8355" },
  cloud: { label: "Cloud", color: "#9eb8c6" },
  shard: { label: "Shard", color: "#8a949a" },

  no_association: { label: "No clear association", color: "#a9ada5" },
};

export interface VisualDatum {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly definition: string;
  readonly probability: number;
  readonly dominant: boolean;
}

export interface VisualProfile {
  readonly facet: Facet;
  readonly choice: string;
  /** Every candidate in taxonomy order. The artwork depends on this order; do not sort it. */
  readonly items: readonly VisualDatum[];
  /** The same candidates, most probable first. What a reader should be shown. */
  readonly ranked: readonly VisualDatum[];
  readonly secondary: readonly VisualDatum[];
}

export const toVisualProfile = (
  facet: Facet,
  success: Pick<FacetSuccess<string>, "choice" | "probabilities">,
): VisualProfile => {
  const items = TAXONOMIES[facet].map((candidate) => ({
    id: candidate.id,
    label: LABEL_META[candidate.id]?.label ?? candidate.id,
    color: LABEL_META[candidate.id]?.color ?? "#a9ada5",
    definition: candidate.definition,
    probability: success.probabilities[candidate.id] ?? 0,
    dominant: success.choice === candidate.id,
  }));
  return {
    facet,
    choice: success.choice,
    items,
    // Descending, with taxonomy position as the tie-break, matching `rankLabels` in the core.
    // The comparator is total, so the result does not depend on the sort's stability.
    ranked: items
      .map((item, index) => ({ item, index }))
      .sort((left, right) => right.item.probability - left.item.probability || left.index - right.index)
      .map((entry) => entry.item),
    secondary: items
      .filter((item) => item.id !== success.choice && item.id !== "no_association" && item.probability > 0)
      .sort((left, right) => right.probability - left.probability)
      .slice(0, 2),
  };
};

export const formatProbability = (probability: number): string => {
  if (probability === 0) return "0%";
  if (probability < 0.001) return "<0.1%";
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(probability);
};

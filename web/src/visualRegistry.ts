import { TAXONOMIES, type Facet } from "../../src/taxonomies.ts";
import type { FacetSuccess } from "../../src/types.ts";

export const FACET_META = {
  taste: { number: "01", title: "Taste", aria: "Taste association" },
  material: { number: "02", title: "Material", aria: "Material association" },
  smell: { number: "03", title: "Scent", aria: "Scent association" },
  shape: { number: "04", title: "Shape", aria: "Shape association" },
} as const;

export const LABEL_META: Record<string, { label: string; color: string }> = {
  sweet: { label: "Sweet", color: "#d8a03f" },
  sour: { label: "Sour", color: "#b7c749" },
  salty: { label: "Salty", color: "#9eb8c6" },
  bitter: { label: "Bitter", color: "#6d4c40" },
  umami: { label: "Umami", color: "#b06a45" },
  glass: { label: "Glass", color: "#b9d2d1" },
  metal: { label: "Metal", color: "#77817d" },
  wood: { label: "Wood", color: "#9a6947" },
  stone: { label: "Stone", color: "#8d8d80" },
  fabric: { label: "Fabric", color: "#9b7d79" },
  water: { label: "Water", color: "#6096a1" },
  smoke: { label: "Smoke", color: "#7a7d77" },
  rubber: { label: "Rubber", color: "#4d5650" },
  floral: { label: "Floral", color: "#c98588" },
  citrus: { label: "Citrus", color: "#d9a83e" },
  woody: { label: "Woody", color: "#986849" },
  earthy: { label: "Earthy", color: "#77704f" },
  smoky: { label: "Smoky", color: "#737873" },
  herbal: { label: "Herbal", color: "#668065" },
  spicy: { label: "Spicy", color: "#b56b45" },
  oceanic: { label: "Oceanic", color: "#57909b" },
  circle: { label: "Circle", color: "#ba7655" },
  triangle: { label: "Triangle", color: "#ba7655" },
  square: { label: "Square", color: "#ba7655" },
  star: { label: "Star", color: "#c18b4f" },
  spiral: { label: "Spiral", color: "#ba7655" },
  wave: { label: "Wave", color: "#597c78" },
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
  readonly items: readonly VisualDatum[];
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

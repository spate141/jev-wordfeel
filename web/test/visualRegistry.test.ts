import { describe, expect, it } from "vitest";

import { FACETS, TAXONOMIES, labelsFor } from "../../src/taxonomies.ts";
import { LABEL_META, formatProbability, toVisualProfile } from "../src/visualRegistry.ts";
import { makeSuccess } from "./fixtures.ts";

describe("visual profile", () => {
  it("keeps every candidate in taxonomy order with unchanged values", () => {
    const success = makeSuccess("taste", "sweet", { sweet: .9995, sour: .0005 });
    const profile = toVisualProfile("taste", success);
    expect(profile.items.map((item) => item.id)).toEqual(labelsFor("taste"));
    expect(profile.items.find((item) => item.id === "sour")?.probability).toBe(.0005);
    expect(profile.items.find((item) => item.id === "no_association")?.probability).toBe(0);
  });

  it("ranks most probable first while leaving items in taxonomy order", () => {
    const success = makeSuccess("shape", "no_association", { no_association: .49, circle: .24, star: .08, triangle: .04 });
    const profile = toVisualProfile("shape", success);

    expect(profile.items.map((item) => item.id)).toEqual(labelsFor("shape"));
    expect(profile.ranked.slice(0, 4).map((item) => item.id)).toEqual([
      "no_association", "circle", "star", "triangle",
    ]);
  });

  it("breaks ranking ties by taxonomy position", () => {
    const profile = toVisualProfile("shape", makeSuccess("shape", "circle", { circle: .3, star: .3, wave: .3, line: .1 }));
    expect(profile.ranked.slice(0, 4).map((item) => item.id)).toEqual(["circle", "star", "wave", "line"]);
  });

  it("formats zero and tiny nonzero probabilities distinctly", () => {
    expect(formatProbability(0)).toBe("0%");
    expect(formatProbability(.0005)).toBe("<0.1%");
    expect(formatProbability(.1234)).toBe("12.3%");
  });
});

describe("label metadata", () => {
  it("covers every candidate in every palette", () => {
    const uncovered = FACETS.flatMap((facet) =>
      TAXONOMIES[facet]
        .map((candidate) => candidate.id)
        .filter((id) => LABEL_META[id] === undefined)
        .map((id) => `${facet}/${id}`),
    );
    expect(uncovered).toEqual([]);
  });

  it("gives every label a display name and a hex color", () => {
    for (const [id, meta] of Object.entries(LABEL_META)) {
      expect(meta.label.length, id).toBeGreaterThan(0);
      expect(meta.color, id).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

import { describe, expect, it } from "vitest";

import { labelsFor } from "../../src/taxonomies.ts";
import { formatProbability, toVisualProfile } from "../src/visualRegistry.ts";
import { makeSuccess } from "./fixtures.ts";

describe("visual profile", () => {
  it("keeps every candidate in taxonomy order with unchanged values", () => {
    const success = makeSuccess("taste", "sweet", { sweet: .9995, sour: .0005 });
    const profile = toVisualProfile("taste", success);
    expect(profile.items.map((item) => item.id)).toEqual(labelsFor("taste"));
    expect(profile.items.find((item) => item.id === "sour")?.probability).toBe(.0005);
    expect(profile.items.find((item) => item.id === "no_association")?.probability).toBe(0);
  });

  it("formats zero and tiny nonzero probabilities distinctly", () => {
    expect(formatProbability(0)).toBe("0%");
    expect(formatProbability(.0005)).toBe("<0.1%");
    expect(formatProbability(.1234)).toBe("12.3%");
  });
});

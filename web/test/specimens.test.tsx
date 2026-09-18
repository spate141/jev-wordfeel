/**
 * Artwork coverage.
 *
 * Every palette grew past the point where a missing drawing would be noticed by eye, so this
 * renders each facet/label pair and asserts the artwork actually drew something. A label with no
 * entry in its facet's lookup renders an empty group and fails here.
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FACETS, labelsFor, type Facet } from "../../src/taxonomies.ts";
import { Specimen } from "../src/components/Specimens.tsx";
import { MATERIAL_COLORS, MATERIAL_TEXTURES } from "../src/components/specimens/material.tsx";
import { SCENT_MOTIFS } from "../src/components/specimens/scent.tsx";
import { SHAPES } from "../src/components/specimens/shape.tsx";
import { TASTE_MARKS } from "../src/components/specimens/taste.tsx";
import { toVisualProfile } from "../src/visualRegistry.ts";
import { makeSuccess } from "./fixtures.ts";

/** Paint-bearing elements. A `<g>` or `<defs>` alone means nothing was drawn. */
const DRAWN = "path, circle, ellipse, rect, polygon, line";

const profileFor = (facet: Facet, choice: string) =>
  toVisualProfile(facet, makeSuccess(facet, choice as never) as never);

describe("specimen artwork", () => {
  for (const facet of FACETS) {
    for (const label of labelsFor(facet)) {
      it(`draws ${facet}/${label}`, () => {
        const { container } = render(
          <Specimen profile={profileFor(facet, label)} staticMode idPrefix={`t-${facet}-${label}`} />,
        );
        const svg = container.querySelector("svg")!;
        expect(svg.querySelectorAll(DRAWN).length).toBeGreaterThan(0);
        expect(svg.querySelector("title")?.textContent).toBe(`${label} ${facet} specimen`);
      });
    }
  }

  it("gives each label its own artwork rather than repeating one drawing", () => {
    for (const facet of FACETS) {
      const drawings = labelsFor(facet)
        .filter((label) => label !== "no_association")
        .map((label) => {
          const { container } = render(
            <Specimen profile={profileFor(facet, label)} staticMode idPrefix="fixed" />,
          );
          return container.querySelector("svg")!.innerHTML;
        });
      expect(new Set(drawings).size, `${facet} artwork should differ per label`).toBe(drawings.length);
    }
  });

  it("keeps a hovered secondary layer bright while dimming the dominant artwork", () => {
    const shape = toVisualProfile("shape", makeSuccess("shape", "circle", { circle: 0.7, spiral: 0.3 }));
    const shapeRender = render(
      <Specimen profile={shape} highlighted="spiral" staticMode idPrefix="highlight-shape" />,
    );
    const shapeRoot = shapeRender.container.querySelector('g[transform="translate(120 105)"]')!;
    expect(shapeRoot.querySelector('g[stroke="#ba7655"]')).toHaveAttribute("opacity", "1");
    expect(shapeRoot.querySelector(":scope > g:last-child")).toHaveAttribute("opacity", "0.22");
    shapeRender.unmount();

    const scent = toVisualProfile("smell", makeSuccess("smell", "citrus", { citrus: 0.7, floral: 0.3 }));
    const scentRender = render(
      <Specimen profile={scent} highlighted="floral" staticMode idPrefix="highlight-scent" />,
    );
    expect(scentRender.container.querySelector('g[transform="translate(51 63)"]')).toHaveAttribute("opacity", "1");
    expect(scentRender.container.querySelector('circle[fill="url(#highlight-scent-scent-glow)"]')?.parentElement)
      .toHaveAttribute("opacity", "0.22");
  });

  // Taste, material and scent always draw their vessel, so a missing per-label entry would slip
  // past the render check above. These assert the lookups themselves.
  it.each([
    ["taste", TASTE_MARKS],
    ["material", MATERIAL_COLORS],
    ["material", MATERIAL_TEXTURES],
    ["smell", SCENT_MOTIFS],
    ["shape", SHAPES],
  ] as const)("%s lookup has an entry for every label", (facet, lookup) => {
    const missing = labelsFor(facet)
      .filter((label) => label !== "no_association")
      .filter((label) => !Object.hasOwn(lookup, label));
    expect(missing).toEqual([]);
  });
});

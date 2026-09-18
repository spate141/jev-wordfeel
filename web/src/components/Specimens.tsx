/**
 * The specimen figure for one facet.
 *
 * This module owns the frame — the SVG, its title, the entry animation, and the two states that
 * are not a label (nothing analyzed yet, and `no_association`). The artwork for each facet lives
 * in `./specimens/`, one module per facet, each keyed by label id.
 *
 * SVG ids are namespaced with `useId()` because `Postcard.tsx` renders all four artworks into a
 * single SVG, where a shared gradient or clip id would silently pull the wrong paint.
 */

import { useId } from "react";
import { motion } from "motion/react";

import type { VisualProfile } from "../visualRegistry.ts";
import { MaterialArtwork } from "./specimens/material.tsx";
import { ScentArtwork } from "./specimens/scent.tsx";
import { ShapeArtwork } from "./specimens/shape.tsx";
import { TasteArtwork } from "./specimens/taste.tsx";

interface SpecimenProps {
  readonly profile: VisualProfile | null;
  readonly highlighted?: string | null;
  readonly staticMode?: boolean;
  readonly idPrefix?: string;
}

export function Specimen({ profile, highlighted = null, staticMode = false, idPrefix }: SpecimenProps) {
  const reactId = useId().replace(/:/g, "");
  const prefix = idPrefix ?? `specimen-${reactId}`;
  const title = profile ? `${profile.choice} ${profile.facet} specimen` : "Awaiting an association";
  const content = (
    <svg className="specimen-svg" viewBox="0 0 240 210" role="img" aria-label={title}>
      <title>{title}</title>
      <SpecimenArtwork profile={profile} highlighted={highlighted} idPrefix={prefix} />
    </svg>
  );

  if (staticMode) return content;
  return (
    <motion.div
      className="specimen-motion"
      tabIndex={-1}
      key={profile?.choice ?? "empty"}
      initial={{ opacity: 0.55, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
    >
      {content}
    </motion.div>
  );
}

export function SpecimenArtwork({
  profile,
  highlighted,
  idPrefix,
}: Required<Pick<SpecimenProps, "idPrefix">> & Omit<SpecimenProps, "idPrefix" | "staticMode">) {
  if (!profile) return <EmptySpecimen />;
  if (profile.choice === "no_association") return <NeutralSpecimen />;
  const props = { profile, highlighted: highlighted ?? null, idPrefix };
  switch (profile.facet) {
    case "taste": return <TasteArtwork {...props} />;
    case "material": return <MaterialArtwork {...props} />;
    case "smell": return <ScentArtwork {...props} />;
    case "shape": return <ShapeArtwork {...props} />;
  }
}

const EmptySpecimen = () => (
  <g fill="none" stroke="#c3c7bc" strokeWidth="1.4">
    <ellipse cx="120" cy="169" rx="47" ry="7" fill="#8f968b" stroke="none" opacity=".08" />
    <circle cx="120" cy="104" r="57" strokeDasharray="2 7" />
    <circle cx="120" cy="104" r="39" strokeDasharray="1 9" opacity=".5" />
    <path d="M88 151 Q120 163 152 151" opacity=".38" />
    <circle cx="120" cy="104" r="2.5" fill="#aeb3a8" stroke="none" opacity=".58" />
  </g>
);

const NeutralSpecimen = () => (
  <g>
    <ellipse cx="120" cy="174" rx="49" ry="8" fill="#6d746b" opacity=".1" />
    <circle cx="120" cy="104" r="58" fill="#e3e4db" stroke="#b9bdb3" strokeWidth="1.4" />
    <circle cx="120" cy="104" r="45" fill="none" stroke="#c5c8bf" strokeDasharray="1 7" />
    <path d="M80 105 C99 85 141 85 160 105 C141 125 99 125 80 105Z" fill="#f1f1ea" fillOpacity=".56" stroke="#969c92" strokeDasharray="3 6" />
    <circle cx="120" cy="105" r="5" fill="#969c92" />
    <circle cx="118.5" cy="103.5" r="1.5" fill="#f7f7f2" opacity=".8" />
  </g>
);

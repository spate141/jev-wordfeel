/**
 * Pieces every facet's artwork needs.
 *
 * Each facet module exports one artwork component plus a lookup keyed by label id. A lookup is a
 * plain `Record`, not an if-chain: with twenty-odd labels per facet a missing entry has to be
 * findable, and `specimens.test.tsx` renders every facet/label pair to prove none is.
 */

import type { VisualDatum, VisualProfile } from "../../visualRegistry.ts";

export interface ArtworkProps {
  readonly profile: VisualProfile;
  readonly highlighted: string | null;
  readonly idPrefix: string;
}

/** Isolate the hovered layer, so even a low-probability association reads on the specimen. */
export const layerOpacity = (id: string, highlighted: string | null, base = 1): number => {
  if (!highlighted) return base;
  return highlighted === id ? 1 : base * 0.22;
};

/** The chosen label's datum. Every profile reaching an artwork has one. */
export const dominantOf = (profile: VisualProfile): VisualDatum =>
  profile.items.find((item) => item.dominant)!;

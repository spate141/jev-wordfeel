import { forwardRef, useEffect, useState } from "react";

import type { AnalysisResult, Facet, FacetSuccess } from "../../../src/types.ts";
import { FACETS } from "../../../src/taxonomies.ts";
import { FACET_META, formatProbability, toVisualProfile } from "../visualRegistry.ts";
import { SpecimenArtwork } from "./Specimens.tsx";

/** The saved image mirrors the screen: four panels in a row on desktop, a 2x2 grid on narrow screens. */
export type PostcardLayout = "row" | "grid";

const PANEL = { width: 342, height: 560 };
const SHEET = {
  row: { width: 1600, height: 1000, top: 300, columns: 4, columnGap: 24, rowGap: 0 },
  grid: { width: 900, height: 1568, top: 300, columns: 2, columnGap: 40, rowGap: 44 },
} as const satisfies Record<PostcardLayout, {
  readonly width: number; readonly height: number; readonly top: number;
  readonly columns: number; readonly columnGap: number; readonly rowGap: number;
}>;

/** Matches the breakpoint where the cabinet on screen folds into two columns. */
const MOBILE_QUERY = "(max-width: 959px)";

/** Absent in non-browser render targets, so the hook falls back to the wide layout. */
const mobileQuery = (): MediaQueryList | null =>
  typeof window === "undefined" || typeof window.matchMedia !== "function" ? null : window.matchMedia(MOBILE_QUERY);

export const usePostcardLayout = (): PostcardLayout => {
  const [layout, setLayout] = useState<PostcardLayout>(() => (mobileQuery()?.matches ? "grid" : "row"));
  useEffect(() => {
    const query = mobileQuery();
    if (!query) return;
    const sync = () => setLayout(query.matches ? "grid" : "row");
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return layout;
};

export const Postcard = forwardRef<SVGSVGElement, { readonly result: AnalysisResult; readonly layout?: PostcardLayout }>(
  function Postcard({ result, layout = "row" }, ref) {
    const sheet = SHEET[layout];
    return (
      <svg
        ref={ref}
        className="postcard-source"
        viewBox={`0 0 ${sheet.width} ${sheet.height}`}
        width={sheet.width}
        height={sheet.height}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width={sheet.width} height={sheet.height} fill="#f5f2eb" />
        <text x="92" y="96" fill="#3e5840" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="700" letterSpacing="5">WORDFEEL</text>
        <text x="92" y="190" fill="#292d28" fontFamily="Georgia, serif" fontSize="76">{result.normalized_input}</text>
        <text x="92" y="238" fill="#62685e" fontFamily="Arial, sans-serif" fontSize="24">A playful interpretation by Jev.</text>
        {FACETS.map((facet, index) => <PostcardPanel key={facet} facet={facet} index={index} layout={layout} result={result} />)}
        {/* The saved file travels on its own, so it carries the byline the site footer shows. */}
        <text x="92" y={sheet.height - 54} fill="#62685e" fontFamily="Arial, sans-serif" fontSize="18">
          Made by <tspan fontWeight="700" fill="#292d28">Snehal Patel</tspan> · https://snehal.ai/
        </text>
        {/* The narrow sheet has no room for both lines side by side, so the tagline sits above the byline. */}
        <text
          x={layout === "grid" ? 92 : sheet.width - 92}
          y={sheet.height - (layout === "grid" ? 88 : 54)}
          textAnchor={layout === "grid" ? "start" : "end"}
          fill="#777c73"
          fontFamily="Arial, sans-serif"
          fontSize="18"
        >wordfeel · taste it, touch it, smell it, see it</text>
      </svg>
    );
  },
);

const PostcardPanel = ({ facet, index, layout, result }: { readonly facet: Facet; readonly index: number; readonly layout: PostcardLayout; readonly result: AnalysisResult }) => {
  const sheet = SHEET[layout];
  const x = 88 + (index % sheet.columns) * (PANEL.width + sheet.columnGap);
  const y = sheet.top + Math.floor(index / sheet.columns) * (PANEL.height + sheet.rowGap);
  const facetResult = result.facets[facet];
  const profile = facetResult.status === "ok"
    ? toVisualProfile(facet, facetResult as unknown as FacetSuccess<string>)
    : null;
  const dominant = profile?.items.find((item) => item.dominant);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={PANEL.width} height={PANEL.height} rx="28" fill="#eeeee5" stroke="#d8dacf" />
      <text x="28" y="47" fill="#62685e" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="700" letterSpacing="3">{FACET_META[facet].number}  {FACET_META[facet].title.toUpperCase()}</text>
      <svg x="51" y="70" width="240" height="210" viewBox="0 0 240 210">
        <SpecimenArtwork profile={profile} highlighted={null} idPrefix={`postcard-${facet}`} />
      </svg>
      <text x="28" y="347" fill="#292d28" fontFamily="Georgia, serif" fontSize="42">{dominant?.label ?? "Unavailable"}</text>
      <text x="28" y="388" fill="#62685e" fontFamily="Arial, sans-serif" fontSize="18">{dominant ? `Association probability ${formatProbability(dominant.probability)}` : "This sense did not answer"}</text>
      {profile && <Ribbon profile={profile} />}
    </g>
  );
};

const Ribbon = ({ profile }: { readonly profile: ReturnType<typeof toVisualProfile> }) => {
  let x = 28;
  return <g>{profile.items.map((item) => {
    const width = item.probability * 286;
    const segment = <rect key={item.id} x={x} y="424" width={width} height="8" fill={item.color} />;
    x += width;
    return segment;
  })}</g>;
};

export const downloadPostcard = (svg: SVGSVGElement, word: string): void => {
  const source = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${source}`], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wordfeel-${safeFilename(word)}.svg`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const safeFilename = (value: string): string => {
  const safe = value.normalize("NFKD").replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase();
  return safe.slice(0, 48) || "specimen";
};

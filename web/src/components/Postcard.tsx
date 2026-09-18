import { forwardRef } from "react";

import type { AnalysisResult, Facet, FacetSuccess } from "../../../src/types.ts";
import { FACETS } from "../../../src/taxonomies.ts";
import { FACET_META, formatProbability, toVisualProfile } from "../visualRegistry.ts";
import { SpecimenArtwork } from "./Specimens.tsx";

export const Postcard = forwardRef<SVGSVGElement, { readonly result: AnalysisResult }>(
  function Postcard({ result }, ref) {
    return (
      <svg
        ref={ref}
        className="postcard-source"
        viewBox="0 0 1600 1000"
        width="1600"
        height="1000"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="1600" height="1000" fill="#f5f2eb" />
        <text x="92" y="96" fill="#3e5840" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="700" letterSpacing="5">WORDFEEL</text>
        <text x="92" y="190" fill="#292d28" fontFamily="Georgia, serif" fontSize="76">{result.normalized_input}</text>
        <text x="92" y="238" fill="#62685e" fontFamily="Arial, sans-serif" fontSize="24">A playful interpretation by Jev.</text>
        {FACETS.map((facet, index) => <PostcardPanel key={facet} facet={facet} index={index} result={result} />)}
        {/* The saved file travels on its own, so it carries the byline the site footer shows. */}
        <text x="92" y="946" fill="#62685e" fontFamily="Arial, sans-serif" fontSize="18">
          Made by <tspan fontWeight="700" fill="#292d28">Snehal Patel</tspan> · https://snehal.ai/
        </text>
        <text x="1508" y="946" textAnchor="end" fill="#777c73" fontFamily="Arial, sans-serif" fontSize="18">wordfeel · taste it, touch it, smell it, see it</text>
      </svg>
    );
  },
);

const PostcardPanel = ({ facet, index, result }: { readonly facet: Facet; readonly index: number; readonly result: AnalysisResult }) => {
  const x = 88 + index * 366;
  const facetResult = result.facets[facet];
  const profile = facetResult.status === "ok"
    ? toVisualProfile(facet, facetResult as unknown as FacetSuccess<string>)
    : null;
  const dominant = profile?.items.find((item) => item.dominant);
  return (
    <g transform={`translate(${x} 300)`}>
      <rect width="342" height="560" rx="28" fill="#eeeee5" stroke="#d8dacf" />
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

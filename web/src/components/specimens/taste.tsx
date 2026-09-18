/**
 * Taste specimens.
 *
 * The droplet silhouette and its probability-height bands are the constant: every taste fills
 * the same vessel, so two words can be compared at a glance. `TASTE_MARKS` is what changes —
 * one small mark per flavor, drawn over the bands inside the droplet's bounds
 * (x 66..178, y 31..175).
 */

import type { ReactNode } from "react";

import { dominantOf, layerOpacity, type ArtworkProps } from "./shared.ts";

const DROPLET = "M120 31 C145 58 178 85 174 121 C170 157 148 174 119 175 C87 176 66 157 66 126 C66 94 94 62 120 31Z";

/** A ring of short strokes pointing inward, for the pull of a drying flavor. */
const inwardTicks = (): readonly string[] =>
  Array.from({ length: 8 }, (_unused, index) => {
    const angle = (index * 2 * Math.PI) / 8;
    const x = 120 + Math.cos(angle) * 44;
    const y = 108 + Math.sin(angle) * 44;
    return `M${x.toFixed(1)} ${y.toFixed(1)}L${(120 + Math.cos(angle) * 26).toFixed(1)} ${(108 + Math.sin(angle) * 26).toFixed(1)}`;
  });

const bubbles = (seed: readonly (readonly [number, number, number])[], fill: string, opacity: string): ReactNode => (
  <g fill="none" stroke={fill} strokeWidth="1.6" opacity={opacity}>
    {seed.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />)}
  </g>
);

/** The mark laid over the bands for each taste. */
export const TASTE_MARKS: Record<string, ReactNode> = {
  sweet: <circle cx="141" cy="73" r="8" fill="#fff4c9" opacity=".44" />,
  sour: (
    <g fill="none" stroke="#fbffe2" strokeLinecap="round" opacity=".8">
      <path d="M134 66 Q157 88 146 112" strokeWidth="5" />
      <path d="M100 96 Q88 116 96 136" strokeWidth="3" opacity=".6" />
    </g>
  ),
  salty: (
    <g fill="#eef5f5" opacity=".78">
      <path d="M136 77l6 5-5 7-7-5z" /><path d="M149 103l5 4-4 6-6-4z" /><path d="M128 120l4 3-3 5-5-3z" />
    </g>
  ),
  bitter: <path d="M89 143 Q120 155 153 137" fill="none" stroke="#342823" strokeWidth="4" opacity=".28" />,
  umami: <ellipse cx="137" cy="118" rx="20" ry="13" fill="#713f2c" opacity=".16" />,
  fatty: (
    <g fill="#fff6d8" opacity=".38">
      <ellipse cx="103" cy="96" rx="15" ry="9" transform="rotate(-18 103 96)" />
      <ellipse cx="139" cy="122" rx="11" ry="7" transform="rotate(12 139 122)" />
      <ellipse cx="127" cy="80" rx="8" ry="5" />
    </g>
  ),
  astringent: (
    <g fill="none" stroke="#5c4b33" strokeWidth="2.4" strokeLinecap="round" opacity=".42">
      {inwardTicks().map((d) => <path key={d} d={d} />)}
    </g>
  ),
  metallic: (
    <g opacity=".6">
      <path d="M96 128 L158 72" stroke="#f4f8f8" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M112 141 L141 115" stroke="#f4f8f8" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".6" />
    </g>
  ),
  mineral: (
    <g fill="#f0efe4" opacity=".55">
      {[[98, 88], [131, 76], [147, 108], [107, 126], [133, 141], [118, 103]].map(([cx, cy], index) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index % 2 ? 3.2 : 2} />
      ))}
    </g>
  ),
  pungent: (
    <g>
      <circle cx="122" cy="112" r="30" fill="#ffd9a0" opacity=".3" />
      <g fill="#ffb347" opacity=".62">
        <path d="M110 128 C104 112 120 108 114 92 C126 100 128 114 122 128Z" />
        <path d="M132 130 C128 118 140 114 136 102 C146 110 146 122 141 130Z" />
      </g>
    </g>
  ),
  cooling: (
    <g stroke="#e8feff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".72">
      {[0, 60, 120].map((angle) => (
        <path key={angle} d="M120 82V138" transform={`rotate(${angle} 120 110)`} />
      ))}
      {[0, 60, 120].map((angle) => (
        <g key={`tip-${angle}`} transform={`rotate(${angle} 120 110)`} strokeWidth="2">
          <path d="M120 88 L113 95 M120 88 L127 95" /><path d="M120 132 L113 125 M120 132 L127 125" />
        </g>
      ))}
    </g>
  ),
  effervescent: bubbles([[103, 132, 5], [120, 108, 7], [136, 128, 4], [128, 85, 5], [110, 92, 3.5], [144, 104, 3]], "#f2ffff", ".8"),
  fermented: (
    <g>
      {bubbles([[104, 124, 4], [113, 133, 2.6], [130, 127, 3.4], [138, 116, 2.2]], "#f6ecc8", ".7")}
      <path d="M92 96 C110 82 132 104 150 88" fill="none" stroke="#f6ecc8" strokeWidth="3" opacity=".45" />
    </g>
  ),
  caramelized: (
    <g>
      <path d="M72 138 C96 126 144 152 172 134 L172 172 L72 172Z" fill="#6a3a14" opacity=".3" />
      <path d="M96 84 C116 74 134 92 152 82" fill="none" stroke="#ffd79a" strokeWidth="3" opacity=".42" />
    </g>
  ),
  nutty: (
    <g fill="#6b4425" opacity=".3">
      <ellipse cx="108" cy="112" rx="17" ry="11" transform="rotate(-24 108 112)" />
      <ellipse cx="139" cy="94" rx="13" ry="8" transform="rotate(16 139 94)" />
    </g>
  ),
  green: (
    <g fill="none" stroke="#dff0b0" strokeWidth="3" strokeLinecap="round" opacity=".68">
      <path d="M104 148 C110 118 124 96 146 80" />
      <path d="M116 120 C124 112 138 110 148 114" />
      <path d="M110 136 C102 128 98 116 100 106" />
    </g>
  ),
  medicinal: (
    <g stroke="#e9f2f7" strokeWidth="6" strokeLinecap="round" opacity=".62">
      <path d="M120 86V132" /><path d="M97 109H143" />
    </g>
  ),
  bland: <path d="M86 112H154" stroke="#efe9d8" strokeWidth="3" opacity=".42" />,
  smoky: (
    <g fill="none" stroke="#e8e9e3" strokeWidth="9" strokeLinecap="round" opacity=".26">
      <path d="M104 156 C88 132 126 124 110 98 C103 87 114 76 124 70" />
    </g>
  ),
  cloying: (
    <g fill="#ffe3ee" opacity=".72">
      <path d="M97 120 C97 136 107 144 107 156 C107 164 97 164 97 156 C97 144 87 136 87 120Z" />
      <path d="M137 106 C137 124 149 132 149 146 C149 155 137 155 137 146 C137 132 127 124 127 106Z" />
      <circle cx="119" cy="84" r="9" />
    </g>
  ),
};

export function TasteArtwork({ profile, highlighted, idPrefix }: ArtworkProps) {
  const clipId = `${idPrefix}-drop-clip`;
  const shadeId = `${idPrefix}-drop-shade`;
  let y = 167;
  const bands = profile.items
    .filter((item) => item.id !== "no_association" && item.probability > 0)
    .map((item) => {
      const height = item.probability * 128;
      y -= height;
      return (
        <rect
          key={item.id}
          x="62"
          y={y}
          width="116"
          height={height + 1}
          fill={item.color}
          opacity={layerOpacity(item.id, highlighted, 0.96)}
        />
      );
    });

  return (
    <g>
      <defs>
        <clipPath id={clipId}><path d={DROPLET} /></clipPath>
        <linearGradient id={shadeId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".48" />
          <stop offset=".48" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#392f28" stopOpacity=".22" />
        </linearGradient>
      </defs>
      <ellipse cx="121" cy="178" rx="49" ry="8" fill="#6d6252" opacity=".13" />
      <g clipPath={`url(#${clipId})`}>
        <rect x="62" y="31" width="116" height="144" fill={dominantOf(profile).color} opacity=".2" />
        {bands}
        <rect x="62" y="30" width="118" height="146" fill={`url(#${shadeId})`} />
        <g opacity={layerOpacity(dominantOf(profile).id, highlighted)}>
          {TASTE_MARKS[profile.choice]}
        </g>
      </g>
      <path d={DROPLET} fill="none" stroke="#494a42" strokeOpacity=".24" strokeWidth="1.2" />
      <path d="M93 72 C83 89 77 106 79 123" fill="none" stroke="#fff" strokeOpacity=".62" strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}

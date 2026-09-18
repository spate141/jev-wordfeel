/**
 * Scent specimens.
 *
 * A scent has no silhouette, so the constant here is a soft radial glow in the chosen family's
 * color, with a motif floating in it and drifting particles around the edge. Each motif takes
 * the dominant color so the panel stays one hue.
 */

import type { ReactNode } from "react";

import { dominantOf, layerOpacity, type ArtworkProps } from "./shared.ts";

const PARTICLES = [[50, 105, 2], [65, 53, 1.8], [92, 34, 1.2], [160, 48, 2], [183, 91, 1.4], [177, 150, 2], [72, 159, 1.3], [129, 178, 1.7]] as const;

/** Rising curls, for the families that read as something lifting off a surface. */
const curls = (color: string, width: number, opacity: string): ReactNode => (
  <g fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity}>
    <path d="M95 150 C68 119 129 108 98 73 C83 56 106 41 118 35" />
    <path d="M134 158 C165 127 111 108 146 77 C159 65 149 48 139 41" />
  </g>
);

/** The motif drawn inside the glow, per scent family. */
export const SCENT_MOTIFS: Record<string, (color: string) => ReactNode> = {
  floral: (color) => (
    <g transform="translate(120 106)">
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <ellipse key={angle} transform={`rotate(${angle}) translate(0 -25)`} rx="15" ry="29" fill={color} opacity=".66" />
      ))}
      <circle r="18" fill="#d7aa62" />
    </g>
  ),
  citrus: (color) => (
    <g transform="translate(120 106)" fill="none" stroke={color} strokeWidth="5">
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <path key={angle} transform={`rotate(${angle})`} d="M0 0 Q18-8 30 0 Q18 18 0 0Z" />
      ))}
      <circle r="11" fill={color} stroke="none" />
    </g>
  ),
  woody: (color) => (
    <g fill="none" stroke={color} strokeWidth="4" opacity=".78">
      <ellipse cx="120" cy="107" rx="45" ry="33" /><ellipse cx="120" cy="107" rx="30" ry="21" />
      <ellipse cx="120" cy="107" rx="14" ry="9" /><path d="M77 111 Q108 94 164 106" />
    </g>
  ),
  earthy: (color) => (
    <g fill={color}>
      <ellipse cx="100" cy="119" rx="29" ry="22" opacity=".68" />
      <ellipse cx="136" cy="101" rx="31" ry="27" opacity=".55" />
      <ellipse cx="141" cy="132" rx="22" ry="15" opacity=".76" />
    </g>
  ),
  smoky: (color) => curls(color, 12, ".48"),
  herbal: (color) => (
    <g transform="translate(120 112)" fill={color}>
      {[-52, -26, 0, 26, 52].map((angle, index) => (
        <path key={angle} transform={`rotate(${angle}) translate(0 -22)`} d="M0 7 C-22-7-18-35 0-43 C18-35 22-7 0 7Z" opacity={0.52 + index * 0.07} />
      ))}
    </g>
  ),
  spicy: (color) => (
    <g transform="translate(120 106)" fill={color}>
      {[0, 45, 90, 135].map((angle) => (
        <path key={angle} transform={`rotate(${angle})`} d="M0-48 L8-13 L35-35 L13-8 L48 0 L13 8 L35 35 L8 13 L0 48 L-8 13 L-35 35 L-13 8 L-48 0 L-13-8 L-35-35 L-8-13Z" opacity=".28" />
      ))}
      <circle r="18" opacity=".72" />
    </g>
  ),
  oceanic: (color) => (
    <g fill="none" stroke={color} strokeWidth="5" strokeLinecap="round">
      <path d="M62 112 Q91 80 120 112 T178 112" />
      <path d="M76 136 Q98 112 120 136 T164 136" opacity=".6" />
      <path d="M83 83 Q102 63 121 83 T159 83" opacity=".42" />
    </g>
  ),
  gourmand: (color) => (
    <g>
      <path d="M74 138 C74 112 94 96 120 96 C146 96 166 112 166 138Z" fill={color} opacity=".62" />
      <path d="M74 138 H166" stroke={color} strokeWidth="6" strokeLinecap="round" />
      {curls(color, 6, ".34")}
    </g>
  ),
  musky: (color) => (
    <g fill={color}>
      <ellipse cx="120" cy="120" rx="52" ry="30" opacity=".5" />
      <ellipse cx="120" cy="104" rx="38" ry="24" opacity=".42" />
      <ellipse cx="120" cy="90" rx="24" ry="16" opacity=".34" />
    </g>
  ),
  ozonic: (color) => (
    <g fill="none" stroke={color} strokeLinecap="round">
      <g strokeWidth="3" opacity=".62">
        <path d="M62 78 H150" /><path d="M74 96 H176" /><path d="M66 114 H142" />
      </g>
      <path d="M128 64 L108 108 H128 L106 152" strokeWidth="5" opacity=".9" />
    </g>
  ),
  chemical: (color) => (
    <g>
      <path d="M108 52 H132 V84 L156 144 A8 8 0 0 1 148 156 H92 A8 8 0 0 1 84 144 L108 84Z" fill="none" stroke={color} strokeWidth="5" />
      <path d="M96 118 H144 L156 144 A8 8 0 0 1 148 156 H92 A8 8 0 0 1 84 144Z" fill={color} opacity=".45" />
      <circle cx="110" cy="136" r="4" fill={color} opacity=".8" />
      <circle cx="130" cy="144" r="3" fill={color} opacity=".8" />
    </g>
  ),
  animalic: (color) => (
    <g fill={color}>
      <path d="M78 74 L92 112 L74 122Z" opacity=".7" /><path d="M162 74 L148 112 L166 122Z" opacity=".7" />
      <ellipse cx="120" cy="122" rx="42" ry="34" opacity=".62" />
      <g fill="#3a2b20" opacity=".5"><circle cx="105" cy="115" r="4" /><circle cx="135" cy="115" r="4" /><ellipse cx="120" cy="134" rx="7" ry="5" /></g>
    </g>
  ),
  dusty: (color) => (
    <g>
      <g fill="none" stroke={color} strokeWidth="4" opacity=".7">
        <path d="M70 130 C92 118 108 122 120 130 C132 122 148 118 170 130" />
        <path d="M70 130 V86 C92 74 108 78 120 86 C132 78 148 74 170 86 V130" />
        <path d="M120 86 V130" />
      </g>
      <g fill={color} opacity=".4">
        {[[86, 62], [104, 50], [140, 56], [158, 68], [122, 44]].map(([cx, cy], index) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index % 2 ? 3 : 1.8} />
        ))}
      </g>
    </g>
  ),
  resinous: (color) => (
    <g>
      <path d="M120 44 L150 108 L120 96 L90 108Z" fill={color} opacity=".5" />
      <path d="M120 96 C120 124 134 134 134 150 C134 160 120 160 120 150 C120 134 106 124 106 96Z" fill={color} opacity=".72" />
      {curls(color, 5, ".28")}
    </g>
  ),
  fruity: (color) => (
    <g>
      <circle cx="108" cy="122" r="32" fill={color} opacity=".66" />
      <circle cx="144" cy="110" r="24" fill={color} opacity=".5" />
      <path d="M108 90 C110 74 122 66 136 64" fill="none" stroke="#6f8355" strokeWidth="4" strokeLinecap="round" />
      <path d="M116 78 C128 70 142 72 150 82 C138 90 124 88 116 78Z" fill="#6f8355" opacity=".7" />
    </g>
  ),
  minty: (color) => (
    <g transform="translate(120 108)" fill={color}>
      {[-34, 0, 34].map((angle, index) => (
        <g key={angle} transform={`rotate(${angle})`} opacity={0.56 + index * 0.1}>
          <path d="M0 10 C-24-6-20-38 0-48 C20-38 24-6 0 10Z" />
          <path d="M0 10 V-44" stroke="#f2fbf4" strokeOpacity=".5" strokeWidth="2" fill="none" />
        </g>
      ))}
    </g>
  ),
  fermented: (color) => (
    <g>
      <path d="M104 46 H136 V78 C160 92 162 128 148 148 H92 C78 128 80 92 104 78Z" fill="none" stroke={color} strokeWidth="5" />
      <path d="M86 112 C104 104 136 120 154 110 V138 C150 148 142 152 132 152 H108 C96 152 88 146 86 136Z" fill={color} opacity=".5" />
      <g fill="none" stroke={color} strokeWidth="1.8" opacity=".8">
        <circle cx="106" cy="126" r="4" /><circle cx="122" cy="118" r="3" /><circle cx="136" cy="130" r="3.6" />
      </g>
    </g>
  ),
  metallic: (color) => (
    <g>
      <path d="M74 126 L158 114 L166 142 L82 154Z" fill={color} opacity=".66" />
      <path d="M74 126 L158 114" fill="none" stroke="#fdfdfb" strokeWidth="3" opacity=".5" />
      <g fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity=".85">
        <path d="M118 104 V62" /><path d="M96 108 L78 74" /><path d="M140 100 L162 70" />
        <path d="M104 106 L94 86" /><path d="M132 102 L146 84" />
      </g>
      <g fill={color} opacity=".6">
        <circle cx="118" cy="52" r="3" /><circle cx="72" cy="64" r="2.4" /><circle cx="170" cy="58" r="2.6" />
      </g>
    </g>
  ),
  putrid: (color) => (
    <g>
      <g fill={color} opacity=".6">
        <ellipse cx="104" cy="126" rx="30" ry="24" /><ellipse cx="142" cy="116" rx="24" ry="20" />
        <ellipse cx="124" cy="146" rx="22" ry="14" />
      </g>
      <g fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity=".55">
        <path d="M92 90 C86 74 98 66 94 52" /><path d="M120 84 C114 66 126 58 122 44" /><path d="M148 92 C142 78 152 70 148 58" />
      </g>
    </g>
  ),
};

export function ScentArtwork({ profile, highlighted, idPrefix }: ArtworkProps) {
  const dominant = dominantOf(profile);
  const glowId = `${idPrefix}-scent-glow`;
  return (
    <g>
      <defs>
        <radialGradient id={glowId}>
          <stop stopColor={dominant.color} stopOpacity=".48" />
          <stop offset="1" stopColor={dominant.color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity={layerOpacity(dominant.id, highlighted)}>
        <circle cx="120" cy="108" r="62" fill={`url(#${glowId})`} />
        {SCENT_MOTIFS[profile.choice]?.(dominant.color)}
        <g fill={dominant.color} opacity=".46">
          {PARTICLES.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />)}
        </g>
      </g>
      {profile.secondary.map((item, index) => (
        <g
          key={item.id}
          transform={`translate(${index === 0 ? 51 : 174} ${index === 0 ? 63 : 142})`}
          opacity={layerOpacity(item.id, highlighted, Math.max(0.18, item.probability))}
        >
          <circle r="10" fill={item.color} opacity=".32" />
          <path d="M-7 2 Q0-11 7 2 Q0 11-7 2Z" fill={item.color} />
        </g>
      ))}
    </g>
  );
}

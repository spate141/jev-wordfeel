/**
 * Material specimens.
 *
 * Every material is the same sphere, lit from the same angle. What changes is the three-stop
 * gradient it is made of and the texture clipped inside it, so the facet reads as one series of
 * samples rather than twenty-two unrelated drawings.
 */

import type { ReactNode } from "react";

import { dominantOf, layerOpacity, type ArtworkProps } from "./shared.ts";

/** Highlight, body, and shadow stops for each material's sphere. */
export const MATERIAL_COLORS: Record<string, readonly [string, string, string]> = {
  glass: ["#f5ffff", "#b7d4d1", "#6d9996"],
  metal: ["#e8eeeb", "#7d8986", "#3f4b49"],
  wood: ["#d4a06b", "#9a6745", "#5d3d2f"],
  stone: ["#c1c0b2", "#85877d", "#5d625d"],
  fabric: ["#c4aaa4", "#92736f", "#66514f"],
  water: ["#c8e4df", "#669ea8", "#366d77"],
  smoke: ["#d2d5cf", "#898e88", "#5e635f"],
  rubber: ["#78827b", "#4c554f", "#303632"],
  paper: ["#f4eede", "#d6cdb8", "#a1977f"],
  clay: ["#d99b73", "#a9704f", "#6f4530"],
  ice: ["#eafaff", "#aed3dd", "#6b98a8"],
  leather: ["#c08a5e", "#8a5c3b", "#4e3222"],
  plastic: ["#e6ded2", "#c2b6a6", "#8b8173"],
  sand: ["#eddcb6", "#cbb488", "#95805a"],
  crystal: ["#ece8f5", "#c3bcd4", "#867ea0"],
  wax: ["#f6ecc9", "#e2d4ad", "#ab9a71"],
  bone: ["#f2ecd9", "#ddd6c1", "#a49c85"],
  moss: ["#9bb37a", "#6f8355", "#41512f"],
  concrete: ["#c4c4bc", "#9a9a92", "#65655f"],
  foam: ["#ffffff", "#e4e6e0", "#adb0aa"],
  ash: ["#cfccc4", "#a3a099", "#6d6a65"],
  amber: ["#eec377", "#c08a33", "#7a5214"],
};

const speckle = (points: readonly (readonly [number, number])[], fill: string, opacity: string): ReactNode => (
  <g fill={fill} opacity={opacity}>
    {points.map(([cx, cy], index) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index % 2 ? 2.2 : 1.4} />)}
  </g>
);

const STONE_SPECKS = [[84, 74], [106, 57], [151, 76], [91, 116], [139, 111], [111, 143], [157, 135]] as const;
const CONCRETE_SPECKS = [[80, 92], [99, 66], [126, 60], [150, 88], [88, 130], [117, 122], [146, 126], [104, 152], [136, 150]] as const;
const SAND_SPECKS = [[70, 96], [86, 72], [104, 92], [122, 68], [140, 90], [158, 74], [78, 128], [98, 142], [118, 118], [138, 140], [156, 116], [110, 160], [132, 96]] as const;
const BONE_PORES = [[96, 84], [122, 72], [146, 96], [104, 118], [132, 124], [114, 148], [152, 132]] as const;

/** The texture clipped inside the sphere for each material. */
export const MATERIAL_TEXTURES: Record<string, ReactNode> = {
  glass: <path d="M75 122 C105 106 127 82 167 75 L177 110 C139 108 116 143 79 148Z" fill="#efffff" opacity=".22" />,
  metal: <g fill="#fff" opacity=".25"><path d="M67 92 L169 62 L175 75 L70 108Z" /><path d="M74 132 L173 104 L177 112 L78 145Z" /></g>,
  wood: (
    <g fill="none" stroke="#533629" strokeOpacity=".38">
      <path d="M63 85 Q95 65 176 81" /><path d="M59 104 Q104 82 182 106" /><path d="M64 130 Q116 103 177 129" />
      <ellipse cx="122" cy="105" rx="19" ry="34" />
    </g>
  ),
  stone: speckle(STONE_SPECKS, "#3d453f", ".26"),
  fabric: null,
  water: (
    <g fill="none" stroke="#e9ffff" strokeOpacity=".52" strokeWidth="2">
      <path d="M53 101 Q83 84 112 101 T187 100" /><path d="M58 126 Q88 109 117 126 T182 125" />
    </g>
  ),
  smoke: (
    <g fill="none" stroke="#eef0ec" strokeOpacity=".28" strokeWidth="12" strokeLinecap="round">
      <path d="M85 142 C65 113 119 111 96 76 C86 61 104 51 115 47" />
      <path d="M133 154 C158 127 112 106 147 80 C157 71 151 57 142 50" />
    </g>
  ),
  rubber: <ellipse cx="123" cy="145" rx="40" ry="9" fill="#202722" opacity=".18" />,
  paper: (
    <g fill="none" stroke="#8d8672" strokeOpacity=".32">
      <path d="M58 118 L182 104" strokeWidth="1" /><path d="M58 132 L182 118" strokeWidth="1" />
      <path d="M120 43 L120 167" strokeWidth="1.6" strokeOpacity=".22" />
      <path d="M62 78 C96 70 140 86 180 74" strokeWidth="1" />
    </g>
  ),
  clay: (
    <g fill="none" stroke="#6b4028" strokeOpacity=".3" strokeWidth="2.4">
      <ellipse cx="120" cy="105" rx="52" ry="18" /><ellipse cx="120" cy="105" rx="36" ry="12" />
      <ellipse cx="120" cy="105" rx="20" ry="7" />
    </g>
  ),
  ice: (
    <g fill="none" stroke="#f4feff" strokeOpacity=".62" strokeWidth="2">
      <path d="M120 43 L120 167" /><path d="M72 72 L168 138" /><path d="M168 72 L72 138" />
      <path d="M120 78 L104 62 M120 78 L136 62 M120 132 L104 148 M120 132 L136 148" strokeWidth="1.4" />
    </g>
  ),
  leather: (
    <g fill="none" stroke="#3f2818" strokeOpacity=".28">
      <path d="M60 88 C88 78 104 100 130 90 C152 82 168 96 184 90" />
      <path d="M58 116 C84 106 100 128 126 118 C150 109 166 124 182 118" />
      <path d="M62 142 C86 134 102 154 128 145" />
      {speckle([[92, 100], [130, 128], [108, 82]], "#3f2818", ".3")}
    </g>
  ),
  plastic: <path d="M70 128 C100 114 128 92 172 86 L176 102 C136 108 110 138 74 146Z" fill="#fff" opacity=".2" />,
  sand: speckle(SAND_SPECKS, "#6d5a38", ".34"),
  crystal: (
    <g fill="none" stroke="#f3efff" strokeOpacity=".5" strokeWidth="1.8">
      <path d="M120 44 L160 96 L138 164 L100 162 L78 94Z" />
      <path d="M120 44 L120 162 M78 94 L138 164 M160 96 L100 162" />
    </g>
  ),
  wax: (
    <g fill="#fffbe9" opacity=".34">
      <path d="M96 52 C96 84 106 96 106 122 C106 134 96 134 96 122 C96 96 86 84 86 52Z" />
      <path d="M142 62 C142 92 152 104 152 128 C152 139 142 139 142 128 C142 104 132 92 132 62Z" />
    </g>
  ),
  bone: speckle(BONE_PORES, "#8d8467", ".3"),
  moss: (
    <g fill="#485c32" opacity=".34">
      {[[88, 88, 14], [118, 72, 11], [148, 96, 13], [96, 128, 12], [130, 124, 15], [156, 128, 9], [112, 152, 10]].map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </g>
  ),
  concrete: speckle(CONCRETE_SPECKS, "#4e4e48", ".3"),
  foam: (
    <g fill="none" stroke="#ffffff" strokeOpacity=".62" strokeWidth="1.6">
      {[[90, 82, 12], [118, 68, 9], [146, 86, 11], [78, 114, 10], [108, 106, 13], [140, 116, 10], [96, 144, 11], [128, 148, 9], [160, 120, 7]].map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </g>
  ),
  ash: (
    <g fill="#5f5c56" opacity=".3">
      {[[88, 80], [116, 66], [144, 90], [96, 120], [126, 114], [152, 124], [106, 148], [136, 152]].map(([cx, cy], index) => (
        <path key={`${cx}-${cy}`} d="M-7 0 L0-5 L7 0 L0 5Z" transform={`translate(${cx} ${cy}) rotate(${index * 37})`} />
      ))}
    </g>
  ),
  amber: (
    <g>
      <path d="M92 132 C108 108 122 120 140 96" fill="none" stroke="#5c3a0c" strokeOpacity=".3" strokeWidth="2" />
      <ellipse cx="126" cy="112" rx="11" ry="6" fill="#5c3a0c" opacity=".38" transform="rotate(-28 126 112)" />
      <ellipse cx="100" cy="88" rx="5" ry="3" fill="#5c3a0c" opacity=".3" />
    </g>
  ),
};

/** Materials whose surface earns the woven/brushed overlay pattern. */
const PATTERNED = new Set(["metal", "fabric", "paper", "concrete"]);

export function MaterialArtwork({ profile, highlighted, idPrefix }: ArtworkProps) {
  const clipId = `${idPrefix}-sphere`;
  const gradientId = `${idPrefix}-material-gradient`;
  const patternId = `${idPrefix}-material-pattern`;
  const dominant = dominantOf(profile);
  const colors = MATERIAL_COLORS[profile.choice] ?? [dominant.color, dominant.color, "#4b504b"];
  const woven = profile.choice === "fabric" || profile.choice === "paper";

  return (
    <g>
      <defs>
        <clipPath id={clipId}><circle cx="120" cy="105" r="62" /></clipPath>
        <radialGradient id={gradientId} cx="35%" cy="27%" r="78%">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset=".52" stopColor={colors[1]} />
          <stop offset="1" stopColor={colors[2]} />
        </radialGradient>
        <pattern id={patternId} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d={woven ? "M0 2H12M2 0V12" : "M0 4L12 1M0 10L12 7"} stroke="#fff" strokeOpacity=".18" strokeWidth="1" />
        </pattern>
      </defs>
      <ellipse cx="120" cy="177" rx="53" ry="9" fill="#495047" opacity=".14" />
      <g clipPath={`url(#${clipId})`}>
        <g opacity={layerOpacity(dominant.id, highlighted)}>
          <circle cx="120" cy="105" r="62" fill={`url(#${gradientId})`} />
          {PATTERNED.has(profile.choice) && <rect x="56" y="41" width="128" height="128" fill={`url(#${patternId})`} />}
          {MATERIAL_TEXTURES[profile.choice]}
        </g>
        {profile.secondary.map((item, index) => (
          <path
            key={item.id}
            d={index === 0 ? "M58 127 Q97 104 131 126 T185 120 V175 H55Z" : "M58 62 Q93 83 120 66 T183 73 V42 H58Z"}
            fill={item.color}
            opacity={layerOpacity(item.id, highlighted, Math.min(0.34, item.probability * 0.8))}
          />
        ))}
      </g>
      <circle cx="120" cy="105" r="62" fill="none" stroke="#40463f" strokeOpacity=".24" strokeWidth="1.4" />
      <path
        d="M87 69 C101 51 131 46 148 58"
        fill="none"
        stroke="#fff"
        strokeOpacity={layerOpacity(
          dominant.id,
          highlighted,
          profile.choice === "rubber" || profile.choice === "moss" || profile.choice === "ash" ? 0.2 : 0.58,
        )}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </g>
  );
}

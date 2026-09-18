/**
 * Shape specimens.
 *
 * One figure per label, drawn centred on the origin and translated into the 240x210 viewBox by
 * `ShapeArtwork`. Every label supplies two renderings: `primary`, a bold multi-layer figure for
 * the chosen label, and `outline`, a single thin contour used for the two runners-up behind it.
 *
 * Figures with regular geometry (polygons, rays, coils, forks) are generated rather than typed
 * out, so their proportions stay consistent with one another.
 */

import type { ReactNode } from "react";

import { dominantOf, layerOpacity, type ArtworkProps } from "./shared.ts";

/** The outer radius the figures are drawn to, so no shape reads as larger than the rest. */
const EXTENT = 62;

const polygonPath = (sides: number, radius: number, rotation = -Math.PI / 2): string =>
  Array.from({ length: sides }, (_unused, index) => {
    const angle = rotation + (index * 2 * Math.PI) / sides;
    return `${index === 0 ? "M" : "L"}${(Math.cos(angle) * radius).toFixed(2)} ${(Math.sin(angle) * radius).toFixed(2)}`;
  }).join(" ") + "Z";

const starPath = (outer: number, inner: number, points: number): string =>
  Array.from({ length: points * 2 }, (_unused, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    return `${index === 0 ? "M" : "L"}${(Math.cos(angle) * radius).toFixed(2)} ${(Math.sin(angle) * radius).toFixed(2)}`;
  }).join(" ") + "Z";

/** An Archimedean coil sampled as a polyline; `turns` sets how tightly it winds. */
const spiralPath = (radius = EXTENT, turns = 2.6): string => {
  const steps = 78;
  const total = turns * 2 * Math.PI;
  return Array.from({ length: steps + 1 }, (_unused, index) => {
    const angle = (index / steps) * total;
    const distance = 3 + (index / steps) * (radius - 3);
    return `${index === 0 ? "M" : "L"}${(Math.cos(angle) * distance).toFixed(2)} ${(Math.sin(angle) * distance).toFixed(2)}`;
  }).join(" ");
};

/** A trefoil: one line that crosses over and through itself without ever closing into a coil. */
const knotPath = (scale: number): string => {
  const steps = 96;
  return Array.from({ length: steps + 1 }, (_unused, index) => {
    const t = (index / steps) * 2 * Math.PI;
    const x = (Math.sin(t) + 2 * Math.sin(2 * t)) * scale;
    const y = (Math.cos(t) - 2 * Math.cos(2 * t)) * scale;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ") + "Z";
};

/** Open rays from a hollow centre. Alternating lengths keep it from reading as a sun icon. */
const burstRays = (count: number, inner: number, outer: number): readonly string[] =>
  Array.from({ length: count }, (_unused, index) => {
    const angle = (index * 2 * Math.PI) / count;
    const reach = index % 2 === 0 ? outer : outer * 0.68;
    return `M${(Math.cos(angle) * inner).toFixed(2)} ${(Math.sin(angle) * inner).toFixed(2)}L${(Math.cos(angle) * reach).toFixed(2)} ${(Math.sin(angle) * reach).toFixed(2)}`;
  });

/** A stem forking twice. Returns the segments trunk-first so a partial draw still reads. */
const branchSegments = (): readonly string[] => {
  const segments: string[] = ["M0 60V12"];
  const fork = (x: number, y: number, angle: number, length: number, depth: number): void => {
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;
    segments.push(`M${x.toFixed(2)} ${y.toFixed(2)}L${endX.toFixed(2)} ${endY.toFixed(2)}`);
    if (depth === 0) return;
    fork(endX, endY, angle - 0.55, length * 0.66, depth - 1);
    fork(endX, endY, angle + 0.55, length * 0.66, depth - 1);
  };
  fork(0, 12, -Math.PI / 2 - 0.42, 34, 1);
  fork(0, 12, -Math.PI / 2 + 0.42, 34, 1);
  return segments;
};

const gridLines = (positions: readonly number[], reach: number): readonly string[] => [
  ...positions.map((at) => `M${-reach} ${at}H${reach}`),
  ...positions.map((at) => `M${at} ${-reach}V${reach}`),
];

const GRID_POSITIONS = [-48, -16, 16, 48] as const;

const CLOUD = "M-48 22 A20 20 0 0 1-42-14 A26 26 0 0 1 0-33 A25 25 0 0 1 42-12 A19 19 0 0 1 48 22Z";

/** The long broken piece, and the chip that came off it. Together they read as a fracture. */
const SHARD = "M-2-64 L30-22 L22 30 L-8 64 L-28 22 L-20-26Z";
const SHARD_CHIP = "M38-8 L58 16 L42 44Z";

/**
 * A lune: the outer circle (r 56 at the origin) minus an overlapping one (r 52, centred 26 to
 * the right). The endpoints are their two intersections, so the two arcs meet cleanly at the horns.
 */
const CRESCENT = "M21.31-51.79 A56 56 0 1 0 21.31 51.79 A52 52 0 0 1 21.31-51.79Z";

/** Bold figure for the chosen label, and thin contour for a runner-up, per shape id. */
export const SHAPES: Record<string, { readonly primary: ReactNode; readonly outline: ReactNode }> = {
  circle: {
    primary: <g strokeWidth="5"><circle r="55" /><circle r="39" opacity=".3" /><circle r="24" opacity=".16" /></g>,
    outline: <circle r="64" />,
  },
  triangle: {
    primary: <g strokeWidth="5"><path d="M0-62 L57 40 L-57 40Z" /><path d="M0-40 L36 25 L-36 25Z" opacity=".25" /></g>,
    outline: <path d="M0-65 L60 42 L-60 42Z" />,
  },
  square: {
    primary: <g strokeWidth="5"><rect x="-50" y="-50" width="100" height="100" /><rect x="-34" y="-34" width="68" height="68" opacity=".25" /></g>,
    outline: <rect x="-53" y="-53" width="106" height="106" />,
  },
  star: {
    primary: <g strokeWidth="5"><path d={starPath(61, 27, 5)} /><path d={starPath(38, 17, 5)} opacity=".22" /></g>,
    outline: <path d={starPath(65, 29, 5)} />,
  },
  spiral: {
    primary: <path strokeWidth="5" d={spiralPath()} />,
    outline: <path d={spiralPath(64)} />,
  },
  wave: {
    primary: (
      <g strokeWidth="5">
        <path d="M-68-29 C-46-58-23 0 0-29 S46-58 68-29" />
        <path d="M-68 10 C-46-19-23 39 0 10 S46-19 68 10" opacity=".62" />
        <path d="M-68 47 C-46 18-23 76 0 47 S46 18 68 47" opacity=".3" />
      </g>
    ),
    outline: <path d="M-68 0 C-46-34-23 34 0 0 S46-34 68 0" />,
  },
  line: {
    primary: <g strokeWidth="7"><path d="M-64 0H64" /><path d="M-42 26H42" opacity=".24" /></g>,
    outline: <path d="M-66 0H66" />,
  },
  arc: {
    primary: (
      <g strokeWidth="5">
        <path d="M-60 32 A64 64 0 0 1 60 32" />
        <path d="M-40 34 A44 44 0 0 1 40 34" opacity=".28" />
      </g>
    ),
    outline: <path d="M-62 34 A66 66 0 0 1 62 34" />,
  },
  ring: {
    primary: <g><circle r="48" strokeWidth="16" /><circle r="62" strokeWidth="2" opacity=".32" /></g>,
    outline: <circle r="58" />,
  },
  crescent: {
    primary: <g strokeWidth="5"><path d={CRESCENT} /><path d={CRESCENT} opacity=".22" transform="scale(.6)" /></g>,
    outline: <path d={CRESCENT} />,
  },
  hexagon: {
    primary: (
      <g strokeWidth="5">
        <path d={polygonPath(6, 60, 0)} />
        <path d={polygonPath(6, 34, 0)} opacity=".26" />
      </g>
    ),
    outline: <path d={polygonPath(6, 62, 0)} />,
  },
  diamond: {
    primary: <g strokeWidth="5"><path d="M0-62 L44 0 L0 62 L-44 0Z" /><path d="M0-38 L27 0 L0 38 L-27 0Z" opacity=".25" /></g>,
    outline: <path d="M0-65 L46 0 L0 65 L-46 0Z" />,
  },
  cross: {
    primary: <g strokeWidth="9"><path d="M0-60V60" /><path d="M-60 0H60" /><path d="M0-34V34" opacity=".2" strokeWidth="24" /></g>,
    outline: <g><path d="M0-62V62" /><path d="M-62 0H62" /></g>,
  },
  zigzag: {
    primary: (
      <g strokeWidth="6">
        <path d="M-64-34 L-38 16 L-12-34 L14 16 L40-34 L64 16" />
        <path d="M-64 14 L-38 58 L-12 14 L14 58 L40 14 L64 58" opacity=".28" />
      </g>
    ),
    outline: <path d="M-64-22 L-38 22 L-12-22 L14 22 L40-22 L64 22" />,
  },
  grid: {
    primary: (
      <g strokeWidth="4">
        {gridLines([...GRID_POSITIONS], 58).map((d, index) => (
          <path key={d} d={d} opacity={index % 4 === 0 ? 0.5 : 1} />
        ))}
      </g>
    ),
    outline: <g>{gridLines([...GRID_POSITIONS], 58).map((d) => <path key={d} d={d} />)}</g>,
  },
  burst: {
    primary: (
      <g strokeWidth="5" strokeLinecap="round">
        {burstRays(12, 16, 64).map((d) => <path key={d} d={d} />)}
        <circle r="10" opacity=".3" />
      </g>
    ),
    outline: <g>{burstRays(12, 16, 64).map((d) => <path key={d} d={d} />)}</g>,
  },
  knot: {
    primary: <g strokeWidth="6"><path d={knotPath(19)} /><path d={knotPath(19)} opacity=".22" transform="rotate(60)" /></g>,
    outline: <path d={knotPath(20)} />,
  },
  branch: {
    primary: (
      <g strokeWidth="5" strokeLinecap="round">
        {branchSegments().map((d, index) => (
          <path key={d} d={d} strokeWidth={index === 0 ? 8 : Math.max(2, 6 - index)} />
        ))}
      </g>
    ),
    outline: <g>{branchSegments().map((d) => <path key={d} d={d} />)}</g>,
  },
  cloud: {
    primary: <g strokeWidth="5"><path d={CLOUD} /><path d={CLOUD} opacity=".24" transform="translate(0 16) scale(.66)" /></g>,
    outline: <path d={CLOUD} />,
  },
  shard: {
    // Mitred rather than rounded: a fragment's corners are the whole point.
    primary: (
      <g strokeWidth="5" strokeLinejoin="miter">
        <path d={SHARD} /><path d={SHARD_CHIP} /><path d={SHARD} opacity=".2" transform="scale(.5)" />
      </g>
    ),
    outline: <g strokeLinejoin="miter"><path d={SHARD} /><path d={SHARD_CHIP} /></g>,
  },
};

export function ShapeArtwork({ profile, highlighted }: ArtworkProps) {
  const dominant = dominantOf(profile);
  return (
    <g
      transform="translate(120 105)"
      fill="none"
      stroke={dominant.color}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {profile.secondary.map((item, index) => (
        <g
          key={item.id}
          stroke={item.color}
          strokeWidth="2"
          opacity={layerOpacity(item.id, highlighted, Math.max(0.12, item.probability * 0.55))}
          transform={`scale(${0.72 - index * 0.12})`}
        >
          {SHAPES[item.id]?.outline}
        </g>
      ))}
      <g opacity={layerOpacity(dominant.id, highlighted)}>
        {SHAPES[profile.choice]?.primary}
      </g>
    </g>
  );
}

import { useId, type ReactNode } from "react";
import { motion } from "motion/react";

import type { VisualProfile } from "../visualRegistry.ts";

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

export function SpecimenArtwork({ profile, highlighted, idPrefix }: Required<Pick<SpecimenProps, "idPrefix">> & Omit<SpecimenProps, "idPrefix" | "staticMode">) {
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
  <g fill="none" stroke="#c9ccc2" strokeWidth="1.5">
    <circle cx="120" cy="104" r="58" strokeDasharray="3 7" />
    <path d="M82 150 Q120 166 158 150" opacity=".45" />
  </g>
);

const NeutralSpecimen = () => (
  <g>
    <circle cx="120" cy="104" r="58" fill="#e1e1d8" stroke="#babdb4" strokeWidth="1.5" />
    <path d="M84 105 C101 90 139 90 156 105 C139 120 101 120 84 105Z" fill="none" stroke="#979c93" strokeDasharray="3 6" />
    <circle cx="120" cy="105" r="4" fill="#979c93" />
  </g>
);

interface ArtworkProps {
  readonly profile: VisualProfile;
  readonly highlighted: string | null;
  readonly idPrefix: string;
}

const layerOpacity = (id: string, highlighted: string | null, base = 1): number =>
  highlighted && highlighted !== id ? base * 0.22 : base;

const TasteArtwork = ({ profile, highlighted, idPrefix }: ArtworkProps) => {
  const clipId = `${idPrefix}-drop-clip`;
  const shadeId = `${idPrefix}-drop-shade`;
  let y = 167;
  const bands = profile.items
    .filter((item) => item.id !== "no_association" && item.probability > 0)
    .map((item) => {
      const height = item.probability * 128;
      y -= height;
      return <rect key={item.id} x="62" y={y} width="116" height={height + 1} fill={item.color} opacity={layerOpacity(item.id, highlighted, 0.96)} />;
    });

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d="M120 31 C145 58 178 85 174 121 C170 157 148 174 119 175 C87 176 66 157 66 126 C66 94 94 62 120 31Z" />
        </clipPath>
        <linearGradient id={shadeId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".48" />
          <stop offset=".48" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#392f28" stopOpacity=".22" />
        </linearGradient>
      </defs>
      <ellipse cx="121" cy="178" rx="49" ry="8" fill="#6d6252" opacity=".13" />
      <g clipPath={`url(#${clipId})`}>
        <rect x="62" y="31" width="116" height="144" fill={profile.items.find((item) => item.dominant)?.color ?? "#d8a03f"} opacity=".2" />
        {bands}
        <rect x="62" y="30" width="118" height="146" fill={`url(#${shadeId})`} />
      </g>
      <path d="M120 31 C145 58 178 85 174 121 C170 157 148 174 119 175 C87 176 66 157 66 126 C66 94 94 62 120 31Z" fill="none" stroke="#494a42" strokeOpacity=".24" strokeWidth="1.2" />
      <path d="M93 72 C83 89 77 106 79 123" fill="none" stroke="#fff" strokeOpacity=".62" strokeWidth="7" strokeLinecap="round" />
      <TasteMarks choice={profile.choice} />
    </g>
  );
};

const TasteMarks = ({ choice }: { readonly choice: string }) => {
  if (choice === "salty") return <g fill="#eef5f5" opacity=".78"><path d="M136 77l6 5-5 7-7-5z"/><path d="M149 103l5 4-4 6-6-4z"/><path d="M128 120l4 3-3 5-5-3z"/></g>;
  if (choice === "sour") return <path d="M134 66 Q155 86 145 109" fill="none" stroke="#eff7b7" strokeWidth="4" strokeLinecap="round" opacity=".65" />;
  if (choice === "bitter") return <path d="M89 143 Q120 155 153 137" fill="none" stroke="#342823" strokeWidth="4" opacity=".28" />;
  if (choice === "umami") return <ellipse cx="137" cy="118" rx="20" ry="13" fill="#713f2c" opacity=".16" />;
  return <circle cx="141" cy="73" r="8" fill="#fff4c9" opacity=".44" />;
};

const MaterialArtwork = ({ profile, highlighted, idPrefix }: ArtworkProps) => {
  const clipId = `${idPrefix}-sphere`;
  const gradientId = `${idPrefix}-material-gradient`;
  const patternId = `${idPrefix}-material-pattern`;
  const dominant = profile.items.find((item) => item.dominant)!;
  const colors = materialColors(profile.choice, dominant.color);
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
          <path d={profile.choice === "fabric" ? "M0 2H12M2 0V12" : "M0 4L12 1M0 10L12 7"} stroke="#fff" strokeOpacity=".18" strokeWidth="1" />
        </pattern>
      </defs>
      <ellipse cx="120" cy="177" rx="53" ry="9" fill="#495047" opacity=".14" />
      <circle cx="120" cy="105" r="62" fill={`url(#${gradientId})`} opacity={layerOpacity(dominant.id, highlighted)} />
      <g clipPath={`url(#${clipId})`}>
        {(profile.choice === "metal" || profile.choice === "fabric") && <rect x="56" y="41" width="128" height="128" fill={`url(#${patternId})`} />}
        <MaterialTexture choice={profile.choice} />
        {profile.secondary.map((item, index) => (
          <path key={item.id} d={index === 0 ? "M58 127 Q97 104 131 126 T185 120 V175 H55Z" : "M58 62 Q93 83 120 66 T183 73 V42 H58Z"} fill={item.color} opacity={layerOpacity(item.id, highlighted, Math.min(0.34, item.probability * 0.8))} />
        ))}
      </g>
      <circle cx="120" cy="105" r="62" fill="none" stroke="#40463f" strokeOpacity=".24" strokeWidth="1.4" />
      <path d="M87 69 C101 51 131 46 148 58" fill="none" stroke="#fff" strokeOpacity={profile.choice === "rubber" ? ".2" : ".58"} strokeWidth="6" strokeLinecap="round" />
    </g>
  );
};

const materialColors = (choice: string, color: string): readonly [string, string, string] => {
  const map: Record<string, readonly [string, string, string]> = {
    glass: ["#f5ffff", "#b7d4d1", "#6d9996"], metal: ["#e8eeeb", "#7d8986", "#3f4b49"],
    wood: ["#d4a06b", "#9a6745", "#5d3d2f"], stone: ["#c1c0b2", "#85877d", "#5d625d"],
    fabric: ["#c4aaa4", "#92736f", "#66514f"], water: ["#c8e4df", "#669ea8", "#366d77"],
    smoke: ["#d2d5cf", "#898e88", "#5e635f"], rubber: ["#78827b", "#4c554f", "#303632"],
  };
  return map[choice] ?? [color, color, "#4b504b"];
};

const MaterialTexture = ({ choice }: { readonly choice: string }) => {
  if (choice === "wood") return <g fill="none" stroke="#533629" strokeOpacity=".38"><path d="M63 85 Q95 65 176 81"/><path d="M59 104 Q104 82 182 106"/><path d="M64 130 Q116 103 177 129"/><ellipse cx="122" cy="105" rx="19" ry="34"/></g>;
  if (choice === "stone") return <g fill="#3d453f" opacity=".26">{[[84,74],[106,57],[151,76],[91,116],[139,111],[111,143],[157,135]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={i%2?2.2:1.4}/>)}</g>;
  if (choice === "water") return <g fill="none" stroke="#e9ffff" strokeOpacity=".52" strokeWidth="2"><path d="M53 101 Q83 84 112 101 T187 100"/><path d="M58 126 Q88 109 117 126 T182 125"/></g>;
  if (choice === "smoke") return <g fill="none" stroke="#eef0ec" strokeOpacity=".28" strokeWidth="12" strokeLinecap="round"><path d="M85 142 C65 113 119 111 96 76 C86 61 104 51 115 47"/><path d="M133 154 C158 127 112 106 147 80 C157 71 151 57 142 50"/></g>;
  if (choice === "metal") return <g fill="#fff" opacity=".25"><path d="M67 92 L169 62 L175 75 L70 108Z"/><path d="M74 132 L173 104 L177 112 L78 145Z"/></g>;
  if (choice === "glass") return <path d="M75 122 C105 106 127 82 167 75 L177 110 C139 108 116 143 79 148Z" fill="#efffff" opacity=".22" />;
  if (choice === "rubber") return <ellipse cx="123" cy="145" rx="40" ry="9" fill="#202722" opacity=".18" />;
  return null;
};

const ScentArtwork = ({ profile, highlighted, idPrefix }: ArtworkProps) => {
  const dominant = profile.items.find((item) => item.dominant)!;
  const glowId = `${idPrefix}-scent-glow`;
  return (
    <g opacity={layerOpacity(dominant.id, highlighted)}>
      <defs><radialGradient id={glowId}><stop stopColor={dominant.color} stopOpacity=".48"/><stop offset="1" stopColor={dominant.color} stopOpacity="0"/></radialGradient></defs>
      <circle cx="120" cy="108" r="62" fill={`url(#${glowId})`} />
      <ScentMotif choice={profile.choice} color={dominant.color} />
      {profile.secondary.map((item, index) => (
        <g key={item.id} transform={`translate(${index === 0 ? 51 : 174} ${index === 0 ? 63 : 142})`} opacity={layerOpacity(item.id, highlighted, Math.max(0.18, item.probability))}>
          <circle r="10" fill={item.color} opacity=".32"/><path d="M-7 2 Q0-11 7 2 Q0 11-7 2Z" fill={item.color}/>
        </g>
      ))}
      <g fill={dominant.color} opacity=".46">
        {[[50,105,2],[65,53,1.8],[92,34,1.2],[160,48,2],[183,91,1.4],[177,150,2],[72,159,1.3],[129,178,1.7]].map(([cx,cy,r],i)=><circle key={i} cx={cx} cy={cy} r={r}/>) }
      </g>
    </g>
  );
};

const ScentMotif = ({ choice, color }: { readonly choice: string; readonly color: string }) => {
  if (choice === "floral") return <g transform="translate(120 106)">{[0,60,120,180,240,300].map((angle)=><ellipse key={angle} transform={`rotate(${angle}) translate(0 -25)`} rx="15" ry="29" fill={color} opacity=".66"/>)}<circle r="18" fill="#d7aa62"/></g>;
  if (choice === "citrus") return <g transform="translate(120 106)" fill="none" stroke={color} strokeWidth="5">{[0,60,120,180,240,300].map((angle)=><path key={angle} transform={`rotate(${angle})`} d="M0 0 Q18-8 30 0 Q18 18 0 0Z"/>)}<circle r="11" fill={color} stroke="none"/></g>;
  if (choice === "woody") return <g fill="none" stroke={color} strokeWidth="4" opacity=".78"><ellipse cx="120" cy="107" rx="45" ry="33"/><ellipse cx="120" cy="107" rx="30" ry="21"/><ellipse cx="120" cy="107" rx="14" ry="9"/><path d="M77 111 Q108 94 164 106"/></g>;
  if (choice === "earthy") return <g fill={color}><ellipse cx="100" cy="119" rx="29" ry="22" opacity=".68"/><ellipse cx="136" cy="101" rx="31" ry="27" opacity=".55"/><ellipse cx="141" cy="132" rx="22" ry="15" opacity=".76"/></g>;
  if (choice === "smoky") return <g fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" opacity=".48"><path d="M95 150 C68 119 129 108 98 73 C83 56 106 41 118 35"/><path d="M134 158 C165 127 111 108 146 77 C159 65 149 48 139 41"/></g>;
  if (choice === "herbal") return <g transform="translate(120 112)" fill={color}>{[-52,-26,0,26,52].map((angle,i)=><path key={angle} transform={`rotate(${angle}) translate(0 -22)`} d="M0 7 C-22-7-18-35 0-43 C18-35 22-7 0 7Z" opacity={.52+i*.07}/>)}</g>;
  if (choice === "spicy") return <g transform="translate(120 106)" fill={color}>{[0,45,90,135].map((angle)=><path key={angle} transform={`rotate(${angle})`} d="M0-48 L8-13 L35-35 L13-8 L48 0 L13 8 L35 35 L8 13 L0 48 L-8 13 L-35 35 L-13 8 L-48 0 L-13-8 L-35-35 L-8-13Z" opacity=".28"/>)}<circle r="18" opacity=".72"/></g>;
  return <g fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"><path d="M62 112 Q91 80 120 112 T178 112"/><path d="M76 136 Q98 112 120 136 T164 136" opacity=".6"/><path d="M83 83 Q102 63 121 83 T159 83" opacity=".42"/></g>;
};

const ShapeArtwork = ({ profile, highlighted }: ArtworkProps) => {
  const dominant = profile.items.find((item) => item.dominant)!;
  return (
    <g transform="translate(120 105)" fill="none" stroke={dominant.color} strokeLinecap="round" strokeLinejoin="round" opacity={layerOpacity(dominant.id, highlighted)}>
      {profile.secondary.map((item, index) => <SecondaryShape key={item.id} id={item.id} color={item.color} scale={0.72-index*.12} opacity={layerOpacity(item.id, highlighted, Math.max(.12,item.probability*.55))} />)}
      <PrimaryShape id={profile.choice} />
    </g>
  );
};

const PrimaryShape = ({ id }: { readonly id: string }) => {
  if (id === "circle") return <g strokeWidth="5"><circle r="55"/><circle r="39" opacity=".3"/><circle r="24" opacity=".16"/></g>;
  if (id === "triangle") return <g strokeWidth="5"><path d="M0-62 L57 40 L-57 40Z"/><path d="M0-40 L36 25 L-36 25Z" opacity=".25"/></g>;
  if (id === "square") return <g strokeWidth="5"><rect x="-50" y="-50" width="100" height="100"/><rect x="-34" y="-34" width="68" height="68" opacity=".25"/></g>;
  if (id === "star") return <path strokeWidth="5" d={starPath(0,0,61,27,5)} />;
  if (id === "spiral") return <path strokeWidth="5" d={spiralPath()} />;
  return <g strokeWidth="5"><path d="M-68-29 C-46-58-23 0 0-29 S46-58 68-29"/><path d="M-68 10 C-46-19-23 39 0 10 S46-19 68 10" opacity=".62"/><path d="M-68 47 C-46 18-23 76 0 47 S46 18 68 47" opacity=".3"/></g>;
};

const SecondaryShape = ({ id, color, scale, opacity }: { readonly id: string; readonly color: string; readonly scale: number; readonly opacity: number }) => (
  <g stroke={color} strokeWidth="2" opacity={opacity} transform={`scale(${scale})`}>
    {id === "circle" && <circle r="64"/>}
    {id === "triangle" && <path d="M0-65 L60 42 L-60 42Z"/>}
    {id === "square" && <rect x="-53" y="-53" width="106" height="106"/>}
    {id === "star" && <path d={starPath(0,0,65,29,5)}/>} 
    {id === "spiral" && <path d={spiralPath()}/>} 
    {id === "wave" && <path d="M-68 0 C-46-34-23 34 0 0 S46-34 68 0"/>}
  </g>
);

const starPath = (cx: number, cy: number, outer: number, inner: number, points: number): string => {
  const values: string[] = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + index * Math.PI / points;
    values.push(`${index === 0 ? "M" : "L"}${cx + Math.cos(angle) * radius} ${cy + Math.sin(angle) * radius}`);
  }
  return `${values.join(" ")}Z`;
};

const spiralPath = (): string => {
  const points: string[] = [];
  for (let index = 0; index <= 78; index += 1) {
    const angle = index * 0.21;
    const radius = 3 + index * 0.72;
    points.push(`${index === 0 ? "M" : "L"}${Math.cos(angle) * radius} ${Math.sin(angle) * radius}`);
  }
  return points.join(" ");
};

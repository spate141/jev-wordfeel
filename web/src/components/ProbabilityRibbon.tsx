import type { VisualProfile } from "../visualRegistry.ts";

interface ProbabilityRibbonProps {
  readonly profile: VisualProfile;
  readonly highlighted: string | null;
  readonly onHighlight: (label: string | null) => void;
}

export function ProbabilityRibbon({ profile, highlighted, onHighlight }: ProbabilityRibbonProps) {
  return (
    <div className="ribbon" aria-label="Full association probability distribution">
      {profile.items.map((item) => (
        <span
          key={item.id}
          className={`ribbon-segment${highlighted === item.id ? " is-highlighted" : ""}`}
          style={{ width: `${item.probability * 100}%`, backgroundColor: item.color }}
          title={`${item.label}: ${item.probability * 100}%`}
          onPointerEnter={() => onHighlight(item.id)}
          onPointerLeave={() => onHighlight(null)}
        />
      ))}
    </div>
  );
}

import type { VisualProfile } from "../visualRegistry.ts";
import { formatProbability } from "../visualRegistry.ts";

interface ProfileDetailsProps {
  readonly profile: VisualProfile;
  readonly onHighlight: (label: string | null) => void;
}

export function ProfileDetails({ profile, onHighlight }: ProfileDetailsProps) {
  return (
    <details className="profile-details">
      <summary>See profile</summary>
      <div className="profile-list">
        {profile.ranked.map((item) => (
          <button
            className="profile-row"
            type="button"
            key={item.id}
            onFocus={() => onHighlight(item.id)}
            onBlur={() => onHighlight(null)}
            onPointerEnter={() => onHighlight(item.id)}
            onPointerLeave={() => onHighlight(null)}
            onClick={(event) => {
              event.currentTarget.focus();
              onHighlight(item.id);
            }}
            aria-label={`${item.label}, association probability ${formatProbability(item.probability)}`}
          >
            <span className="profile-key">
              <span className="profile-swatch" style={{ background: item.color }} aria-hidden="true" />
              {item.label}
            </span>
            <span className="tabular">{formatProbability(item.probability)}</span>
          </button>
        ))}
      </div>
    </details>
  );
}

import { useState } from "react";

import type { Facet, FacetFailure, FacetSuccess } from "../../../src/types.ts";
import { FACET_META, formatProbability, toVisualProfile } from "../visualRegistry.ts";
import { ProbabilityRibbon } from "./ProbabilityRibbon.tsx";
import { ProfileDetails } from "./ProfileDetails.tsx";
import { Specimen } from "./Specimens.tsx";

interface SensePanelProps {
  readonly facet: Facet;
  readonly result: FacetSuccess<string> | FacetFailure | null;
  readonly retrying: boolean;
  readonly onRetry: () => void;
}

export function SensePanel({ facet, result, retrying, onRetry }: SensePanelProps) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const meta = FACET_META[facet];
  const profile = result?.status === "ok" ? toVisualProfile(facet, result) : null;
  const dominant = profile?.items.find((item) => item.dominant) ?? null;

  return (
    <article className={`sense-panel sense-panel-${facet}`} aria-labelledby={`${facet}-title`}>
      <p className="facet-kicker"><span>{meta.number}</span> {meta.title}</p>
      <div className="specimen-stage">
        <Specimen profile={profile} highlighted={highlighted} />
      </div>

      {result === null ? (
        <div className="sense-copy sense-copy-empty">
          <h2 id={`${facet}-title`}>Waiting quietly</h2>
          <p>Choose a word to reveal this specimen.</p>
        </div>
      ) : result.status === "error" ? (
        <div className="sense-copy sense-error">
          <h2 id={`${facet}-title`}>Sense unavailable</h2>
          <p>{failureMessage(result)}</p>
          <button type="button" className="text-button" onClick={onRetry} disabled={retrying}>
            {retrying ? "Trying again…" : "Retry this sense"}
          </button>
        </div>
      ) : (
        <div className="sense-copy">
          <h2 id={`${facet}-title`}>{dominant?.label}</h2>
          <p className="association-probability">
            Association probability <strong className="tabular">{formatProbability(dominant?.probability ?? 0)}</strong>
          </p>
          <ProbabilityRibbon profile={profile!} highlighted={highlighted} onHighlight={setHighlighted} />
          <ProfileDetails profile={profile!} onHighlight={setHighlighted} />
        </div>
      )}
    </article>
  );
}

const failureMessage = (failure: FacetFailure): string => {
  switch (failure.error.code) {
    case "authentication": return "The service needs attention from its owner.";
    case "rate_limit": return "Too many ideas arrived at once. Wait a moment and retry.";
    case "timeout": return "This sense took too long to return.";
    case "network": return "The sensory service could not be reached.";
    case "cancelled": return "This sense was interrupted.";
    default: return "This sense did not settle into an answer.";
  }
};

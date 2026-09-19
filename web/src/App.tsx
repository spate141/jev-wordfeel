import { useRef, useState } from "react";

import { FACETS, type Facet } from "../../src/taxonomies.ts";
import type { FacetFailure, FacetSuccess } from "../../src/types.ts";
import { wordfeelIconUrl } from "./assets.ts";
import { Postcard, downloadPostcard, usePostcardLayout } from "./components/Postcard.tsx";
import { SensePanel } from "./components/SensePanel.tsx";
import { SiteCredit } from "./components/SiteCredit.tsx";
import { UnderTheHood } from "./components/UnderTheHood.tsx";
import { WordInput } from "./components/WordInput.tsx";
import { useWordAnalysis } from "./useWordAnalysis.ts";

export function App() {
  const analysis = useWordAnalysis();
  const postcardRef = useRef<SVGSVGElement>(null);
  const postcardLayout = usePostcardLayout();
  const [aboutOpen, setAboutOpen] = useState(false);
  const allMysterious = analysis.result?.status === "ok"
    && FACETS.every((facet) => analysis.result?.facets[facet].status === "ok" && analysis.result.facets[facet].choice === "no_association");

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Wordfeel home">
          <img src={wordfeelIconUrl} alt="" aria-hidden="true" />
          <span className="wordmark-text">wordfeel<span aria-hidden="true">·</span></span>
        </a>
        <nav aria-label="Site links">
          <button className="header-link" type="button" onClick={() => setAboutOpen((open) => !open)} aria-expanded={aboutOpen}>About</button>
          <a className="header-link" href="https://github.com/spate141/jev-wordfeel" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      {aboutOpen && (
        <aside className="about-note">
          <strong>A playful interpretation, not a measurement.</strong>
          <p>Jev chooses evocative associations from four small palettes. Meanings are subjective, and another analysis may feel different.</p>
        </aside>
      )}

      <main>
        <section className="hero">
          <p className="eyebrow">A sensory cabinet for language</p>
          <h1>A word. Four senses.</h1>
          <p className="hero-line">Taste it. Touch it. Smell it. See it.</p>
          <WordInput busy={analysis.pendingInput !== null} onSubmit={analysis.submit} />
          <div className="status-space" aria-live="polite" aria-atomic="true">
            {analysis.showLoading && (
              <p className="loading-status">{analysis.result ? `Exploring “${analysis.pendingInput}”…` : "Gathering four specimens…"}</p>
            )}
            {analysis.error && <p className="global-error" role="alert">{analysis.error}</p>}
            {!analysis.pendingInput && analysis.result && (
              <p className="sr-only">{resultSummary(analysis.result)}</p>
            )}
          </div>
        </section>

        <section className="results" aria-label="Sensory specimens">
          <div className="results-heading">
            <div>
              <p className="eyebrow">Current collection</p>
              <h2>{analysis.result ? `“${analysis.result.normalized_input}”` : "Four empty plinths"}</h2>
            </div>
            {analysis.result && analysis.result.status !== "error" && (
              <button className="save-button" type="button" onClick={() => { if (postcardRef.current) void downloadPostcard(postcardRef.current, analysis.result!.normalized_input); }}>
                Save image <span aria-hidden="true">↓</span>
              </button>
            )}
          </div>

          <div className="cabinet-grid">
            {FACETS.map((facet) => (
              <SensePanel
                key={facet}
                facet={facet}
                result={analysis.result ? asDisplayResult(analysis.result.facets[facet]) : null}
                retrying={analysis.retrying.has(facet)}
                onRetry={() => analysis.retry(facet)}
              />
            ))}
          </div>

          {allMysterious && <p className="mystery-note">This one is a little mysterious. Try another word.</p>}
          {analysis.result && <UnderTheHood result={analysis.result} />}
          {analysis.result && <Postcard ref={postcardRef} result={analysis.result} layout={postcardLayout} />}
        </section>
      </main>

      <footer>
        <div className="footer-note">
          <p>A playful interpretation by Jev.</p>
          <p>Associations are subjective; probabilities describe the model’s choice among each fixed palette.</p>
        </div>
        <SiteCredit />
      </footer>
    </div>
  );
}

const asDisplayResult = (result: FacetSuccess<string> | FacetFailure): FacetSuccess<string> | FacetFailure => result;

const resultSummary = (result: import("../../src/types.ts").AnalysisResult): string => {
  const answered = FACETS.flatMap((facet) => {
    const value = result.facets[facet];
    return value.status === "ok" ? [`${facet}: ${value.choice.replaceAll("_", " ")}`] : [];
  });
  return `Sensory profile for ${result.normalized_input}. ${answered.join("; ")}.`;
};

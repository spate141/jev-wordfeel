#!/usr/bin/env node
/**
 * Opt-in live smoke check against the real Jev API.
 *
 * Makes real, billable calls: three analyses, four requests each, twelve in total. It records
 * what actually came back — status, model, choices, latency — and asserts nothing about which
 * metaphor the model picks. There are no expected answers here, by design.
 *
 * Run with: npm run smoke
 */

import { analyzeWord } from "../src/index.ts";
import { FACETS } from "../src/taxonomies.ts";

const WORDS = ["banana", "Chicago", "nostalgia"] as const;

const main = async (): Promise<void> => {
  const words = process.argv.slice(2).length > 0 ? process.argv.slice(2) : [...WORDS];

  for (const word of words) {
    const result = await analyzeWord(word);
    const slowestFacet = Math.max(
      ...FACETS.map((facet) => result.facets[facet].latency_ms ?? 0),
    );

    console.log(`\n${word} -> ${result.status}`);
    console.log(`  requested model: ${result.requested_model}`);
    console.log(`  total: ${result.total_latency_ms.toFixed(0)}ms`);
    // Concurrency is observable here: the wall-clock total should sit near the slowest single
    // facet, not near the sum of all four.
    console.log(
      `  slowest facet: ${slowestFacet.toFixed(0)}ms, sum of facets: ` +
        `${FACETS.reduce((total, facet) => total + result.facets[facet].latency_ms, 0).toFixed(0)}ms`,
    );

    for (const facet of FACETS) {
      const outcome = result.facets[facet];
      if (outcome.status === "ok") {
        const top = outcome.ranked
          .slice(0, 3)
          .map((entry) => `${entry.label} ${entry.probability.toFixed(3)}`)
          .join(", ");
        console.log(
          `  ${facet.padEnd(8)} ${outcome.choice.padEnd(15)} confidence ${outcome.confidence.toFixed(3)}  [${top}]`,
        );
      } else {
        console.log(`  ${facet.padEnd(8)} FAILED ${outcome.error.code}: ${outcome.error.message}`);
      }
    }
  }
};

await main();

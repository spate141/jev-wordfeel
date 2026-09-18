import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";

import { createRequestHandler, type CoreAdapter } from "../server/app.ts";
import { PROMPT_VERSION, SCHEMA_VERSION, TAXONOMY_VERSION } from "../src/prompts.ts";
import { labelsFor } from "../src/taxonomies.ts";
import type { AnalysisResult, Facet, FacetResult } from "../src/types.ts";

/** One successful facet, built from the live palette so these fixtures cannot go stale. */
const facetSuccess = (facet: Facet, choice: string) => {
  const labels = labelsFor(facet) as readonly string[];
  return {
    status: "ok",
    model: "jev-test",
    choice,
    probabilities: Object.fromEntries(labels.map((label) => [label, label === choice ? 1 : 0])),
    confidence: 1,
    ranked: labels
      .map((label) => ({ label, probability: label === choice ? 1 : 0 }))
      .sort((left, right) => right.probability - left.probability),
    latency_ms: 1,
    usage: null,
  } as const;
};

const success = facetSuccess("taste", "sweet");

const analysis = {
  schema_version: SCHEMA_VERSION,
  prompt_version: PROMPT_VERSION,
  taxonomy_version: TAXONOMY_VERSION,
  input: "banana",
  normalized_input: "banana",
  requested_model: "jev-test",
  status: "ok",
  total_latency_ms: 2,
  facets: {
    taste: success,
    material: facetSuccess("material", "wood"),
    smell: facetSuccess("smell", "citrus"),
    shape: facetSuccess("shape", "circle"),
  },
} as unknown as AnalysisResult;

const withServer = async (core: CoreAdapter, run: (base: string) => Promise<void>, options: { rateLimitPerMinute?: number; maxConcurrent?: number } = {}) => {
  const server = createServer(createRequestHandler({ core, ...options }));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
};

test("aggregate and facet routes call only their matching core function", async () => {
  let aggregateCalls = 0;
  let facetCalls = 0;
  const core: CoreAdapter = {
    analyzeWord: async () => { aggregateCalls += 1; return analysis; },
    analyzeFacet: async <F extends Facet>() => { facetCalls += 1; return success as unknown as FacetResult<F>; },
  };
  await withServer(core, async (base) => {
    const aggregate = await fetch(`${base}/api/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: "banana" }) });
    assert.equal(aggregate.status, 200);
    assert.equal((await aggregate.json() as AnalysisResult).normalized_input, "banana");

    const facet = await fetch(`${base}/api/analyze-facet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: " banana ", facet: "taste" }) });
    assert.equal(facet.status, 200);
    assert.equal((await facet.json() as { normalized_input: string }).normalized_input, "banana");
  });
  assert.equal(aggregateCalls, 1);
  assert.equal(facetCalls, 1);
});

test("adapter rejects malformed, invalid, oversized, and over-limit requests safely", async () => {
  const core: CoreAdapter = {
    analyzeWord: async () => analysis,
    analyzeFacet: async <F extends Facet>() => success as unknown as FacetResult<F>,
  };
  await withServer(core, async (base) => {
    const malformed = await fetch(`${base}/api/analyze`, { method: "POST", body: "{" });
    assert.equal(malformed.status, 400);

    const invalidFacet = await fetch(`${base}/api/analyze-facet`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: "x", facet: "sound" }) });
    assert.equal(invalidFacet.status, 400);

    const tooLarge = await fetch(`${base}/api/analyze`, { method: "POST", body: JSON.stringify({ input: "x".repeat(5_000) }) });
    assert.equal(tooLarge.status, 413);

    const limited = await fetch(`${base}/api/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input: "again" }) });
    assert.equal(limited.status, 429);
    assert(limited.headers.has("retry-after"));
  }, { rateLimitPerMinute: 3 });
});

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";

import { createRequestHandler, type CoreAdapter } from "../server/app.ts";
import type { AnalysisResult, Facet, FacetResult } from "../src/types.ts";

const success = {
  status: "ok",
  model: "jev-test",
  choice: "sweet",
  probabilities: { sweet: 1, sour: 0, salty: 0, bitter: 0, umami: 0, no_association: 0 },
  confidence: 1,
  ranked: [
    { label: "sweet", probability: 1 }, { label: "sour", probability: 0 },
    { label: "salty", probability: 0 }, { label: "bitter", probability: 0 },
    { label: "umami", probability: 0 }, { label: "no_association", probability: 0 },
  ],
  latency_ms: 1,
  usage: null,
} as const;

const analysis = {
  schema_version: "1.0.0",
  prompt_version: "1.0.0",
  taxonomy_version: "1.0.0",
  input: "banana",
  normalized_input: "banana",
  requested_model: "jev-test",
  status: "ok",
  total_latency_ms: 2,
  facets: {
    taste: success,
    material: { ...success, choice: "wood", probabilities: { glass: 0, metal: 0, wood: 1, stone: 0, fabric: 0, water: 0, smoke: 0, rubber: 0, no_association: 0 }, ranked: [{ label: "wood", probability: 1 }] },
    smell: { ...success, choice: "citrus", probabilities: { floral: 0, citrus: 1, woody: 0, earthy: 0, smoky: 0, herbal: 0, spicy: 0, oceanic: 0, no_association: 0 }, ranked: [{ label: "citrus", probability: 1 }] },
    shape: { ...success, choice: "circle", probabilities: { circle: 1, triangle: 0, square: 0, star: 0, spiral: 0, wave: 0, no_association: 0 }, ranked: [{ label: "circle", probability: 1 }] },
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

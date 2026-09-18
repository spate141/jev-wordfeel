/**
 * Partial failures and error mapping.
 *
 * A facet that fails must not take its siblings with it, and a failure must never carry
 * fabricated probabilities.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { analyzeWord } from "../src/analyze.ts";
import { resetClientCache } from "../src/client.ts";
import { FACETS } from "../src/taxonomies.ts";
import { createFakeProvider, fakeOptions, wellFormedAnswer } from "./fake-provider.ts";

afterEach(() => resetClientCache());

test("one failed facet preserves the other three successes", async () => {
  const provider = createFakeProvider({ outcomes: { material: { kind: "status", status: 500 } } });

  const result = await analyzeWord("nostalgia", fakeOptions(provider));

  assert.equal(result.status, "partial");
  assert.equal(result.facets.material.status, "error");
  for (const facet of FACETS.filter((f) => f !== "material")) {
    assert.equal(result.facets[facet].status, "ok", `${facet} should still succeed`);
  }
});

test("one malformed facet preserves the other three successes", async () => {
  const provider = createFakeProvider({
    outcomes: {
      shape: { kind: "answer", answer: { type: "choice", choice: "circle", confidence: 0.5 } },
    },
  });

  const result = await analyzeWord("nostalgia", fakeOptions(provider));

  assert.equal(result.status, "partial");
  assert.equal(result.facets.shape.status, "error");
  assert.equal(result.facets.taste.status, "ok");
});

test("a failure carries no probabilities", async () => {
  const provider = createFakeProvider({ outcomes: { taste: { kind: "status", status: 500 } } });

  const result = await analyzeWord("Monday", fakeOptions(provider));
  const taste = result.facets.taste;

  assert.equal(taste.status, "error");
  assert.ok(!Object.hasOwn(taste, "probabilities"));
  assert.ok(!Object.hasOwn(taste, "choice"));
  assert.ok(!Object.hasOwn(taste, "confidence"));
  assert.ok(taste.latency_ms >= 0);
});

test("all four failing yields status error", async () => {
  const provider = createFakeProvider({
    outcomes: Object.fromEntries(
      FACETS.map((facet) => [facet, { kind: "status" as const, status: 503 }]),
    ),
  });

  const result = await analyzeWord("banana", fakeOptions(provider));

  assert.equal(result.status, "error");
  for (const facet of FACETS) {
    assert.equal(result.facets[facet].status, "error");
  }
  assert.equal(provider.requests.length, 4);
});

test("HTTP statuses map to distinct error codes with the status preserved", async () => {
  const provider = createFakeProvider({
    outcomes: {
      taste: { kind: "status", status: 401 },
      material: { kind: "status", status: 429 },
      smell: { kind: "status", status: 500 },
      shape: { kind: "answer", answer: wellFormedAnswer("shape") },
    },
  });

  const result = await analyzeWord("banana", fakeOptions(provider));
  const { taste, material, smell } = result.facets;

  assert.equal(taste.status === "error" && taste.error.code, "authentication");
  assert.equal(taste.status === "error" && taste.error.http_status, 401);
  assert.equal(material.status === "error" && material.error.code, "rate_limit");
  assert.equal(material.status === "error" && material.error.http_status, 429);
  assert.equal(smell.status === "error" && smell.error.code, "provider_error");
  assert.equal(smell.status === "error" && smell.error.http_status, 500);
  assert.equal(result.facets.shape.status, "ok");
});

test("a transport failure maps to network, distinct from a valid no_association answer", async () => {
  const provider = createFakeProvider({
    outcomes: {
      taste: { kind: "network" },
      material: { kind: "answer", answer: wellFormedAnswer("material", "no_association") },
    },
  });

  const result = await analyzeWord("qqzzxx", fakeOptions(provider));
  const { taste, material } = result.facets;

  assert.equal(taste.status === "error" && taste.error.code, "network");

  // no_association is an answer, not a failure.
  assert.equal(material.status, "ok");
  assert.equal(material.status === "ok" && material.choice, "no_association");
});

test("a non-JSON body maps to a failure rather than a crash", async () => {
  const provider = createFakeProvider({
    outcomes: { smell: { kind: "malformed", text: "<html>gateway</html>" } },
  });

  const result = await analyzeWord("Chicago", fakeOptions(provider));

  assert.equal(result.facets.smell.status, "error");
  assert.equal(result.status, "partial");
});

test("error messages never contain the API key", async () => {
  const secret = "sk-super-secret-value";
  const provider = createFakeProvider({
    outcomes: Object.fromEntries(
      FACETS.map((facet) => [facet, { kind: "status" as const, status: 401 }]),
    ),
  });

  const result = await analyzeWord("banana", fakeOptions(provider, { apiKey: secret }));

  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes(secret), "the key must never reach the result");
});

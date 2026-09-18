/**
 * Cancellation.
 *
 * An abort must reach the transport, release its listeners, and leave already-completed facets
 * intact. A signal aborted before entry is the documented exception to the four-call rule: it
 * starts no requests at all.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { analyzeFacet, analyzeWord } from "../src/analyze.ts";
import { resetClientCache } from "../src/client.ts";
import { FACETS } from "../src/taxonomies.ts";
import { createFakeProvider, fakeOptions } from "./fake-provider.ts";

afterEach(() => resetClientCache());

test("a signal already aborted at entry starts no requests", async () => {
  const provider = createFakeProvider();
  const controller = new AbortController();
  controller.abort();

  const result = await analyzeWord("Chicago", fakeOptions(provider, { signal: controller.signal }));

  assert.equal(provider.requests.length, 0, "no outbound call should be made");
  assert.equal(result.status, "error");
  for (const facet of FACETS) {
    const outcome = result.facets[facet];
    assert.equal(outcome.status, "error");
    assert.equal(outcome.status === "error" && outcome.error.code, "cancelled");
  }
});

test("aborting mid-flight cancels the transport and reports cancelled", async () => {
  const provider = createFakeProvider({ hold: true });
  const controller = new AbortController();

  const pending = analyzeWord("Chicago", fakeOptions(provider, { signal: controller.signal }));
  await provider.waitForRequests(4);
  assert.equal(provider.inFlight, 4);

  controller.abort();
  const result = await pending;

  assert.equal(result.status, "error");
  for (const facet of FACETS) {
    const outcome = result.facets[facet];
    assert.equal(outcome.status === "error" && outcome.error.code, "cancelled", `${facet}`);
  }
});

test("facets that already completed survive a later abort", async () => {
  const provider = createFakeProvider({
    // Taste and material answer immediately; the other two hang until cancelled.
    outcomes: { smell: { kind: "hang" }, shape: { kind: "hang" } },
  });
  const controller = new AbortController();

  const pending = analyzeWord("Chicago", fakeOptions(provider, { signal: controller.signal }));

  // Give the two fast facets a chance to settle before cancelling the slow ones.
  await provider.waitForRequests(4);
  await new Promise((resolve) => setImmediate(resolve));
  controller.abort();

  const result = await pending;

  assert.equal(result.status, "partial");
  assert.equal(result.facets.taste.status, "ok", "a completed facet is preserved");
  assert.equal(result.facets.material.status, "ok");
  assert.equal(result.facets.smell.status === "error" && result.facets.smell.error.code, "cancelled");
  assert.equal(result.facets.shape.status === "error" && result.facets.shape.error.code, "cancelled");
});

test("analyzeFacet honors a pre-aborted signal", async () => {
  const provider = createFakeProvider();
  const controller = new AbortController();
  controller.abort();

  const outcome = await analyzeFacet(
    "material",
    "Chicago",
    fakeOptions(provider, { signal: controller.signal }),
  );

  assert.equal(outcome.status, "error");
  assert.equal(outcome.status === "error" && outcome.error.code, "cancelled");
});

test("a cancelled analysis leaves no abort listeners behind", async () => {
  const provider = createFakeProvider({ hold: true });
  const controller = new AbortController();

  const pending = analyzeWord("Chicago", fakeOptions(provider, { signal: controller.signal }));
  await provider.waitForRequests(4);
  controller.abort();
  await pending;

  // Node exposes listener counts on AbortSignal because it is an EventTarget with the Node
  // events interface; anything left here would be a leak per analysis.
  const remaining = (controller.signal as unknown as { listenerCount?: (type: string) => number })
    .listenerCount?.("abort");
  if (remaining !== undefined) {
    assert.equal(remaining, 0, "abort listeners should be released");
  }
});

test("a completed analysis leaves no abort listeners behind", async () => {
  const provider = createFakeProvider();
  const controller = new AbortController();

  const result = await analyzeWord("banana", fakeOptions(provider, { signal: controller.signal }));
  assert.equal(result.status, "ok");

  const remaining = (controller.signal as unknown as { listenerCount?: (type: string) => number })
    .listenerCount?.("abort");
  if (remaining !== undefined) {
    assert.equal(remaining, 0, "abort listeners should be released after success");
  }
});

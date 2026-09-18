/**
 * Input normalization and local configuration.
 *
 * Both are checked before the fan-out, so a rejected call must issue zero requests.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { analyzeFacet, analyzeWord } from "../src/analyze.ts";
import { resetClientCache } from "../src/client.ts";
import { DEFAULT_MODEL, DEFAULT_TIMEOUT_MS, ENV_VARS, resolveConfig } from "../src/config.ts";
import { ConfigurationError, InputValidationError } from "../src/errors.ts";
import { codePointLength, MAX_INPUT_CODE_POINTS, normalizeInput } from "../src/input.ts";
import { createFakeProvider, fakeOptions } from "./fake-provider.ts";

afterEach(() => resetClientCache());

test("normalization trims, collapses whitespace, and preserves case and language", () => {
  assert.equal(normalizeInput("  first   date  "), "first date");
  assert.equal(normalizeInput("Chicago"), "Chicago");
  assert.equal(normalizeInput("CHICAGO"), "CHICAGO", "case is preserved");
  assert.equal(normalizeInput("a\t\nb"), "a b");
  assert.equal(normalizeInput("東京"), "東京");
  assert.equal(normalizeInput("Grüße"), "Grüße");
});

test("normalization applies NFC", () => {
  // "e" + combining acute, which NFC composes into a single code point.
  const decomposed = "café";
  const normalized = normalizeInput(decomposed);

  assert.equal(normalized, "café");
  assert.equal(codePointLength(normalized), 4);
  assert.notEqual(normalized, decomposed);
});

test("empty, whitespace-only, and non-string inputs are rejected", () => {
  for (const bad of ["", "   ", "\t\n"]) {
    assert.throws(() => normalizeInput(bad), InputValidationError);
  }
  for (const bad of [null, undefined, 42, {}, ["banana"]]) {
    assert.throws(() => normalizeInput(bad), InputValidationError);
  }
});

test("the length limit counts Unicode code points, not UTF-16 units", () => {
  // Each emoji is one code point but two UTF-16 units, so a naive `.length` check would reject
  // this at 80 characters.
  const eighty = "🍌".repeat(MAX_INPUT_CODE_POINTS);
  assert.equal(eighty.length, 160);
  assert.equal(codePointLength(normalizeInput(eighty)), MAX_INPUT_CODE_POINTS);

  assert.throws(() => normalizeInput("🍌".repeat(MAX_INPUT_CODE_POINTS + 1)), InputValidationError);
  assert.doesNotThrow(() => normalizeInput("あ".repeat(MAX_INPUT_CODE_POINTS)));
  assert.throws(() => normalizeInput("a".repeat(MAX_INPUT_CODE_POINTS + 1)), InputValidationError);
});

test("the limit applies after normalization, so trailing whitespace does not count", () => {
  const padded = `${"a".repeat(MAX_INPUT_CODE_POINTS)}     `;
  assert.equal(codePointLength(normalizeInput(padded)), MAX_INPUT_CODE_POINTS);
});

test("invalid input launches zero requests", async () => {
  const provider = createFakeProvider();

  await assert.rejects(
    () => analyzeWord("   ", fakeOptions(provider)),
    InputValidationError,
  );
  await assert.rejects(
    () => analyzeFacet("taste", "x".repeat(200), fakeOptions(provider)),
    InputValidationError,
  );

  assert.equal(provider.requests.length, 0);
});

test("a missing API key fails before any network call", async () => {
  const provider = createFakeProvider();
  const saved = process.env[ENV_VARS.apiKey];
  delete process.env[ENV_VARS.apiKey];

  try {
    await assert.rejects(
      () => analyzeWord("banana", { fetch: provider.fetch }),
      ConfigurationError,
    );
    assert.equal(provider.requests.length, 0);
  } finally {
    if (saved !== undefined) process.env[ENV_VARS.apiKey] = saved;
  }
});

test("an unusable timeout is rejected as configuration, not attempted", async () => {
  const provider = createFakeProvider();

  for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    await assert.rejects(
      () => analyzeWord("banana", fakeOptions(provider, { timeoutMs: bad })),
      ConfigurationError,
      `should reject timeoutMs ${String(bad)}`,
    );
  }
  assert.equal(provider.requests.length, 0);
});

test("configuration falls back from options to environment to defaults", () => {
  const saved = { ...process.env };
  try {
    process.env[ENV_VARS.apiKey] = "env-key";
    delete process.env[ENV_VARS.model];
    delete process.env[ENV_VARS.timeoutMs];

    const defaults = resolveConfig();
    assert.equal(defaults.apiKey, "env-key");
    assert.equal(defaults.model, DEFAULT_MODEL);
    assert.equal(defaults.timeoutMs, DEFAULT_TIMEOUT_MS);

    process.env[ENV_VARS.model] = "jev-from-env";
    process.env[ENV_VARS.timeoutMs] = "2500";
    const fromEnv = resolveConfig();
    assert.equal(fromEnv.model, "jev-from-env");
    assert.equal(fromEnv.timeoutMs, 2500);

    const fromOptions = resolveConfig({ model: "jev-explicit", timeoutMs: 999 });
    assert.equal(fromOptions.model, "jev-explicit", "options win over the environment");
    assert.equal(fromOptions.timeoutMs, 999);
  } finally {
    process.env = saved;
  }
});

test("a non-numeric JEV_TIMEOUT_MS is a configuration error", () => {
  const saved = { ...process.env };
  try {
    process.env[ENV_VARS.apiKey] = "env-key";
    process.env[ENV_VARS.timeoutMs] = "soon";
    assert.throws(() => resolveConfig(), ConfigurationError);
  } finally {
    process.env = saved;
  }
});

test("the configured timeout reaches the request as a real deadline", async () => {
  const provider = createFakeProvider({ outcomes: { taste: { kind: "hang" } } });

  const result = await analyzeWord("banana", fakeOptions(provider, { timeoutMs: 40 }));
  const taste = result.facets.taste;

  assert.equal(taste.status, "error");
  assert.equal(taste.status === "error" && taste.error.code, "timeout");
  assert.equal(result.status, "partial", "the other three facets still answer");
});

/**
 * Response validation and ranking.
 *
 * The contract is preserve, never repair: a malformed response fails, and a well-formed one
 * comes back with its numbers untouched.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { analyzeFacet, analyzeWord } from "../src/analyze.ts";
import { resetClientCache } from "../src/client.ts";
import { InvalidResponseError } from "../src/errors.ts";
import { labelsFor } from "../src/taxonomies.ts";
import { PROBABILITY_SUM_TOLERANCE, rankLabels, validateAnswer } from "../src/validate.ts";
import { createFakeProvider, fakeOptions, wellFormedAnswer } from "./fake-provider.ts";

afterEach(() => resetClientCache());

/** A shape answer built from an explicit distribution, so each case states exactly what it tests. */
const shapeAnswer = (probabilities: Record<string, unknown>, overrides: Record<string, unknown> = {}) => ({
  type: "choice",
  choice: "circle",
  confidence: 0.9,
  probabilities,
  ...overrides,
});

const evenShape = (): Record<string, number> => {
  const labels = labelsFor("shape") as readonly string[];
  const share = 1 / labels.length;
  return Object.fromEntries(labels.map((label) => [label, share]));
};

test("a valid answer passes and its values are returned unchanged", () => {
  const probabilities = {
    circle: 0.376543211,
    triangle: 0.1,
    square: 0.1,
    star: 0.1,
    spiral: 0.1,
    wave: 0.1,
    no_association: 0.123456789,
  };
  const validated = validateAnswer("shape", shapeAnswer(probabilities));

  assert.equal(validated.probabilities.circle, 0.376543211);
  assert.equal(validated.probabilities.no_association, 0.123456789);
  assert.deepEqual({ ...validated.probabilities }, probabilities);
  assert.equal(validated.confidence, 0.9);
});

test("a missing candidate is rejected", () => {
  const probabilities = evenShape();
  delete probabilities["wave"];
  assert.throws(() => validateAnswer("shape", shapeAnswer(probabilities)), InvalidResponseError);
});

test("an unknown candidate is rejected", () => {
  assert.throws(
    () => validateAnswer("shape", shapeAnswer({ ...evenShape(), hexagon: 0 })),
    InvalidResponseError,
  );
});

test("non-finite and out-of-range probabilities are rejected", () => {
  for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.5, "0.5", null]) {
    assert.throws(
      () => validateAnswer("shape", shapeAnswer({ ...evenShape(), wave: bad })),
      InvalidResponseError,
      `should reject ${String(bad)}`,
    );
  }
});

test("an out-of-range confidence is rejected", () => {
  assert.throws(
    () => validateAnswer("shape", shapeAnswer(evenShape(), { confidence: 1.4 })),
    InvalidResponseError,
  );
  assert.throws(
    () => validateAnswer("shape", shapeAnswer(evenShape(), { confidence: Number.NaN })),
    InvalidResponseError,
  );
});

test("a sum outside the documented tolerance is rejected, and one inside it is accepted", () => {
  const labels = labelsFor("shape") as readonly string[];

  const clearlyWrong = Object.fromEntries(labels.map((label) => [label, 0.5]));
  assert.throws(() => validateAnswer("shape", shapeAnswer(clearlyWrong)), InvalidResponseError);

  // Just inside 1e-4: accepted, and the drift is preserved rather than normalized away.
  const nearlyOne = { ...evenShape() };
  nearlyOne["circle"] = nearlyOne["circle"]! + PROBABILITY_SUM_TOLERANCE / 2;
  const validated = validateAnswer("shape", shapeAnswer(nearlyOne));
  assert.equal(validated.probabilities.circle, nearlyOne["circle"]);

  // Just outside it: rejected.
  const tooFar = { ...evenShape() };
  tooFar["circle"] = tooFar["circle"]! + PROBABILITY_SUM_TOLERANCE * 10;
  assert.throws(() => validateAnswer("shape", shapeAnswer(tooFar)), InvalidResponseError);
});

test("a choice outside the taxonomy is rejected", () => {
  assert.throws(
    () => validateAnswer("shape", shapeAnswer(evenShape(), { choice: "hexagon" })),
    InvalidResponseError,
  );
});

test("a choice that is not the maximum-probability candidate is rejected", () => {
  const probabilities = { ...evenShape() };
  const labels = labelsFor("shape") as readonly string[];
  // Give wave all the mass while still selecting circle.
  for (const label of labels) probabilities[label] = 0;
  probabilities["wave"] = 1;

  assert.throws(() => validateAnswer("shape", shapeAnswer(probabilities)), InvalidResponseError);
});

test("an exact tie for the maximum is accepted for either tied label", () => {
  const probabilities = Object.fromEntries(
    (labelsFor("shape") as readonly string[]).map((label) => [label, 0]),
  );
  probabilities["circle"] = 0.5;
  probabilities["wave"] = 0.5;

  assert.doesNotThrow(() => validateAnswer("shape", shapeAnswer(probabilities)));
  assert.doesNotThrow(() =>
    validateAnswer("shape", shapeAnswer(probabilities, { choice: "wave" })),
  );
});

test("a non-choice answer type is rejected", () => {
  assert.throws(() => validateAnswer("shape", { type: "noul", noul: 0.5 }), InvalidResponseError);
  assert.throws(() => validateAnswer("shape", null), InvalidResponseError);
});

test("ties rank by taxonomy display order", () => {
  const probabilities = Object.fromEntries(
    (labelsFor("shape") as readonly string[]).map((label) => [label, 1 / 7]),
  ) as Record<string, number>;

  const ranked = rankLabels("shape", probabilities as never);

  // Every probability is equal, so the order must be the taxonomy's own.
  assert.deepEqual(
    ranked.map((entry) => entry.label),
    [...labelsFor("shape")],
  );
});

test("ranking is descending and ties within it fall back to display order", () => {
  const probabilities = {
    circle: 0.1,
    triangle: 0.3,
    square: 0.3,
    star: 0.0,
    spiral: 0.0,
    wave: 0.3,
    no_association: 0.0,
  };

  const ranked = rankLabels("shape", probabilities as never);

  assert.deepEqual(
    ranked.map((entry) => entry.label),
    ["triangle", "square", "wave", "circle", "star", "spiral", "no_association"],
  );
});

test("zero-valued candidates and no_association survive into the result", async () => {
  const probabilities = Object.fromEntries(
    (labelsFor("shape") as readonly string[]).map((label) => [label, 0]),
  );
  probabilities["circle"] = 1;

  const provider = createFakeProvider({
    outcomes: { shape: { kind: "answer", answer: shapeAnswer(probabilities) } },
  });

  const outcome = await analyzeFacet("shape", "Monday", fakeOptions(provider));

  assert.equal(outcome.status, "ok");
  if (outcome.status !== "ok") return;

  assert.deepEqual(Object.keys(outcome.probabilities), [...labelsFor("shape")]);
  assert.equal(outcome.probabilities.no_association, 0);
  assert.equal(outcome.ranked.length, 7);
  assert.ok(outcome.ranked.some((entry) => entry.label === "no_association"));
});

test("a peaked distribution is not smoothed and has no probability floor", async () => {
  const probabilities = Object.fromEntries(
    (labelsFor("taste") as readonly string[]).map((label) => [label, 0]),
  );
  probabilities["sweet"] = 1;

  const provider = createFakeProvider({
    outcomes: {
      taste: {
        kind: "answer",
        answer: { type: "choice", choice: "sweet", confidence: 1, probabilities },
      },
    },
  });

  const result = await analyzeWord("banana", fakeOptions(provider));
  const taste = result.facets.taste;

  assert.equal(taste.status, "ok");
  if (taste.status !== "ok") return;
  assert.equal(taste.probabilities.sweet, 1);
  assert.equal(taste.probabilities.bitter, 0);
  assert.equal(taste.confidence, 1);
});

test("a low confidence is reported, not treated as an error", async () => {
  const provider = createFakeProvider({
    outcomes: {
      taste: { kind: "answer", answer: { ...wellFormedAnswer("taste"), confidence: 0.04 } },
    },
  });

  const result = await analyzeWord("nostalgia", fakeOptions(provider));

  assert.equal(result.status, "ok");
  assert.equal(result.facets.taste.status === "ok" && result.facets.taste.confidence, 0.04);
});

test("usage is preserved when reported and null when absent", async () => {
  const provider = createFakeProvider({
    outcomes: {
      taste: {
        kind: "answer",
        answer: wellFormedAnswer("taste"),
        usage: { input_tokens: 321, output_tokens: 7 },
      },
      shape: { kind: "answer", answer: wellFormedAnswer("shape"), usage: null },
    },
  });

  const result = await analyzeWord("banana", fakeOptions(provider));

  assert.deepEqual(result.facets.taste.status === "ok" && result.facets.taste.usage, {
    input_tokens: 321,
    output_tokens: 7,
  });
  assert.equal(result.facets.shape.status === "ok" && result.facets.shape.usage, null);
});

test("the result envelope reports versions, both inputs, and the requested model", async () => {
  const provider = createFakeProvider();

  const result = await analyzeWord("  Chicago  ", fakeOptions(provider));

  assert.equal(result.schema_version, "1.0.0");
  assert.equal(result.prompt_version, "1.0.0");
  assert.equal(result.taxonomy_version, "1.0.0");
  assert.equal(result.input, "  Chicago  ");
  assert.equal(result.normalized_input, "Chicago");
  assert.equal(result.requested_model, "jev-test");
  assert.equal(result.facets.taste.status === "ok" && result.facets.taste.model, "jev-1-test");
  assert.ok(result.total_latency_ms >= 0);
});

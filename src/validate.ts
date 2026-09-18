/**
 * Runtime validation of one Choice answer.
 *
 * The rule throughout is preserve, never repair. A response that does not satisfy the contract
 * becomes an `invalid_response` failure; it is never patched, renormalized, smoothed, or
 * rounded into shape. A response that does satisfy it is copied through with its numbers
 * untouched.
 */

import { InvalidResponseError } from "./errors.ts";
import { displayIndexOf, labelsFor, TAXONOMIES, type Facet, type LabelOf } from "./taxonomies.ts";
import type { RankedLabel } from "./types.ts";

/**
 * Allowed deviation of the probability sum from 1.
 *
 * Floating-point distributions do not sum to exactly 1, so an exact check would reject valid
 * answers. This tolerance is tight enough that a genuinely malformed distribution still fails.
 */
export const PROBABILITY_SUM_TOLERANCE = 1e-4;

/** Slack when comparing a probability to the maximum, so a numeric tie is treated as a tie. */
const TIE_EPSILON = 1e-9;

/** A validated Choice answer, with the provider's values unchanged. */
export interface ValidatedAnswer<F extends Facet> {
  readonly choice: LabelOf<F>;
  readonly probabilities: Readonly<Record<LabelOf<F>, number>>;
  readonly confidence: number;
  readonly ranked: readonly RankedLabel<LabelOf<F>>[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A finite number in [0, 1]. Rejects NaN, Infinity, and out-of-range values. */
const isProbability = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

/**
 * Check a raw answer against its facet's contract and return it unmodified.
 *
 * @throws {InvalidResponseError} with a message naming the specific violation.
 */
export const validateAnswer = <F extends Facet>(facet: F, answer: unknown): ValidatedAnswer<F> => {
  if (!isRecord(answer)) {
    throw new InvalidResponseError(`Facet "${facet}" returned no answer object.`);
  }

  if (answer["type"] !== "choice") {
    throw new InvalidResponseError(
      `Facet "${facet}" returned answer type ${JSON.stringify(answer["type"])}; expected "choice".`,
    );
  }

  const probabilities = answer["probabilities"];
  if (!isRecord(probabilities)) {
    throw new InvalidResponseError(`Facet "${facet}" returned no probabilities map.`);
  }

  // Exact key-set equality: every candidate present, nothing extra. A missing candidate would
  // silently drop a label from the distribution; an unknown one means the taxonomy we sent and
  // the one we got back disagree.
  const expected = labelsFor(facet);
  const returned = Object.keys(probabilities);
  const missing = expected.filter((label) => !Object.hasOwn(probabilities, label));
  const unknown = returned.filter((label) => !(expected as readonly string[]).includes(label));
  if (missing.length > 0 || unknown.length > 0) {
    const parts = [
      missing.length > 0 ? `missing ${missing.join(", ")}` : "",
      unknown.length > 0 ? `unexpected ${unknown.join(", ")}` : "",
    ].filter(Boolean);
    throw new InvalidResponseError(
      `Facet "${facet}" returned candidates that do not match its taxonomy: ${parts.join("; ")}.`,
    );
  }

  for (const label of expected) {
    if (!isProbability(probabilities[label])) {
      throw new InvalidResponseError(
        `Facet "${facet}" returned a probability for "${label}" that is not a finite number in [0, 1]: ` +
          `${JSON.stringify(probabilities[label])}.`,
      );
    }
  }

  const confidence = answer["confidence"];
  if (!isProbability(confidence)) {
    throw new InvalidResponseError(
      `Facet "${facet}" returned a confidence that is not a finite number in [0, 1]: ${JSON.stringify(confidence)}.`,
    );
  }

  const sum = expected.reduce((total, label) => total + (probabilities[label] as number), 0);
  if (Math.abs(sum - 1) > PROBABILITY_SUM_TOLERANCE) {
    throw new InvalidResponseError(
      `Facet "${facet}" returned probabilities summing to ${sum}, outside the tolerance of ` +
        `${PROBABILITY_SUM_TOLERANCE} around 1.`,
    );
  }

  const choice = answer["choice"];
  if (typeof choice !== "string" || !(expected as readonly string[]).includes(choice)) {
    throw new InvalidResponseError(
      `Facet "${facet}" selected ${JSON.stringify(choice)}, which is not one of its candidates.`,
    );
  }

  // The selected label must be a maximum-probability candidate. Ties are allowed: when two
  // labels share the top probability the model may report either.
  const max = Math.max(...expected.map((label) => probabilities[label] as number));
  const chosenProbability = probabilities[choice] as number;
  if (chosenProbability < max - TIE_EPSILON) {
    throw new InvalidResponseError(
      `Facet "${facet}" selected "${choice}" at probability ${chosenProbability}, below its ` +
        `maximum of ${max}.`,
    );
  }

  // Rebuild the map in taxonomy order so serialized output is stable across runs. The values are
  // the provider's own, assigned without arithmetic of any kind.
  const ordered = Object.fromEntries(
    expected.map((label) => [label, probabilities[label] as number]),
  ) as Record<LabelOf<F>, number>;

  return {
    choice: choice as LabelOf<F>,
    probabilities: ordered,
    confidence,
    ranked: rankLabels(facet, ordered),
  };
};

/**
 * Sort labels by descending probability, breaking ties by taxonomy display order.
 *
 * The comparator is total, so the result does not depend on the sort implementation's stability.
 */
export const rankLabels = <F extends Facet>(
  facet: F,
  probabilities: Readonly<Record<LabelOf<F>, number>>,
): readonly RankedLabel<LabelOf<F>>[] =>
  TAXONOMIES[facet]
    .map((candidate) => ({
      label: candidate.id as LabelOf<F>,
      probability: probabilities[candidate.id as LabelOf<F>],
    }))
    .sort(
      (a, b) =>
        b.probability - a.probability ||
        displayIndexOf(facet, a.label) - displayIndexOf(facet, b.label),
    );

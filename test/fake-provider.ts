/**
 * A controlled fake provider.
 *
 * The SDK accepts a custom `fetch`, so the whole test suite drives real client code over a fake
 * transport: no mocking framework, no network, and the request bodies under assertion are the
 * exact bytes the SDK would have sent.
 *
 * Responses are held until a test releases them, which is what makes the concurrency assertions
 * deterministic — no real-time stopwatch is involved anywhere.
 */

import { FACETS, labelsFor, type Facet } from "../src/taxonomies.ts";
import type { AnalyzeOptions } from "../src/types.ts";

/** One captured outbound request. */
export interface CapturedRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  readonly body: {
    readonly model: string;
    readonly state: Record<string, unknown>;
    readonly questions: Record<string, { type: string; instructions: string; criteria: Record<string, string> }>;
  };
  /** The single question key in this request, which is the facet name. */
  readonly facet: string;
}

/** How the fake should answer one request. */
export type FakeOutcome =
  | { kind: "answer"; answer: unknown; model?: string; usage?: unknown }
  | { kind: "status"; status: number; body?: unknown }
  | { kind: "malformed"; text: string }
  | { kind: "network" }
  | { kind: "hang" };

interface Pending {
  readonly request: CapturedRequest;
  readonly release: () => void;
}

export interface FakeProvider {
  /** Pass as `AnalyzeOptions.fetch`. */
  readonly fetch: NonNullable<AnalyzeOptions["fetch"]>;
  /** Every request the SDK actually sent, in arrival order. */
  readonly requests: readonly CapturedRequest[];
  /** Requests that have arrived but whose responses have not been released. */
  readonly inFlight: number;
  /** Resolve once `count` requests have arrived. */
  waitForRequests(count: number): Promise<void>;
  /** Release every held response. */
  releaseAll(): void;
}

export interface FakeProviderOptions {
  /** Outcome per facet. Facets left out get a well-formed default answer. */
  readonly outcomes?: Partial<Record<Facet, FakeOutcome>>;
  /** Hold responses until `releaseAll` is called. Default false. */
  readonly hold?: boolean;
  /** Called with each request as it arrives, before its response is prepared. */
  readonly onRequest?: (request: CapturedRequest) => void;
}

/**
 * A valid Choice answer: all of the facet's candidates present, summing to exactly 1.
 *
 * The first label takes the remainder so the sum is exact regardless of candidate count.
 */
export const wellFormedAnswer = (facet: Facet, choice?: string): Record<string, unknown> => {
  const labels = labelsFor(facet) as readonly string[];
  const selected = choice ?? labels[0]!;
  const others = labels.filter((label) => label !== selected);
  const share = 0.4 / others.length;
  const probabilities: Record<string, number> = {};
  for (const label of others) probabilities[label] = share;
  probabilities[selected] = 1 - share * others.length;
  return { type: "choice", choice: selected, confidence: 0.82, probabilities };
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "x-typesafe-request-id": "req_test_1" },
  });

export const createFakeProvider = (options: FakeProviderOptions = {}): FakeProvider => {
  const requests: CapturedRequest[] = [];
  const held: Pending[] = [];
  const arrivals: Array<() => void> = [];

  const noteArrival = (): void => {
    for (const notify of arrivals.splice(0)) notify();
  };

  const respond = (facet: string): Response => {
    const outcome = options.outcomes?.[facet as Facet] ?? {
      kind: "answer" as const,
      answer: wellFormedAnswer(facet as Facet),
    };

    switch (outcome.kind) {
      case "answer":
        return jsonResponse({
          model: outcome.model ?? "jev-1-test",
          answers: { [facet]: outcome.answer },
          // `in` rather than `??` so a test can assert the absent-usage path with `usage: null`.
          usage: "usage" in outcome ? outcome.usage : { input_tokens: 120, output_tokens: 8 },
        });
      case "status":
        return jsonResponse(outcome.body ?? { error: `synthetic ${outcome.status}` }, outcome.status);
      case "malformed":
        return new Response(outcome.text, {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      default:
        throw new Error("unreachable");
    }
  };

  const fetch: NonNullable<AnalyzeOptions["fetch"]> = async (url, init) => {
    const raw = typeof init?.body === "string" ? init.body : "{}";
    const body = JSON.parse(raw) as CapturedRequest["body"];
    const facet = Object.keys(body.questions)[0] ?? "";
    const request: CapturedRequest = {
      url,
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body,
      facet,
    };
    requests.push(request);
    options.onRequest?.(request);
    noteArrival();

    const outcome = options.outcomes?.[facet as Facet];

    // Honor the abort signal the SDK passes down, exactly as a real transport would, so the
    // cancellation tests exercise the real path rather than a shortcut.
    const signal = init?.signal ?? undefined;
    if (signal?.aborted) throw abortError();

    if (outcome?.kind === "network") throw new TypeError("fetch failed");

    if (outcome?.kind === "hang" || options.hold) {
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => reject(abortError());
        if (outcome?.kind !== "hang") held.push({ request, release: resolve });
        signal?.addEventListener("abort", onAbort, { once: true });
      });
    }

    return respond(facet);
  };

  return {
    fetch,
    get requests() {
      return requests;
    },
    get inFlight() {
      return held.length;
    },
    async waitForRequests(count) {
      while (requests.length < count) {
        await new Promise<void>((resolve) => arrivals.push(resolve));
      }
    },
    releaseAll() {
      for (const pending of held.splice(0)) pending.release();
    },
  };
};

const abortError = (): Error => {
  const error = new Error("This operation was aborted");
  error.name = "AbortError";
  return error;
};

/** Options that route every request through the fake and satisfy configuration validation. */
export const fakeOptions = (provider: FakeProvider, extra: AnalyzeOptions = {}): AnalyzeOptions => ({
  apiKey: "test-key-not-a-real-secret",
  baseURL: "https://api.typesafe.test",
  model: "jev-test",
  fetch: provider.fetch,
  ...extra,
});

export { FACETS };

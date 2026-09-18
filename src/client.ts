/**
 * Provider integration: one facet, one request.
 *
 * The client is built once per distinct configuration and reused, so the four concurrent facet
 * requests share connection handling rather than each standing up their own transport.
 *
 * Retries are disabled. The SDK defaults to `maxRetries: 2`, which would make a single analysis
 * issue up to twelve outbound calls; v1 wants exactly four so request counts and timings stay
 * transparent. A failed facet stays visible and can be rerun explicitly with `analyzeFacet`.
 */

import { choice, TypeSafeClient } from "@typesafe-ai/sdk";

import type { ResolvedConfig } from "./config.ts";
import { instructionsFor, STATE_KEY } from "./prompts.ts";
import { criteriaFor, type Facet } from "./taxonomies.ts";
import type { FacetUsage } from "./types.ts";

/** What one facet request returns, before validation. */
export interface RawFacetResponse {
  /** Provider-reported model for this request. */
  readonly model: string;
  /** The raw Choice answer, validated by `validate.ts`. */
  readonly answer: unknown;
  readonly usage: FacetUsage | null;
}

const clients = new Map<string, TypeSafeClient>();

/** Cache key covering every setting that changes client behavior. A custom fetch is never cached. */
const cacheKeyFor = (config: ResolvedConfig): string =>
  JSON.stringify([config.apiKey, config.baseURL ?? "", config.timeoutMs]);

/**
 * Get a client for this configuration, reusing one where possible.
 *
 * Configurations carrying a custom `fetch` bypass the cache: tests hand in a fresh fake per case
 * and must never receive a client wired to a previous one.
 */
export const getClient = (config: ResolvedConfig): TypeSafeClient => {
  if (config.fetch) return buildClient(config);

  const key = cacheKeyFor(config);
  const existing = clients.get(key);
  if (existing) return existing;

  const client = buildClient(config);
  clients.set(key, client);
  return client;
};

const buildClient = (config: ResolvedConfig): TypeSafeClient =>
  new TypeSafeClient({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    ...(config.fetch ? { fetch: config.fetch } : {}),
    // Per-attempt timeout. With retries off there is no retry budget on top of it, so this is a
    // real deadline on the request rather than an invented provider option.
    timeout: config.timeoutMs,
    retry: { maxRetries: 0 },
  });

/** Discard `undefined` for the SDK's `RequestOptions`, which uses optional rather than nullable fields. */
const requestOptions = (signal: AbortSignal | undefined) => (signal ? { signal } : {});

/**
 * Issue one facet's request.
 *
 * The payload carries the same normalized input as its three siblings and exactly one Choice
 * question, keyed by the facet name, with that facet's own instructions and definitions.
 */
export const requestFacet = async (
  facet: Facet,
  normalizedInput: string,
  config: ResolvedConfig,
  signal?: AbortSignal,
): Promise<RawFacetResponse> => {
  const client = getClient(config);

  const result = await client.systemOne(
    {
      model: config.model,
      // User text reaches the model only here, as JSON state. It is never interpolated into
      // instructions or criteria.
      state: { [STATE_KEY]: normalizedInput },
      questions: {
        [facet]: choice(instructionsFor(facet), criteriaFor(facet)),
      },
    },
    requestOptions(signal),
  );

  return {
    model: typeof result.model === "string" ? result.model : config.model,
    answer: (result.answers as Record<string, unknown>)[facet],
    usage: normalizeUsage(result.usage),
  };
};

/** Keep usage when the provider reports it; never fabricate token counts or a dollar cost. */
const normalizeUsage = (usage: unknown): FacetUsage | null => {
  if (typeof usage !== "object" || usage === null) return null;
  const { input_tokens, output_tokens } = usage as Record<string, unknown>;
  if (typeof input_tokens !== "number" || typeof output_tokens !== "number") return null;
  return { input_tokens, output_tokens };
};

/** Drop cached clients. Exists so tests cannot leak a client between cases. */
export const resetClientCache = (): void => {
  clients.clear();
};

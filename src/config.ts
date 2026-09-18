/**
 * Local configuration, resolved before any network call.
 *
 * A missing key or an unusable timeout raises `ConfigurationError` here, so an analysis either
 * runs for real or fails loudly. There is no fallback to fake output.
 */

import { ConfigurationError } from "./errors.ts";
import type { AnalyzeOptions } from "./types.ts";

/** Used when `TYPESAFE_MODEL` is unset. */
export const DEFAULT_MODEL = "jev-latest";

/** Used when `JEV_TIMEOUT_MS` is unset. Matches the SDK's own default. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** Environment variable names this application reads. */
export const ENV_VARS = {
  apiKey: "TYPESAFE_API_KEY",
  model: "TYPESAFE_MODEL",
  baseURL: "TYPESAFE_BASE_URL",
  timeoutMs: "JEV_TIMEOUT_MS",
} as const;

/** Fully resolved settings for one analysis. */
export interface ResolvedConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly timeoutMs: number;
  readonly baseURL: string | undefined;
  readonly fetch: AnalyzeOptions["fetch"];
}

/** Read one trimmed environment value. Returns `undefined` off Node, where there is no `process`. */
const readEnv = (name: string): string | undefined =>
  typeof process === "undefined" || !process.env ? undefined : process.env[name]?.trim() || undefined;

/**
 * Resolve configuration from explicit options, then the environment, then defaults.
 *
 * Note that the model environment variable is this application's `TYPESAFE_MODEL`, mapped
 * explicitly onto the SDK's `defaultModel` option. The SDK's own variable is
 * `TYPESAFE_DEFAULT_MODEL`; we do not rely on it, so the name a user sets in `.env` is the name
 * documented in `.env.example`.
 *
 * @throws {ConfigurationError} when credentials are missing or the timeout is unusable.
 */
export const resolveConfig = (options: AnalyzeOptions = {}): ResolvedConfig => {
  const apiKey = options.apiKey ?? readEnv(ENV_VARS.apiKey);
  if (!apiKey) {
    throw new ConfigurationError(
      `Missing API key. Set ${ENV_VARS.apiKey} in the environment or a local .env file.`,
    );
  }

  return {
    apiKey,
    model: options.model ?? readEnv(ENV_VARS.model) ?? DEFAULT_MODEL,
    timeoutMs: resolveTimeout(options.timeoutMs),
    baseURL: options.baseURL ?? readEnv(ENV_VARS.baseURL),
    fetch: options.fetch,
  };
};

const resolveTimeout = (override: number | undefined): number => {
  if (override !== undefined) return assertTimeout(override, "timeoutMs option");

  const raw = readEnv(ENV_VARS.timeoutMs);
  if (raw === undefined) return DEFAULT_TIMEOUT_MS;

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new ConfigurationError(`${ENV_VARS.timeoutMs} must be a number; received "${raw}".`);
  }
  return assertTimeout(parsed, ENV_VARS.timeoutMs);
};

const assertTimeout = (value: number, source: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ConfigurationError(
      `${source} must be a finite number of milliseconds greater than zero; received ${value}.`,
    );
  }
  return value;
};

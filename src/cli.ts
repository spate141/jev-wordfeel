#!/usr/bin/env node
/**
 * wordfeel CLI.
 *
 * stdout carries the result JSON and nothing else, so it can be piped straight into `jq` or a
 * file. Usage, hints, timing summaries, and errors all go to stderr.
 *
 * Exit codes: 0 all facets answered, 1 at least one facet failed (partial JSON is still printed),
 * 2 invalid configuration or input (no JSON is printed).
 */

import { analyzeFacet, analyzeWord } from "./analyze.ts";
import { ConfigurationError, InputValidationError } from "./errors.ts";
import { DEFAULT_TIMEOUT_MS, ENV_VARS } from "./config.ts";
import { FACETS, isFacet, type Facet } from "./taxonomies.ts";
import type { AnalysisResult, AnalyzeOptions, FacetFailure, FacetSuccess } from "./types.ts";

const EXIT_OK = 0;
const EXIT_FACET_FAILURE = 1;
const EXIT_BAD_USAGE = 2;

const USAGE = `wordfeel - four sensory association profiles for a word or short phrase

Usage:
  npm run analyze -- <word or phrase> [options]

Options:
  --facet <name>    Analyze one facet only: ${FACETS.join(", ")}.
                    Use this to rerun a facet that failed in an earlier analysis.
  --timeout <ms>    Per-request timeout. Default ${DEFAULT_TIMEOUT_MS}, or ${ENV_VARS.timeoutMs}.
  --model <name>    Model to request. Default from ${ENV_VARS.model}.
  -h, --help        Show this message.

Environment:
  ${ENV_VARS.apiKey}    Required.
  ${ENV_VARS.model}      Optional. Defaults to jev-latest.
  ${ENV_VARS.timeoutMs}      Optional. Defaults to ${DEFAULT_TIMEOUT_MS}.

Output:
  Result JSON on stdout, diagnostics on stderr.`;

interface ParsedArgs {
  readonly input: string;
  readonly facet: Facet | undefined;
  readonly options: AnalyzeOptions;
}

class UsageError extends Error {}

const parseArgs = (argv: readonly string[]): ParsedArgs => {
  const positional: string[] = [];
  let facet: Facet | undefined;
  const options: { timeoutMs?: number; model?: string } = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;

    switch (arg) {
      case "--facet": {
        const value = argv[++i];
        if (!isFacet(value)) {
          throw new UsageError(
            `--facet must be one of ${FACETS.join(", ")}; received ${value === undefined ? "nothing" : `"${value}"`}.`,
          );
        }
        facet = value;
        break;
      }
      case "--timeout": {
        const value = Number(argv[++i]);
        if (!Number.isFinite(value) || value <= 0) {
          throw new UsageError("--timeout must be a number of milliseconds greater than zero.");
        }
        options.timeoutMs = value;
        break;
      }
      case "--model": {
        const value = argv[++i];
        if (!value) throw new UsageError("--model requires a model name.");
        options.model = value;
        break;
      }
      default: {
        if (arg.startsWith("--")) throw new UsageError(`Unknown option "${arg}".`);
        positional.push(arg);
      }
    }
  }

  if (positional.length === 0) throw new UsageError("Provide a word or short phrase to analyze.");

  // Joining lets an unquoted phrase work: `npm run analyze -- first date`. normalizeInput
  // collapses the whitespace either way, so a quoted phrase behaves identically.
  return { input: positional.join(" "), facet, options };
};

/** One-line-per-facet summary on stderr, so a terminal run is readable without piping to jq. */
const summarize = (result: AnalysisResult): void => {
  process.stderr.write(
    `${result.normalized_input}: ${result.status} in ${result.total_latency_ms.toFixed(0)}ms\n`,
  );
  for (const facet of FACETS) {
    // Widen away the per-facet label union: the summary only needs the label as text.
    const outcome: FacetSuccess<string> | FacetFailure = result.facets[facet];
    process.stderr.write(
      outcome.status === "ok"
        ? `  ${facet.padEnd(8)} ${outcome.choice} (p=${(outcome.probabilities[outcome.choice] ?? 0).toFixed(3)}` +
            `, confidence=${outcome.confidence.toFixed(3)}, ${outcome.latency_ms.toFixed(0)}ms)\n`
        : `  ${facet.padEnd(8)} FAILED ${outcome.error.code}: ${outcome.error.message}\n`,
    );
  }
};

const main = async (argv: readonly string[]): Promise<number> => {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    process.stderr.write(`${USAGE}\n`);
    return argv.length === 0 ? EXIT_BAD_USAGE : EXIT_OK;
  }

  const { input, facet, options } = parseArgs(argv);

  // A single facet is still reported inside the ordinary envelope, so the two modes produce the
  // same shape and a caller can merge a rerun facet into an earlier result.
  if (facet) {
    const outcome = await analyzeFacet(facet, input, options);
    process.stdout.write(`${JSON.stringify({ [facet]: outcome }, null, 2)}\n`);
    if (outcome.status === "ok") return EXIT_OK;
    process.stderr.write(`${facet} failed: ${outcome.error.code}: ${outcome.error.message}\n`);
    return EXIT_FACET_FAILURE;
  }

  const result = await analyzeWord(input, options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  summarize(result);
  return result.status === "ok" ? EXIT_OK : EXIT_FACET_FAILURE;
};

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  if (error instanceof UsageError) {
    process.stderr.write(`${error.message}\n\n${USAGE}\n`);
  } else if (error instanceof ConfigurationError || error instanceof InputValidationError) {
    process.stderr.write(`${error.name}: ${error.message}\n`);
  } else {
    process.stderr.write(`Unexpected error: ${error instanceof Error ? error.message : error}\n`);
  }
  process.exitCode = EXIT_BAD_USAGE;
}

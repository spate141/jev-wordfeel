/**
 * CLI behavior.
 *
 * Runs the real entry point in a child process so the assertions cover stream separation and
 * exit codes rather than an in-process approximation. A tiny stub server stands in for the
 * provider, since the CLI has no fetch-injection seam by design.
 */

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer, type Server } from "node:http";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { labelsFor, type Facet } from "../src/taxonomies.ts";

const run = promisify(execFile);
const CLI = fileURLToPath(new URL("../src/cli.ts", import.meta.url));

let server: Server;
let baseURL: string;
/** Facets the stub should fail, so a test can drive the partial-result exit code. */
let failing = new Set<string>();

before(async () => {
  server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString()) as {
        questions: Record<string, unknown>;
      };
      const facet = Object.keys(body.questions)[0] as Facet;

      if (failing.has(facet)) {
        response.writeHead(500, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "synthetic failure" }));
        return;
      }

      const labels = labelsFor(facet) as readonly string[];
      const share = 0.4 / (labels.length - 1);
      const probabilities = Object.fromEntries(labels.map((label) => [label, share]));
      probabilities[labels[0]!] = 1 - share * (labels.length - 1);

      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          model: "jev-1-test",
          answers: {
            [facet]: { type: "choice", choice: labels[0], confidence: 0.77, probabilities },
          },
          usage: { input_tokens: 100, output_tokens: 6 },
        }),
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (typeof address === "string" || address === null) throw new Error("no server address");
  baseURL = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

const cli = (args: readonly string[], env: Record<string, string> = {}) =>
  run("node", [CLI, ...args], {
    env: {
      ...process.env,
      TYPESAFE_API_KEY: "test-key",
      TYPESAFE_BASE_URL: baseURL,
      TYPESAFE_MODEL: "jev-test",
      ...env,
    },
  });

/** execFile rejects on a nonzero exit; normalize both paths into one shape. */
const cliResult = async (args: readonly string[], env: Record<string, string> = {}) => {
  try {
    const { stdout, stderr } = await cli(args, env);
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code?: number; stdout: string; stderr: string };
    return { code: failure.code ?? -1, stdout: failure.stdout, stderr: failure.stderr };
  }
};

test("a successful analysis prints only JSON on stdout and exits 0", async () => {
  failing = new Set();

  const { code, stdout, stderr } = await cliResult(["Chicago"]);

  assert.equal(code, 0);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.status, "ok");
  assert.equal(parsed.normalized_input, "Chicago");
  assert.deepEqual(Object.keys(parsed.facets), ["taste", "material", "smell", "shape"]);

  // The human-readable summary belongs on stderr so stdout stays pipeable.
  assert.ok(stderr.includes("Chicago: ok"));
});

test("an unquoted phrase is joined and normalized", async () => {
  failing = new Set();

  const { stdout } = await cliResult(["first", "date"]);

  assert.equal(JSON.parse(stdout).normalized_input, "first date");
});

test("a failed facet still prints partial JSON and exits 1", async () => {
  failing = new Set(["smell"]);

  const { code, stdout } = await cliResult(["banana"]);

  assert.equal(code, 1);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.status, "partial");
  assert.equal(parsed.facets.smell.status, "error");
  assert.equal(parsed.facets.taste.status, "ok", "successful facets are still printed");
});

test("--facet reruns a single facet in the same envelope shape", async () => {
  failing = new Set();

  const { code, stdout } = await cliResult(["banana", "--facet", "material"]);

  assert.equal(code, 0);
  const parsed = JSON.parse(stdout);
  assert.deepEqual(Object.keys(parsed), ["material"]);
  assert.equal(parsed.material.status, "ok");
});

test("a missing API key exits 2 with no JSON on stdout", async () => {
  const { code, stdout, stderr } = await cliResult(["banana"], { TYPESAFE_API_KEY: "" });

  assert.equal(code, 2);
  assert.equal(stdout, "");
  assert.match(stderr, /ConfigurationError/);
  assert.match(stderr, /TYPESAFE_API_KEY/);
});

test("invalid input exits 2 with no JSON on stdout", async () => {
  const { code, stdout, stderr } = await cliResult(["   "]);

  assert.equal(code, 2);
  assert.equal(stdout, "");
  assert.match(stderr, /InputValidationError/);
});

test("an unknown option and an unknown facet both exit 2 with usage", async () => {
  const unknownOption = await cliResult(["banana", "--nope"]);
  assert.equal(unknownOption.code, 2);
  assert.match(unknownOption.stderr, /Unknown option/);
  assert.match(unknownOption.stderr, /Usage:/);

  const unknownFacet = await cliResult(["banana", "--facet", "texture"]);
  assert.equal(unknownFacet.code, 2);
  assert.match(unknownFacet.stderr, /--facet must be one of/);
});

test("--help exits 0 and writes usage to stderr", async () => {
  const { code, stdout, stderr } = await cliResult(["--help"]);

  assert.equal(code, 0);
  assert.equal(stdout, "");
  assert.match(stderr, /Usage:/);
});

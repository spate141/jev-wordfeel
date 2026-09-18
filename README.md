# wordfeel

Turn any word into probability distributions over taste, material, scent, and shape. Powered by Jev.

Type a word or a short phrase — `banana`, `Chicago`, `Monday`, `nostalgia`, `first date`, a name — and
wordfeel returns four sensory association profiles:

1. What does it taste like?
2. What material does it feel made of?
3. What does it smell like?
4. What shape represents it?

Each profile is a full probability distribution over a fixed palette, not a single guess. This is a playful
interpretation of language, not a measurement. A material profile that spreads across glass and smoke is an
association, not a chemical analysis.

This repository includes the reusable core and CLI plus a visual React demo: a small sensory cabinet of
code-generated specimens driven by the model's real probability distributions.

## Setup

Requires Node.js 22.18 or newer. The library runs `.ts` directly through Node's native type stripping, so
there is no build step for local use.

```bash
npm install
cp .env.example .env    # then paste your key into .env
```

Get a key at [typesafe.ai](https://typesafe.ai).

```dotenv
TYPESAFE_API_KEY=       # required
TYPESAFE_MODEL=jev-latest
JEV_TIMEOUT_MS=10000
```

The npm scripts load `.env` with Node's own `--env-file-if-exists` flag; no dotenv package is involved. If you
call the library from your own program, load the file yourself (`node --env-file=.env your-app.js`) or export
the variables in your shell. The key is server-side only: `.env` is gitignored, the key is never printed, and
it never appears in a result or an error message. Do not ship it to a browser.

`JEV_TIMEOUT_MS` is this application's setting, mapped onto the SDK's per-request timeout. `TYPESAFE_MODEL` is
likewise ours, mapped onto the SDK's `defaultModel`. (The SDK's own variable is `TYPESAFE_DEFAULT_MODEL`;
wordfeel does not read it, so the name in `.env.example` is the name that takes effect.)

## Web app

Run the single-origin development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Node server mounts Vite in middleware mode during
development, so the browser and `/api` routes share one origin. A submit calls `POST /api/analyze`; retrying a
failed panel calls `POST /api/analyze-facet` and does not rerun the other senses.

For a production-style local run:

```bash
npm run build:app
npm start
```

The production server serves `web/dist`, caching hashed assets while keeping the HTML uncached. API request
bodies are capped at 4 KiB. By default, the adapter allows 30 API requests per source IP per minute and four
concurrent API operations. These in-memory limits are intended for a small single-process demo and reset on
restart. Configure them with `WORDFEEL_RATE_LIMIT_PER_MINUTE` and `WORDFEEL_MAX_CONCURRENT`; set
`WORDFEEL_TRUST_PROXY=true` only behind a trusted reverse proxy.

The four illustrations are inline SVG and support every v1 taxonomy label. Exact values remain available in
each panel's profile, while animation respects the browser's reduced-motion preference. **Save image** exports
the displayed result as a self-contained light-theme SVG postcard without making another model request.

### Deploy

The live site is [wordfeel.snehal.ai](https://wordfeel.snehal.ai), a Cloudflare Worker with static
assets. The cabinet is served from `web/dist` by the assets layer; the two API routes run in the
Worker (`worker/`) so the Jev key stays server-side. Both halves share one origin, so the browser
calls relative `/api` paths and no CORS configuration exists. Only `/api/*` invokes the Worker, so
page loads cost no invocation.

The API logic itself lives once, in `server/handler.ts`, free of Node builtins. `server/app.ts`
adapts it to Node for `npm run dev`; `worker/api.ts` adapts it to the Workers runtime for
production. Local and deployed behavior cannot drift apart.

`npm run dev:worker` runs the real Workers runtime locally. See [`docs/deploy.md`](docs/deploy.md)
for build settings, the secret, the custom domain, and the edge rate-limiting rule.

### The TypeSafe skill

This project was built against the [`typesafe-ai` agent skill](https://github.com/typesafe-ai/skills) and the
live docs it points to, not from memory. To load it in your own agent session:

```bash
npx skills add typesafe-ai/skills --skill typesafe-ai
```

The skill directs you to the [documentation index](https://docs.typesafe.ai/llms.txt), which is the source of
truth for the [Choice primitive](https://docs.typesafe.ai/primitives/choice), the
[JavaScript SDK](https://docs.typesafe.ai/sdk/javascript), and the [HTTP API](https://docs.typesafe.ai/api).
Read those rather than treating this README as the provider contract.

## CLI

```bash
npm run analyze -- "Chicago"
npm run analyze -- "first date"
npm run analyze -- banana --facet smell        # rerun one facet
npm run analyze -- nostalgia --timeout 20000
```

stdout carries the result JSON and nothing else, so it pipes cleanly:

```bash
npm run analyze -- banana 2>/dev/null | jq '.facets.taste.ranked[:3]'
```

A readable per-facet summary, plus any errors, goes to stderr.

| Exit code | Meaning |
| --- | --- |
| `0` | All four facets answered. |
| `1` | At least one facet failed. The partial result JSON is still printed. |
| `2` | Invalid configuration, input, or usage. No JSON is printed. |

## Library

```ts
import { analyzeWord, analyzeFacet } from "wordfeel";

const result = await analyzeWord("Chicago");

if (result.facets.material.status === "ok") {
  const { choice, probabilities, confidence, ranked } = result.facets.material;
  console.log(choice, confidence, ranked.slice(0, 3));
  console.log(probabilities.stone, probabilities.no_association);
}

// Rerun just the facet that failed, later.
const retry = await analyzeFacet("smell", "Chicago");
```

Labels are typed per facet, derived from the taxonomy tables, so `probabilities.stone` type-checks on the
material facet and not on the taste facet.

Options accepted by both functions:

| Option | Meaning |
| --- | --- |
| `signal` | `AbortSignal` that cancels outstanding requests. |
| `timeoutMs` | Per-request timeout for this call. |
| `model` | Model to request for this call. |
| `apiKey`, `baseURL` | Credential and endpoint overrides. |
| `fetch` | Custom fetch implementation. This is the seam the test suite uses. |

The core has no browser, rendering, framework, database, or deployment dependencies. Its only runtime
dependency is `@typesafe-ai/sdk`.

## Labels

Four fixed palettes. These are curated demo vocabularies, not exhaustive scientific classifications, and the
IDs are part of the public contract. `taxonomy_version` is bumped when any ID or definition changes meaning.

Each label is sent to the model as a structured criterion — what it covers, what it is *not* for, and a few
examples — rather than a bare sentence. Several labels in each palette are deliberate near-neighbours, and
the exclusions are what keeps them apart.

- **Taste** (21): `sweet`, `sour`, `salty`, `bitter`, `umami`, `fatty`, `astringent`, `metallic`, `mineral`, `pungent`, `cooling`, `effervescent`, `fermented`, `caramelized`, `nutty`, `green`, `medicinal`, `bland`, `smoky`, `cloying`, `no_association`.
  Flavor in the mouth, including sensations that arrive with it: burning heat, cooling tingle, fizz.
  Aroma on its own belongs to the smell palette.
- **Material** (23): `glass`, `metal`, `wood`, `stone`, `fabric`, `water`, `smoke`, `rubber`, `paper`, `clay`, `ice`, `leather`, `plastic`, `sand`, `crystal`, `wax`, `bone`, `moss`, `concrete`, `foam`, `ash`, `amber`, `no_association`.
- **Smell** (21): `floral`, `citrus`, `woody`, `earthy`, `smoky`, `herbal`, `spicy`, `oceanic`, `gourmand`, `musky`, `ozonic`, `chemical`, `animalic`, `dusty`, `resinous`, `fruity`, `minty`, `fermented`, `metallic`, `putrid`, `no_association`.
- **Shape** (21): `circle`, `triangle`, `square`, `star`, `spiral`, `wave`, `line`, `arc`, `ring`, `crescent`, `hexagon`, `diamond`, `cross`, `zigzag`, `grid`, `burst`, `knot`, `branch`, `cloud`, `shard`, `no_association`.

Probabilities come back as the model reported them. Nothing is renormalized, smoothed, or rounded. The sum
is required to be near 1 within a tolerance that scales with the palette — the provider rounds each value, and
that error accumulates once per candidate — and an answer inside that tolerance keeps its own drift.

`no_association` is in every palette so an uninterpretable or unsuitable input has an explicit outcome. Its
probability stays in the returned distribution; it is never hidden and the other labels are never
renormalized without it. It is an answer, not a failure — distinct from a facet whose request errored.

The palettes and their display order live in [`src/taxonomies.ts`](src/taxonomies.ts); every word sent to the
model lives in [`src/prompts.ts`](src/prompts.ts). Both are meant to be read.

## Four separate concurrent requests

Every analysis fans out into **four independent Jev requests**, one per facet, each carrying the same
normalized input as JSON state and exactly one Choice question with that facet's own instructions and
definitions.

```ts
const jobs = FACETS.map((facet) => runFacet(facet, normalized, config, options.signal));
const settled = await Promise.allSettled(jobs);
```

The four calls are initiated before the first `await`, so all four are in flight together; no facet waits on
or reads another's answer. `total_latency_ms` is wall-clock time around the whole fan-out, which is roughly
the slowest facet rather than the sum of the four.

This is a deliberate product decision. The TypeSafe skill generally recommends batching independent questions
into one request, which would be cheaper here; this project keeps them separate so each facet can fail, time
out, and be retried on its own. Retries are disabled (the SDK defaults to two), so one normal analysis makes
exactly four outbound calls. There is no caching in v1, so request counts and timings stay transparent.

The one exception: a `signal` that is already aborted when `analyzeWord` is called starts zero requests.

## What the numbers mean

Each facet asks Jev one Choice question — which single category best represents this facet — and keeps the
answer as it came back.

- **`probabilities`** is the model's full native distribution over that facet's candidates. It is returned
  unrounded, with every candidate present including zero-valued ones. wordfeel does not compute a second
  softmax, smooth a peaked result, impose a probability floor, or ask the model to write numbers as text.
  Peaked distributions are valid output.
- **`confidence`** is a separate provider-reported field describing how concentrated the distribution is. It
  is not accuracy, and it is not sensory intensity. A low value is not an error in a creative application
  like this one.
- **`ranked`** is a descending sort of those same unmodified values, with taxonomy display order as the
  tie-break, so the ordering is deterministic across runs.

This v1 asks which single representative category fits best and keeps the distribution over the competitors.
It does not estimate independent multi-label presence, physical composition, or measured intensity.

A response is validated rather than repaired. A facet's answer is accepted only if the candidate keys match
its taxonomy exactly, every probability and the confidence is a finite number in `[0, 1]`, the selected label
is one of the candidates and holds a maximum probability (ties allowed), and the probabilities sum to within
`1e-4` of 1. Anything else becomes an `invalid_response` failure with its numbers discarded, never patched
into shape.

## Timeouts, failures, and cancellation

Facets fail independently. A failure never carries fabricated probabilities.

| `error.code` | Cause |
| --- | --- |
| `timeout` | The request exceeded `JEV_TIMEOUT_MS`. |
| `cancelled` | An `AbortSignal` cancelled the request. |
| `authentication` | 401 or 403. Check `TYPESAFE_API_KEY`. |
| `rate_limit` | 429. |
| `network` | DNS, TLS, or a dropped connection. |
| `provider_error` | Any other API error. |
| `invalid_response` | The answer did not satisfy the contract above. |

The overall `status` is `ok` when all four answered, `error` when none did, and `partial` otherwise. Partial
results are the normal case to design for: successful facets are always returned, and a failed one can be
rerun with `analyzeFacet`.

Cancelling through `signal` aborts the outstanding transport work and releases its listeners. Facets that had
already completed keep their results.

## Development

```bash
npm run typecheck    # tsc --noEmit
npm test             # node --test
npm run build        # emit dist/ for publishing
npm run test:ui      # Vitest + Testing Library
npm run test:e2e     # Playwright viewport/accessibility checks
npm run verify       # core + UI tests, type checks, and both builds
npm run dev:worker   # the deployed runtime, locally (Cloudflare Workers)
```

The test suite is deterministic and makes no network calls. It drives the real client over a fake `fetch`
injected through the SDK's own option, so the request bodies under assertion are the exact bytes the SDK
would have sent, and responses are released manually rather than raced against a stopwatch. It covers the
four-concurrent-requests requirement, partial and total failure, response validation, input normalization,
configuration, deadlines, cancellation, ranking determinism, and CLI exit codes.

### Live smoke check

Makes real, billable calls — three analyses, twelve requests:

```bash
npm run smoke                        # banana, Chicago, nostalgia
npm run smoke -- "your word here"
```

It reports actual status, model, latency, and the top labels. It asserts no particular metaphorical answers;
the prompts and taxonomies are not tuned toward any example word.

## Scope

The reusable core remains free of browser and framework dependencies. The website is a thin consumer around
its public functions and types; rendering concerns do not leak into the core contract. The project still has
no accounts, database, cache, streaming protocol, or retrieval pipeline. Deployment is a thin outer layer:
the Cloudflare Worker configuration and a second adapter around the same request handler, adding nothing the
core has to know about.

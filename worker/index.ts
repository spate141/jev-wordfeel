/**
 * The deployed entry point: one Worker serving both halves of the site.
 *
 * Static assets (`web/dist`) are served by the assets layer without invoking this Worker, except for
 * the `/api/*` prefix, which `wrangler.jsonc` routes here first. So the only code that runs per
 * analysis is the API path; page loads cost nothing.
 *
 * All request handling lives in `../server/handler.ts`, shared with the Node server behind
 * `npm run dev`. This file is only routing.
 */

import { respondToAnalyze, type Env } from "./api.ts";

const API_ROUTES = {
  "/api/analyze": "analyze",
  "/api/analyze-facet": "analyze-facet",
} as const;

export default {
  fetch: (request, env) => {
    const { pathname } = new URL(request.url);
    const route = API_ROUTES[pathname as keyof typeof API_ROUTES];
    if (route) return respondToAnalyze(route, request, env);

    // Reached only if the assets layer passes something through; it answers page loads itself,
    // including the single-page fallback for an unknown path.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

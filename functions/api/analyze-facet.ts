/** `POST /api/analyze-facet` — one named facet, for retrying a single failure. */

import { respondToAnalyze, type Env } from "../_lib.ts";

export const onRequest: PagesFunction<Env> = ({ request, env }) =>
  respondToAnalyze("analyze-facet", request, env);

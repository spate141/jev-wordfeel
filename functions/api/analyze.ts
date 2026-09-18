/** `POST /api/analyze` — all four facets, fanned out concurrently. */

import { respondToAnalyze, type Env } from "../_lib.ts";

export const onRequest: PagesFunction<Env> = ({ request, env }) =>
  respondToAnalyze("analyze", request, env);

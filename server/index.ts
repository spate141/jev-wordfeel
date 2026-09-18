import { createServer } from "node:http";
import process from "node:process";

import { createRequestHandler } from "./app.ts";

const production = process.argv.includes("--production");
const port = parsePositiveInteger(process.env.PORT, 5173, "PORT");

const app = createRequestHandler({
  rateLimitPerMinute: parsePositiveInteger(
    process.env.WORDFEEL_RATE_LIMIT_PER_MINUTE,
    30,
    "WORDFEEL_RATE_LIMIT_PER_MINUTE",
  ),
  maxConcurrent: parsePositiveInteger(
    process.env.WORDFEEL_MAX_CONCURRENT,
    4,
    "WORDFEEL_MAX_CONCURRENT",
  ),
  trustProxy: process.env.WORDFEEL_TRUST_PROXY === "true",
});

if (production) {
  createServer(app).listen(port, () => {
    console.log(`Wordfeel is listening on http://localhost:${port}`);
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    configFile: new URL("../web/vite.config.ts", import.meta.url).pathname,
    server: { middlewareMode: true },
    appType: "spa",
  });
  createServer(async (request, response) => {
    if ((request.url ?? "").startsWith("/api/")) {
      await app(request, response);
      return;
    }
    vite.middlewares(request, response, () => app(request, response));
  }).listen(port, () => {
    console.log(`Wordfeel development server is listening on http://localhost:${port}`);
  });
}

function parsePositiveInteger(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer.`);
  return value;
}

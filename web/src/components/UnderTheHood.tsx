import type { AnalysisResult } from "../../../src/types.ts";

export function UnderTheHood({ result }: { readonly result: AnalysisResult }) {
  const models = [...new Set(Object.values(result.facets).flatMap((facet) => facet.status === "ok" ? [facet.model] : []))];
  const usage = Object.values(result.facets).reduce(
    (total, facet) => facet.status === "ok" && facet.usage
      ? { input: total.input + facet.usage.input_tokens, output: total.output + facet.usage.output_tokens }
      : total,
    { input: 0, output: 0 },
  );
  return (
    <details className="under-hood">
      <summary>Under the hood</summary>
      <div className="under-grid">
        <span>Requested model</span><strong>{result.requested_model}</strong>
        <span>Reported model</span><strong>{models.join(", ") || "Unavailable"}</strong>
        <span>Model round trip</span><strong className="tabular">{Math.round(result.total_latency_ms)}ms</strong>
        <span>Tokens</span><strong className="tabular">{usage.input + usage.output || "Unavailable"}</strong>
        <span>Schema / prompt / taxonomy</span><strong>{result.schema_version} / {result.prompt_version} / {result.taxonomy_version}</strong>
      </div>
      <details className="raw-result"><summary>Raw result</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>
    </details>
  );
}

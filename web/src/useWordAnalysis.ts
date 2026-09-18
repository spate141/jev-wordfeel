import { useCallback, useEffect, useRef, useState } from "react";

import type { AnalysisResult, Facet, FacetResults } from "../../src/types.ts";
import { requestAnalysis, requestFacet } from "./api.ts";

const normalizedForComparison = (value: string): string =>
  value.normalize("NFC").replace(/\s+/gu, " ").trim();

export interface WordAnalysisState {
  readonly result: AnalysisResult | null;
  readonly pendingInput: string | null;
  readonly showLoading: boolean;
  readonly error: string | null;
  readonly retrying: ReadonlySet<Facet>;
  submit(input: string): void;
  retry(facet: Facet): void;
}

export const useWordAnalysis = (): WordAnalysisState => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pendingInput, setPendingInput] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<ReadonlySet<Facet>>(new Set());
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const retryControllers = useRef(new Map<Facet, AbortController>());
  const inFlightNormalized = useRef<string | null>(null);

  const abortAll = useCallback(() => {
    controller.current?.abort();
    for (const retryController of retryControllers.current.values()) retryController.abort();
    retryControllers.current.clear();
  }, []);

  useEffect(() => abortAll, [abortAll]);

  const submit = useCallback((rawInput: string) => {
    const normalized = normalizedForComparison(rawInput);
    if (!normalized) {
      setError("Enter a word or short phrase first.");
      return;
    }
    if ([...normalized].length > 80) {
      setError("Keep it to 80 characters or fewer.");
      return;
    }
    if (inFlightNormalized.current === normalized) return;

    abortAll();
    const requestGeneration = ++generation.current;
    const nextController = new AbortController();
    controller.current = nextController;
    inFlightNormalized.current = normalized;
    setPendingInput(normalized);
    setShowLoading(false);
    setError(null);
    setRetrying(new Set());

    const loadingTimer = window.setTimeout(() => {
      if (generation.current === requestGeneration) setShowLoading(true);
    }, 150);

    void requestAnalysis(rawInput, nextController.signal)
      .then((nextResult) => {
        if (generation.current !== requestGeneration) return;
        setResult(nextResult);
      })
      .catch((caught: unknown) => {
        if (nextController.signal.aborted || generation.current !== requestGeneration) return;
        setError(caught instanceof Error ? caught.message : "The service could not complete the request.");
      })
      .finally(() => {
        window.clearTimeout(loadingTimer);
        if (generation.current !== requestGeneration) return;
        controller.current = null;
        inFlightNormalized.current = null;
        setPendingInput(null);
        setShowLoading(false);
      });
  }, [abortAll]);

  const retry = useCallback((facet: Facet) => {
    if (!result || retryControllers.current.has(facet)) return;
    const requestGeneration = generation.current;
    const expectedInput = result.normalized_input;
    const retryController = new AbortController();
    retryControllers.current.set(facet, retryController);
    setRetrying((current) => new Set(current).add(facet));

    void requestFacet(result.input, facet, retryController.signal)
      .then(({ normalizedInput, result: facetResult }) => {
        if (generation.current !== requestGeneration || normalizedInput !== expectedInput) return;
        setResult((current) => {
          if (!current || current.normalized_input !== expectedInput) return current;
          const facets = { ...current.facets, [facet]: facetResult } as FacetResults;
          const successCount = Object.values(facets).filter((value) => value.status === "ok").length;
          return {
            ...current,
            facets,
            status: successCount === 4 ? "ok" : successCount === 0 ? "error" : "partial",
          };
        });
      })
      .catch((caught: unknown) => {
        if (!retryController.signal.aborted && generation.current === requestGeneration) {
          setError(caught instanceof Error ? caught.message : "That sense could not be retried.");
        }
      })
      .finally(() => {
        if (retryControllers.current.get(facet) === retryController) retryControllers.current.delete(facet);
        setRetrying((current) => {
          const next = new Set(current);
          next.delete(facet);
          return next;
        });
      });
  }, [result]);

  return { result, pendingInput, showLoading, error, retrying, submit, retry };
};

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/App.tsx";
import { makeAnalysis } from "./fixtures.ts";

const jsonResponse = (value: unknown) => Promise.resolve(new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Wordfeel app", () => {
  it("does not request on mount and submits exactly once under Strict Mode", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL) => jsonResponse(makeAnalysis()));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<StrictMode><App /></StrictMode>);
    expect(fetchMock).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText(/what word/i), "banana");
    await user.click(screen.getByRole("button", { name: "Feel it" }));
    await screen.findByRole("heading", { name: "Sweet" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/analyze");
  });

  it("ignores stale aggregate responses", async () => {
    const resolvers: Array<(value: Response) => void> = [];
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => resolvers.push(resolve))));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "banana" }));
    await user.click(screen.getByRole("button", { name: "Chicago" }));
    await act(async () => resolvers[1]?.(new Response(JSON.stringify(makeAnalysis("Chicago")), { status: 200 })));
    expect(await screen.findByRole("heading", { name: "“Chicago”" })).toBeInTheDocument();
    await act(async () => resolvers[0]?.(new Response(JSON.stringify(makeAnalysis("banana")), { status: 200 })));
    expect(screen.getByRole("heading", { name: "“Chicago”" })).toBeInTheDocument();
  });

  it("does not submit Enter while an IME composition is active", async () => {
    const fetchMock = vi.fn(() => jsonResponse(makeAnalysis("東京")));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    const input = screen.getByLabelText(/what word/i);
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "東京" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", isComposing: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows all profile rows and retries only a failed facet", async () => {
    const complete = makeAnalysis();
    const partial = {
      ...complete,
      status: "partial" as const,
      facets: {
        ...complete.facets,
        smell: { status: "error" as const, error: { code: "timeout" as const, message: "timed out" }, latency_ms: 10 },
      },
    };
    const retried = makeAnalysis().facets.smell;
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => jsonResponse(partial))
      .mockImplementationOnce(() => jsonResponse({ input: "banana", normalized_input: "banana", facet: "smell", result: retried }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "banana" }));
    await user.click(await screen.findByRole("button", { name: "Retry this sense" }));
    await screen.findByRole("heading", { name: "Citrus" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/analyze-facet");
    await user.click(screen.getAllByText("See profile")[0]!);
    await waitFor(() => expect(screen.getByRole("button", { name: /No clear association, association probability 0%/i })).toBeInTheDocument());
  });

  it("exports the displayed result without another analysis request", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL) => jsonResponse(makeAnalysis()));
    vi.stubGlobal("fetch", fetchMock);
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:wordfeel");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "banana" }));
    await user.click(await screen.findByRole("button", { name: "Save image" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith("blob:wordfeel"));
  });
});

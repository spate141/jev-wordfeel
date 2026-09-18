import { expect, test } from "@playwright/test";

import { makeAnalysis } from "../test/fixtures.ts";

test("renders, analyzes, remains accessible, and does not overflow", async ({ page }, testInfo) => {
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(makeAnalysis("banana")) });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A word. Four senses." })).toBeVisible();
  await expect(page.locator(".sense-panel")).toHaveCount(4);
  await expect(page.getByRole("heading", { name: "Waiting quietly" })).toHaveCount(4);

  await page.getByRole("button", { name: "banana" }).click();
  await expect(page.getByRole("heading", { name: "Sweet" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "“banana”" })).toBeVisible();
  await expect(page.getByText("Association probability").first()).toBeVisible();

  await page.getByText("See profile").first().click();
  await page.getByRole("button", { name: /Sweet, association probability/i }).focus();
  await expect(page.getByRole("button", { name: "Save image" })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.screenshot({ path: `test-results/screenshots/${testInfo.project.name}.png`, fullPage: true });
});

test("reduced motion produces settled geometry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(makeAnalysis("banana")) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "banana" }).click();
  await expect(page.getByRole("img", { name: "sweet taste specimen" })).toBeVisible();
});

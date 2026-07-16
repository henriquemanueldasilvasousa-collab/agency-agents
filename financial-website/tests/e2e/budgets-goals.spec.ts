import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("budgets", () => {
  test("sets a budget and shows a progress bar", async ({ page }) => {
    await login(page);
    await page.goto("/budgets");

    await page.locator("select").selectOption("Utilities");
    await page.getByPlaceholder("Monthly limit").fill("250");
    await page.getByRole("button", { name: "Set budget" }).click();

    const card = page.locator("div", { hasText: "Utilities" }).last();
    await expect(card).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete Utilities budget" })).toBeVisible();
  });
});

test.describe("goals", () => {
  test("adds a savings goal and shows progress", async ({ page }) => {
    await login(page);
    await page.goto("/goals");

    const marker = `E2E Goal ${Date.now()}`;
    await page.getByPlaceholder("Goal name").fill(marker);
    await page.getByPlaceholder("Target amount").fill("1000");
    await page.getByPlaceholder("Saved so far").fill("250");
    await page.getByRole("button", { name: "Add goal" }).click();

    const card = page.locator("div.rounded-lg", { hasText: marker }).last();
    await expect(card).toBeVisible();
    await expect(card).toContainText("25%");

    await card.getByRole("button", { name: `Delete ${marker}` }).click();
    await expect(page.locator("div", { hasText: marker })).toHaveCount(0);
  });
});

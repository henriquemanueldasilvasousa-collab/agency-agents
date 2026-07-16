import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("navigation", () => {
  test("moves between all protected pages via the nav bar", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: "Transactions" }).click();
    await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible();

    await page.getByRole("link", { name: "Budgets" }).click();
    await expect(page.getByRole("heading", { name: "Budgets" })).toBeVisible();

    await page.getByRole("link", { name: "Goals" }).click();
    await expect(page.getByRole("heading", { name: "Savings goals" })).toBeVisible();

    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("home page shows login/signup entry points when logged out", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
  });
});

test.describe("responsive layout", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("dashboard is usable on a mobile viewport", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Demo User")).toBeVisible();

    // No horizontal overflow on small screens.
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});

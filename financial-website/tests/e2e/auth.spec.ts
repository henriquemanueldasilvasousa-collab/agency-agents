import { test, expect } from "@playwright/test";
import { login, DEMO_EMAIL } from "./helpers";

test.describe("authentication", () => {
  test("redirects an unauthenticated visitor away from a protected page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/login**");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Password").fill("WrongPassword1!");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByTestId("form-error")).toHaveText(/invalid email or password/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs in with seeded demo credentials and reaches the dashboard", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Demo User")).toBeVisible();
  });

  test("signs up a new account and lands on the dashboard", async ({ page }) => {
    const email = `pw-e2e-${Date.now()}@example.com`;
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Playwright Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("StrongPass1!");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("/dashboard");
    await expect(page.getByText("Playwright Tester")).toBeVisible();
  });

  test("logs out and is redirected to login, then cannot reach protected pages", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL("/login");

    await page.goto("/dashboard");
    await page.waitForURL("/login**");
  });

  test("already-authenticated users are redirected away from /login", async ({ page }) => {
    await login(page);
    await page.goto("/login");
    await page.waitForURL("/dashboard");
  });
});

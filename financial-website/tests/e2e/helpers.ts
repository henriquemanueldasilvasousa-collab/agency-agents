import type { Page } from "@playwright/test";

export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "Password123!";

export async function login(page: Page, email = DEMO_EMAIL, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/dashboard");
}

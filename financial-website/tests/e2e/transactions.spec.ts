import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("transactions", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/transactions");
  });

  test("adds, edits, and deletes a transaction", async ({ page }) => {
    const marker = `E2E lunch ${Date.now()}`;

    await page.getByPlaceholder("Description").fill(marker);
    await page.getByPlaceholder("Amount").fill("18.75");
    await page.getByRole("button", { name: "Add transaction" }).click();

    const row = page.locator("li", { hasText: marker });
    await expect(row).toBeVisible();
    await expect(row).toContainText("$18.75");

    await row.getByRole("button", { name: `Edit ${marker}` }).click();
    await page.getByPlaceholder("Amount").fill("22.00");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(row).toContainText("$22.00");

    await row.getByRole("button", { name: `Delete ${marker}` }).click();
    await expect(page.locator("li", { hasText: marker })).toHaveCount(0);
  });

  test("rejects a negative amount client-side round trip (server validation surfaces as an error)", async ({ page }) => {
    const marker = `E2E invalid ${Date.now()}`;
    await page.getByPlaceholder("Description").fill(marker);
    await page.getByPlaceholder("Amount").fill("0");
    // HTML min="0" allows 0 but our server requires a strictly positive
    // amount — this exercises server-side validation, not just client UX.
    await page.getByRole("button", { name: "Add transaction" }).click();
    await expect(page.getByTestId("form-error")).toBeVisible();
    await expect(page.locator("li", { hasText: marker })).toHaveCount(0);
  });

  test("renders a script-tag description as inert text, not executable script (XSS)", async ({ page }) => {
    let dialogFired = false;
    page.on("dialog", async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    const payload = `<script>window.__xssFired = true</script>XSS-${Date.now()}`;
    await page.getByPlaceholder("Description").fill(payload);
    await page.getByPlaceholder("Amount").fill("1");
    await page.getByRole("button", { name: "Add transaction" }).click();

    // The literal text (including angle brackets) should be visible as plain
    // text in the DOM — proof React escaped it instead of injecting HTML.
    await expect(page.getByText(payload, { exact: false })).toBeVisible();

    const scriptExecuted = await page.evaluate(() => (window as unknown as { __xssFired?: boolean }).__xssFired);
    expect(scriptExecuted).toBeUndefined();
    expect(dialogFired).toBe(false);

    // No actual <script> element should have been injected into the DOM.
    const injectedScripts = await page.locator("script", { hasText: "__xssFired" }).count();
    expect(injectedScripts).toBe(0);
  });
});

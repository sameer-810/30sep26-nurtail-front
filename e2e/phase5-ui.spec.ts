import { test, expect } from "@playwright/test";
import { RUN_TAG, uiLogin } from "./helpers";

test.describe("Phase 5 · UI", () => {
  test("admin console: review queue and headline figures", async ({ page }) => {
    await uiLogin(page, "admin");
    await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Open cases/ }).or(page.getByText("Open cases")),
    ).toBeVisible();
    await expect(page.getByText("Escalate").first()).toBeVisible();
  });

  test("admin verifies an organisation: evidence must be checked before approval", async ({
    page,
  }) => {
    await uiLogin(page, "admin");
    await page.goto("/admin/verification");
    const card = page.getByRole("link", { name: /Paws/ }).first();
    await card.click();
    const approve = page.getByRole("button", { name: "Approve" });
    await expect(approve).toBeDisabled();
    for (const box of await page.locator('input[id^="chk-"]').all()) await box.check();
    await expect(approve).toBeEnabled();
    await approve.click();
    await page.locator("#dec-notes").fill(`${RUN_TAG} all documents checked`);
    await page.getByRole("button", { name: "Confirm: approve" }).click();
    await expect(page.getByText(/Decision recorded/)).toBeVisible();
  });

  test("organisation uploads evidence and submits from its profile", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("radio", { name: /Care service provider/ }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("#name").fill(`${RUN_TAG} Groomer`);
    await page.locator("#email").fill(`${RUN_TAG.toLowerCase()}-groomer@e2e.test`);
    await page.locator("#password").fill("a-long-enough-pass");
    await page.locator("#orgName").fill(`${RUN_TAG} Grooming Co`);
    await page.locator("#orgPostcode").fill("BS7 9AA");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(/Owners can't see your services yet/)).toBeVisible();
    await page.goto("/organisation");
    await expect(page.getByRole("button", { name: "Submit for verification" })).toBeDisabled();
    await page.locator("#ev-kind").selectOption("insurance");
    await page.locator("#ev-file").setInputFiles({
      name: "insurance.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n"),
    });
    await expect(page.getByText("Evidence added")).toBeVisible();
    await page.getByRole("button", { name: "Submit for verification" }).click();
    await expect(page.getByText(/Submitted — Nurtail will review/)).toBeVisible();
    await expect(page.getByText("Under review").first()).toBeVisible();
  });

  test("owner books a verified walker; vendor confirms and completes", async ({
    page,
    browser,
  }) => {
    await uiLogin(page, "owner");
    await page.goto("/services");
    await page.locator('input[aria-label="Postcode district"]').fill("");
    const card = page.locator("li").filter({ hasText: "Small group walk" });
    await expect(card.getByText(/Verified since/)).toBeVisible();
    await card.getByRole("button", { name: "Request a booking" }).click();
    await page.locator("#bk-animal").selectOption({ label: "Milo" });
    const soon = new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 16);
    await page.locator("#bk-date").fill(soon);
    await page.locator("#bk-notes").fill(`${RUN_TAG} please bring treats`);
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText(/requested/)).toBeVisible();

    const vendorCtx = await browser.newContext();
    const v = await vendorCtx.newPage();
    await uiLogin(v, "vendor");
    await v.goto("/bookings");
    const booking = v.locator("li").filter({ hasText: `${RUN_TAG} please bring treats` });
    await booking.getByRole("button", { name: "Confirm" }).click();
    await expect(booking.getByText("Payment held")).toBeVisible();
    await booking.getByRole("button", { name: "Mark completed" }).click();
    await expect(booking.getByText(/you receive/)).toBeVisible();
    await vendorCtx.close();
  });

  test("plans: simulated checkout issues a marked invoice", async ({ page }) => {
    await uiLogin(page, "vet");
    await page.goto("/plans");
    await expect(page.getByText("Current plan")).toBeVisible();
    await expect(page.getByText(/checkout is simulated/)).toBeVisible();
    await expect(page.getByRole("cell", { name: /NT-INV-000002/ })).toBeVisible();
  });

  test("vet home lists what's been shared", async ({ page }) => {
    await uiLogin(page, "vet");
    await expect(page.getByRole("heading", { name: "Recently shared" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Milo/ })).toBeVisible();
  });
});

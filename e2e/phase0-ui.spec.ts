import { test, expect } from "@playwright/test";
import { RUN_TAG, uiLogin } from "./helpers";

test.describe("Phase 0 · UI", () => {
  test("sign-in shows the GOV.UK error summary on an empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    const summary = page.getByRole("alert").filter({ hasText: "There is a problem" });
    await expect(summary).toBeVisible();
    await expect(summary.getByRole("link", { name: /enter your email/i })).toBeVisible();
  });

  test("wrong password shows one generic message", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("owner@nurtail.test");
    await page.locator("#password").fill("definitely-wrong");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.getByText("Email or password is incorrect")).toBeVisible();
  });

  test("role-aware navigation: rescue manager vs owner vs admin", async ({ page }) => {
    await uiLogin(page, "manager");
    const nav = page.getByRole("complementary", { name: "Main navigation" });
    await expect(nav.getByRole("link", { name: "Case pipeline" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Team" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Verification" })).toHaveCount(0);
    await expect(nav.getByText("Hope Hollow Animal Rescue")).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL(/\/login/);

    await uiLogin(page, "owner");
    await expect(nav.getByRole("link", { name: "My animals" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Case pipeline" })).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening), james/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await uiLogin(page, "admin");
    await expect(nav.getByRole("link", { name: "Verification" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Audit log" })).toBeVisible();
  });

  test("owner onboarding: pick a role, fill details, land on the owner home", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("radio", { name: /owner or adopter/i }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("#name").fill(`${RUN_TAG} Owner`);
    await page.locator("#email").fill(`${RUN_TAG.toLowerCase()}-ui-owner@e2e.test`);
    await page.locator("#password").fill("a-long-enough-pass");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText("How are your animals today?")).toBeVisible();
  });

  test("rescue onboarding validates organisation fields before submitting", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("radio", { name: /rescue or shelter/i }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Create account" }).click();
    const summary = page.getByRole("alert").filter({ hasText: "There is a problem" });
    await expect(summary.getByText("Enter your organisation's name")).toBeVisible();
    await expect(summary.getByText(/password must be at least 12/i)).toBeVisible();
  });

  test("admin audit log: integrity check passes", async ({ page }) => {
    await uiLogin(page, "admin");
    await page.goto("/audit");
    await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
    await page.getByRole("button", { name: /verify integrity/i }).click();
    await expect(page.getByText(/events verified/i)).toBeVisible();
  });

  test("command palette opens with Ctrl+K and navigates", async ({ page }) => {
    await uiLogin(page, "manager");
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible();
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search Nurtail" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("textbox").fill("team");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/team/);
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
  });

  test("manager adds a foster from the Team page", async ({ page }) => {
    await uiLogin(page, "manager");
    await page.goto("/team");
    await page.getByRole("button", { name: /add member/i }).click();
    await page.locator("#m-name").fill(`${RUN_TAG} Carer`);
    await page.locator("#m-email").fill(`${RUN_TAG.toLowerCase()}-carer@e2e.test`);
    await page.locator("#m-role").selectOption("foster");
    await page.locator("#m-password").fill("temp-password-123");
    await page
      .getByRole("dialog", { name: "Add a team member" })
      .getByRole("button", { name: "Add member" })
      .click();
    await expect(page.getByRole("cell", { name: new RegExp(`${RUN_TAG} Carer`) })).toBeVisible();
  });

  test("mobile: bottom tab bar replaces the sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await uiLogin(page, "owner");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Main navigation" })).toHaveCount(0);
    await page.getByRole("button", { name: "More" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  });
});

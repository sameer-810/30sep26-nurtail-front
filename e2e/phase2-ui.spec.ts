import { test, expect } from "@playwright/test";
import { RUN_TAG, uiLogin } from "./helpers";

test.describe("Phase 2 · UI", () => {
  test("rescue home: animals-in-care tiles, pipeline and today's tasks", async ({ page }) => {
    await uiLogin(page, "manager");
    await expect(page.getByRole("heading", { name: "Animals in care" })).toBeVisible();
    await expect(page.getByRole("link", { name: /In care/ }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Case pipeline" })).toBeVisible();
    await expect(page.getByText("Emergency vet assessment for Juniper")).toBeVisible();
  });

  test("intake wizard: validates, autosaves, confirms into a new case", async ({ page }) => {
    await uiLogin(page, "staff");
    await page.goto("/intake/new");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("alert").getByText("Choose a species")).toBeVisible();

    await page.locator("#i-name").fill(`${RUN_TAG} Sorrel`);
    await page.locator("#i-species").selectOption("dog");
    await page.locator("#i-age").fill("3 years");
    await expect(page.getByText(/Draft saved/)).toBeVisible();
    await page.reload();
    await expect(page.locator("#i-name")).toHaveValue(`${RUN_TAG} Sorrel`);

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("radio", { name: "Found stray" }).check();
    await page.locator("#i-found").fill("Brandon Hill");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("radio", { name: /Urgent/ }).check();
    await page.getByRole("button", { name: "Vet check", exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("#i-location").fill("Kennel 1");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Brandon Hill")).toBeVisible();
    await page.getByRole("button", { name: "Confirm intake" }).click();

    await page.waitForURL(/\/cases\/[a-f0-9]{24}/);
    await expect(page.getByRole("heading", { name: `${RUN_TAG} Sorrel` })).toBeVisible();
    await expect(page.getByText(`Scan ${RUN_TAG} Sorrel for a microchip`)).toBeVisible();
  });

  test("board: move a card with the keyboard-accessible Move to… menu", async ({ page }) => {
    await uiLogin(page, "manager");
    await page.goto("/cases");
    const col = page.getByRole("region", { name: /^Intake,/ });
    const card = col.getByRole("article").filter({ hasText: "Bramble" });
    await card.getByRole("button", { name: "Move to…" }).click();
    const menu = page.getByRole("menu", { name: "Move to stage" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Enter"); // first option: Triage
    await expect(page.getByText("Bramble moved to Triage")).toBeVisible();
    await expect(page.getByRole("region", { name: /^Triage,/ }).getByText("Bramble")).toBeVisible();
  });

  test("case detail: the readiness gate blocks Ready until the checklist is complete", async ({
    page,
  }) => {
    await uiLogin(page, "manager");
    await page.goto("/cases");
    await page.getByRole("button", { name: "List" }).click();
    await page.getByRole("link", { name: /Pepper/ }).click();
    await page.getByRole("button", { name: "Move to Ready" }).click();
    await expect(page.getByText(/Complete the readiness checklist first/)).toBeVisible();
    for (const label of [
      "Vaccinations up to date",
      "Behaviour assessment",
      "Rehoming profile and photos",
    ]) {
      await page.getByLabel(label, { exact: true }).check();
    }
    await expect(page.getByText("6/6")).toBeVisible();
    await page.getByRole("button", { name: "Move to Ready" }).click();
    await expect(page.getByText("Moved to Ready")).toBeVisible();
  });

  test("foster: quick log with a welfare concern", async ({ page }) => {
    await uiLogin(page, "foster");
    await expect(page.getByText(/daily log/i).first()).toBeVisible();
    await page.goto("/foster");
    await page.getByRole("button", { name: "Add today's log" }).first().click();
    await page.getByRole("radio", { name: "Reduced" }).click();
    await page.getByLabel(/worried about Biscuit/).check();
    await page.locator("#ql-concern").fill(`${RUN_TAG} limping after walk`);
    await page.getByRole("button", { name: "Send concern" }).click();
    await expect(page.getByText("Concern sent to the rescue team")).toBeVisible();
    await expect(page.getByText(`Welfare concern: ${RUN_TAG} limping after walk`)).toBeVisible();
  });

  test("fosters roster shows capacity and current animals", async ({ page }) => {
    await uiLogin(page, "manager");
    await page.goto("/fosters");
    const grace = page.locator("section").filter({ hasText: "Grace Okafor" });
    await expect(grace.getByText("Biscuit")).toBeVisible();
    await expect(grace.getByText(/free|Full/)).toBeVisible();
  });
});

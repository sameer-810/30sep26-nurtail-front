import { test, expect } from "@playwright/test";
import { API, RUN_TAG, anonApi, apiAs, expectData, uiLogin } from "./helpers";

/** Landing-page sign-ups: public intake, admin follow-up, erasure. */
test.describe("Interest · API + UI", () => {
  const email = `pilot.${RUN_TAG.toLowerCase()}@example.com`;

  test("only admins can read sign-ups", async () => {
    const { ctx } = await apiAs("manager");
    expect((await ctx.get(`${API}/interest`)).status()).toBe(403);
    await ctx.dispose();
  });

  test("admin follows up a rescue sign-up and erases it on request", async ({ page }) => {
    const anon = await anonApi();
    await expectData(
      await anon.post(`${API}/public/interest`, {
        data: {
          name: `Morgan ${RUN_TAG}`,
          email,
          audience: "rescue",
          organisation: "Willow Lane Rescue",
          animalsPerYear: "50-200",
          message: "We'd love to try it.",
          consent: true,
          source: "landing",
        },
      }),
      201,
    );
    await anon.dispose();

    await uiLogin(page, "admin");
    await page.goto("/admin/interest");
    await expect(page.getByRole("heading", { name: "Interest" })).toBeVisible();
    await page.locator("#i-audience").selectOption("rescue");
    const row = page.getByRole("listitem").filter({ hasText: `Morgan ${RUN_TAG}` });
    await expect(row).toContainText("Willow Lane Rescue");
    await expect(row).toContainText("50-200 animals a year");
    await expect(row).toContainText("We'd love to try it.");
    await expect(row).toContainText("Consent given");
    await expect(row.locator("select")).toHaveValue("new");
    await expect(row.getByText("New", { exact: true }).first()).toBeVisible();

    await row.locator("select").selectOption("contacted");
    await expect(row.getByText("Contacted", { exact: true }).first()).toBeVisible();
    await row.getByLabel("Team notes").fill("Call booked for Tuesday");
    await row.getByLabel("Team notes").blur();
    await expect(page.getByText("Notes saved")).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await row.getByRole("button", { name: /Erase Morgan/ }).click();
    await expect(page.getByText("Details erased")).toBeVisible();
    await expect(row).toHaveCount(0);

    const { ctx } = await apiAs("admin");
    const all = await expectData(await ctx.get(`${API}/interest`));
    expect(all.filter((i: { email: string }) => i.email === email)).toHaveLength(0);
    await ctx.dispose();
  });
});

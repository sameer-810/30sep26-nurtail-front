import { test, expect } from "@playwright/test";
import { RUN_TAG, uiLogin } from "./helpers";

test.describe("Phase 4 · UI", () => {
  test("public report: the safety gate must be acknowledged; guest gets a tracking link", async ({
    page,
  }) => {
    await page.goto("/report");
    await page.getByRole("radio", { name: /An animal is injured/ }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: /Your safety comes first/ })).toBeVisible();
    await expect(page.getByText("RSPCA 0300 1234 999")).toBeVisible();
    await page.getByRole("button", { name: "Continue safely" }).click();
    await expect(
      page.getByRole("alert").getByText(/confirm you've read the safety guidance/),
    ).toBeVisible();
    await page.getByLabel("I've read this and I'm somewhere safe").check();
    await page.getByRole("button", { name: "Continue safely" }).click();

    await page.locator("#r-species").selectOption("cat");
    await page.locator("#r-desc").fill(`${RUN_TAG} Cat with a hurt paw sheltering under a bench.`);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("#r-area").fill("Victoria Park bandstand");
    await page.locator("#r-postcode").fill("BS3 4NN");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("#r-name").fill(`${RUN_TAG} Passer-by`);
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByRole("button", { name: "Send report" })).toBeVisible(); // missing contact
    await page.locator("#r-phone").fill("07700 900444");
    await page.getByRole("button", { name: "Send report" }).click();

    await expect(page.getByRole("heading", { name: /Thank you — report NT-R-/ })).toBeVisible();
    await page.getByRole("link", { name: "Follow this report" }).click();
    await expect(page.getByText("Handled by Hope Hollow Animal Rescue")).toBeVisible();
  });

  test("rescue triage queue: list, map and an internal note on a welfare report", async ({
    page,
  }) => {
    await uiLogin(page, "manager");
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: "Welfare reports" })).toBeVisible();
    await expect(page.getByRole("region", { name: /Map of reports/ })).toBeVisible();
    await page.getByLabel("Type").selectOption("welfare_concern");
    await page.getByRole("link", { name: /Stapleton Road/ }).click();
    await expect(page.getByText("Precise location — visible to your team only.")).toBeVisible();
    await page.locator("#msg-body").fill(`${RUN_TAG} council visit booked for Thursday`);
    await page.getByLabel("Internal note (team only)").check();
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(`${RUN_TAG} council visit booked for Thursday`)).toBeVisible();
    await expect(
      page.getByText(/Internal note — not visible to the reporter/).first(),
    ).toBeVisible();
  });

  test("admin redacts a report held for moderation", async ({ page }) => {
    await uiLogin(page, "admin");
    await page.goto("/reports");
    await page.getByRole("button", { name: "Held for moderation" }).click();
    await page.getByRole("link", { name: /Stokes Croft/ }).click();
    await expect(page.getByRole("button", { name: "Redact and release" })).toBeVisible();
    await page
      .locator("#mod-text")
      .fill(
        "A dog at a house on this street may be being mistreated. Please check on its welfare.",
      );
    await page.getByRole("button", { name: "Redact and release" }).click();
    await expect(page.getByText("Redacted and released")).toBeVisible();
    await expect(page.getByText("may be being mistreated")).toBeVisible();
  });

  test("community: lost & found view and sending a sighting", async ({ page }) => {
    await uiLogin(page, "owner");
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: "Lost & found near you" })).toBeVisible();
    const smudge = page.getByRole("listitem").filter({ hasText: "Smudge" });
    await smudge.getByRole("button", { name: /I've seen this animal/ }).click();
    await page.locator("#s-area").fill("Redland Green");
    await page.locator("#s-body").fill(`${RUN_TAG} Grey tabby in the hedge at 8pm`);
    await page.getByRole("button", { name: "Send sighting" }).click();
    await expect(page.getByText(/the owner and rescue have been told/)).toBeVisible();
  });

  test("signed-in report goes straight to its page", async ({ page }) => {
    await uiLogin(page, "owner2");
    await page.goto("/reports/new");
    await page.getByRole("radio", { name: /I've found an animal/ }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("I've read this and I'm somewhere safe").check();
    await page.getByRole("button", { name: "Continue safely" }).click();
    await page
      .locator("#r-desc")
      .fill(`${RUN_TAG} Small grey rabbit in my front garden, very tame.`);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("#r-area").fill("Whiteladies Road");
    await page.locator("#r-postcode").fill("BS6 6AA");
    await page.getByRole("button", { name: "Send report" }).click();
    await page.waitForURL(/\/reports\/[a-f0-9]{24}/);
    await expect(page.getByText("Handled by Hope Hollow Animal Rescue")).toBeVisible();
  });
});

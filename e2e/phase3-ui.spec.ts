import { test, expect } from "@playwright/test";
import { RUN_TAG, uiLogin } from "./helpers";

test.describe("Phase 3 · UI", () => {
  test("adopter browses verified rescues and filters", async ({ page }) => {
    await uiLogin(page, "owner2");
    await page.goto("/adopt");
    await expect(page.getByRole("heading", { name: "Find your companion" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Bertie/ })).toBeVisible();
    await expect(page.getByText("Verified rescue").first()).toBeVisible();
    await page.getByRole("button", { name: "Good with cats" }).click();
    await expect(page.getByRole("link", { name: /Bertie/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Luna/ })).toHaveCount(0);
  });

  test("apply wizard validates each step and lands on the tracker", async ({ page }) => {
    await uiLogin(page, "owner2");
    await page.goto("/adopt");
    await page.getByRole("link", { name: /Pip/ }).click();
    await page.getByRole("link", { name: /Apply to adopt Pip/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("alert").getByText("Tell us what kind of home you live in"),
    ).toBeVisible();
    await page.getByRole("radio", { name: "Flat or maisonette" }).check();
    await page.getByRole("radio", { name: "I rent" }).check();
    await page.getByLabel("My landlord has agreed to a pet").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("#ap-cats").fill("1");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("radio", { name: "Some experience" }).check();
    await page.getByRole("radio", { name: /Relaxed/ }).check();
    await page.locator("#ap-alone").fill("4");
    await page
      .locator("#ap-why")
      .fill(`${RUN_TAG} Pip would have a quiet flat where he can chat to me all day.`);
    await page.getByRole("button", { name: "Send application" }).click();
    await page.waitForURL(/\/applications\/[a-f0-9]{24}/);
    await expect(page.getByRole("heading", { name: "Pip" })).toBeVisible();
    await expect(page.getByLabel("Application progress")).toBeVisible();
    await expect(page.getByText("The rescue usually replies within 3 working days.")).toBeVisible();
  });

  test("rescue: review queue → decisions → handover", async ({ page }) => {
    await uiLogin(page, "manager");
    await page.goto("/applications");
    await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();
    await page.getByRole("button", { name: "New", exact: true }).click();
    await page.getByRole("link", { name: /Pip/ }).first().click();
    await expect(page.getByRole("heading", { name: "Match support" })).toBeVisible();
    await page.getByRole("button", { name: "Start review" }).click();
    await expect(page.getByText("Marked as being reviewed")).toBeVisible();
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText(/Approved — the animal is now reserved/)).toBeVisible();
    await page.getByRole("button", { name: "Complete handover" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Adoption contract signed").check();
    await dialog.getByLabel(/Health records explained/).check();
    await dialog.getByLabel(/Microchip keeper details/).check();
    await dialog.getByRole("button", { name: "Complete handover" }).click();
    await expect(page.getByText("Pip has gone home")).toBeVisible();
    await expect(page.getByRole("button", { name: /Record follow-up/ })).toBeVisible();
  });

  test("rescue: rehoming profile shows visibility and validates before listing", async ({
    page,
  }) => {
    await uiLogin(page, "manager");
    await page.goto("/animals");
    await page.getByRole("button", { name: "All", exact: true }).click();
    await page.getByRole("link", { name: /Mabel/ }).first().click();
    await page.getByRole("tab", { name: "Rehoming" }).click();
    await expect(page.getByText("Not visible")).toBeVisible();
    await expect(page.getByRole("button", { name: "List for adoption" })).toBeDisabled();
    await page.locator("#l-headline").fill(`${RUN_TAG} Fluffy and friendly`);
    await page.locator("#l-desc").fill("Mabel loves dandelions and a good zoom around the run.");
    await page.getByRole("button", { name: "List for adoption" }).click();
    await expect(page.getByText("Rehoming profile saved")).toBeVisible();
    await expect(page.getByText(/adopters only see animals at Ready/)).toBeVisible();
  });
});

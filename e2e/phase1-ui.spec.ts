import { test, expect } from "@playwright/test";
import { RUN_TAG, uiLogin } from "./helpers";

test.describe("Phase 1 · UI", () => {
  test("owner: My animals shows passport state and overdue care", async ({ page }) => {
    await uiLogin(page, "owner");
    await page
      .getByRole("complementary", { name: "Main navigation" })
      .getByRole("link", { name: "My animals" })
      .click();
    const milo = page.getByRole("link", { name: /Milo/ });
    await expect(milo).toBeVisible();
    await expect(milo.getByText("Safety Passport active")).toBeVisible();
    await expect(milo.getByText(/Overdue/)).toBeVisible();
  });

  test("owner adds an animal and lands on its record", async ({ page }) => {
    await uiLogin(page, "owner");
    await page.goto("/animals");
    await page.getByRole("button", { name: "Add an animal" }).first().click();
    await page.locator("#a-name").fill(`${RUN_TAG} Hazelnut`);
    await page.locator("#a-species").selectOption("rabbit");
    await page.locator("#a-microchip").fill("123");
    await page.getByRole("button", { name: "Add animal" }).click();
    await expect(
      page.getByRole("alert").getByText("A microchip number is 15 digits"),
    ).toBeVisible();
    await page.locator("#a-microchip").fill("");
    await page.getByRole("button", { name: "Add animal" }).click();
    await page.waitForURL(/\/animals\/[a-f0-9]{24}/);
    await expect(page.getByRole("heading", { name: `${RUN_TAG} Hazelnut` })).toBeVisible();
  });

  test("health tab: add a weight and see it on the timeline", async ({ page }) => {
    await uiLogin(page, "owner");
    await page.goto("/animals");
    await page.getByRole("link", { name: /Milo/ }).click();
    await page.getByRole("tab", { name: "Health" }).click();
    await expect(page.getByText("Flea & worm treatment").first()).toBeVisible();
    await page.getByRole("button", { name: "Add record" }).click();
    await page.locator("#h-type").selectOption("weight");
    await page.locator("#h-title").fill(`${RUN_TAG} weigh-in`);
    await page.locator("#h-weight").fill("32.9");
    await page.getByRole("dialog").getByRole("button", { name: "Add record" }).click();
    await expect(page.getByText(`${RUN_TAG} weigh-in`)).toBeVisible();
  });

  test("passport: switch on, QR code and public preview, finder can message", async ({
    page,
    context,
  }) => {
    await uiLogin(page, "owner");
    await page.goto("/animals");
    await page.getByRole("link", { name: /Willow/ }).click();
    await page.getByRole("tab", { name: "Safety Passport" }).click();
    await page.getByRole("button", { name: /Switch on Safety Passport|Switch off/ }).waitFor();
    const switchOn = page.getByRole("button", { name: "Switch on Safety Passport" });
    if (await switchOn.isVisible()) await switchOn.click();
    await expect(page.getByLabel(/QR code for Willow/)).toBeVisible();
    const url = await page.locator("p.break-all").innerText();

    const pub = await context.newPage();
    await pub.goto(url.replace(/^https?:\/\/[^/]+/, ""));
    await expect(pub.getByRole("heading", { name: "Willow" })).toBeVisible();
    await pub.locator("#f-name").fill(`${RUN_TAG} Finder`);
    await pub.locator("#f-contact").fill("07700 900123");
    await pub.locator("#f-message").fill("Sitting on my wall on Gloucester Road");
    await pub.getByRole("button", { name: "Send message" }).click();
    await expect(pub.getByText(/Message sent/)).toBeVisible();
  });

  test("rescue: animals register filters and microchip search", async ({ page }) => {
    await uiLogin(page, "manager");
    await page.goto("/animals");
    await expect(page.getByRole("heading", { name: "Animals", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ready", exact: true }).click();
    await expect(page.getByRole("link", { name: /Luna/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Bramble/ })).toHaveCount(0);
    await page.getByRole("button", { name: "All", exact: true }).click();
    await page.getByLabel("Search animals").fill("826098000123451");
    await expect(page.getByRole("link", { name: /Bramble/ }).first()).toBeVisible();
  });

  test("vet sees shared records read-only", async ({ page }) => {
    await uiLogin(page, "vet");
    await page.goto("/shared");
    await page.getByRole("link", { name: /Milo/ }).click();
    await expect(page.getByText(/Shared with you by the owner — read-only/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit details" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Safety Passport" })).toHaveCount(0);
  });

  test("foster flags an observation for professional review", async ({ page }) => {
    await uiLogin(page, "foster");
    await page.goto(`/dashboard`);
    // Fosters reach their animals from the foster screen (phase 2); here, via the record directly.
    const res = await page.request.get("http://localhost:5010/api/animals", {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => JSON.parse(localStorage.getItem("nurtail.auth")!).accessToken)}`,
      },
    });
    const biscuit = (await res.json()).data[0];
    await page.goto(`/animals/${biscuit.id}?tab=health`);
    await page.getByRole("button", { name: "Add record" }).click();
    await expect(page.locator("#h-type option")).toHaveCount(3);
    await page.locator("#h-title").fill(`${RUN_TAG} red eye`);
    await page.getByLabel("Needs professional review").check();
    await page.getByRole("dialog").getByRole("button", { name: "Add record" }).click();
    await expect(page.getByRole("status").filter({ hasText: `${RUN_TAG} red eye` })).toBeVisible();
  });
});

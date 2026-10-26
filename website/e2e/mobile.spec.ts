import { expect, test } from "@playwright/test";

/** Phone layout (Pixel 7): menu, sticky action, no sideways scroll. */
test.describe("mobile", () => {
  test("nothing overflows sideways", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("menu opens, lists every section and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    await expect(menu.getByRole("link")).toHaveText([
      "Platform",
      "Who it's for",
      "Trust & safety",
      "Pricing",
      "FAQ",
      /Report a concern/,
      "Sign in",
    ]);
    await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await toggle.click();
    await page
      .getByRole("navigation", { name: "Mobile" })
      .getByRole("link", { name: "Pricing" })
      .click();
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();
    await expect(page.locator("#pricing")).toBeInViewport();
  });

  test("sticky call to action appears after the hero and gets out of the form's way", async ({
    page,
  }) => {
    await page.goto("/");
    const bar = page.locator("div.fixed.bottom-0");
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    await page.locator("#platform").scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute("aria-hidden", "false");
    await expect(bar.getByRole("link", { name: "Become a founding partner" })).toBeInViewport();
    await page.locator("#pilot").scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute("aria-hidden", "true");
  });

  test("form inputs are large enough to tap and don't trigger zoom", async ({ page }) => {
    await page.goto("/#pilot");
    for (const id of ["name", "email", "audience"]) {
      const box = await page.locator(`#${id}`).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      const size = await page
        .locator(`#${id}`)
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(size).toBeGreaterThanOrEqual(16);
    }
    const submit = await page
      .getByRole("button", { name: "Apply to be a founding partner" })
      .boundingBox();
    expect(submit!.height).toBeGreaterThanOrEqual(44);
  });
});

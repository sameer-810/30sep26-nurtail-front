import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { API, adminApi, cleanUp, findInterest, testEmail } from "./helpers";

let admin: APIRequestContext;
test.beforeAll(async () => {
  admin = await adminApi();
});
test.afterAll(async () => {
  await cleanUp(admin);
  await admin.dispose();
});

test.describe("navigation & content", () => {
  test("one primary action, reachable from hero, header and final band", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Nurtail/);
    const ctas = page.getByRole("link", { name: /Become a founding partner/ });
    expect(await ctas.count()).toBeGreaterThanOrEqual(3);
    await page
      .locator("main")
      .getByRole("link", { name: "Become a founding partner" })
      .first()
      .click();
    await expect(page).toHaveURL(/#pilot$/);
    await expect(page.getByRole("heading", { name: "Register your interest" })).toBeInViewport();
  });

  test("header links jump to their sections", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [label, id] of [
      ["Platform", "platform"],
      ["Trust & safety", "trust"],
      ["Pricing", "pricing"],
      ["FAQ", "faq"],
    ]) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
  });

  test("skip link moves focus past the header", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("app links point at the Nurtail app", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "http://localhost:5180/login",
    );
    // Reporting has its own strip above the header, first thing after the skip link.
    const report = page.getByRole("link", { name: "Report a concern" }).first();
    await expect(report).toHaveAttribute("href", "http://localhost:5180/report");
    await expect(report).toBeInViewport();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "0300 1234 999" }),
    ).toHaveAttribute("href", "tel:03001234999");
  });

  test("pricing shows the model, never invented numbers", async ({ page }) => {
    await page.goto("/");
    const pricing = page.locator("#pricing");
    await expect(pricing.getByRole("heading", { name: "Rescues & shelters" })).toBeVisible();
    await expect(pricing).not.toContainText("£");
    await expect(pricing).toContainText("Final prices will be published before general launch");
  });

  test("FAQ opens and closes", async ({ page }) => {
    await page.goto("/#faq");
    const item = page.locator("details").filter({ hasText: "Do you sell animals" });
    await item.locator("summary").click();
    await expect(
      item.getByText("Nurtail takes no payment or commission for any animal"),
    ).toBeVisible();
    await item.locator("summary").click();
    await expect(
      item.getByText("Nurtail takes no payment or commission for any animal"),
    ).toBeHidden();
  });
});

test.describe("who it's for — tabs", () => {
  test("follows the WAI-ARIA tabs pattern with the keyboard", async ({ page }) => {
    await page.goto("/#roles");
    const tabs = page.getByRole("tablist", { name: "Who Nurtail is for" }).getByRole("tab");
    await expect(tabs).toHaveCount(5);
    await tabs.first().focus();
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText("Their whole life, in one safe place.");

    await page.keyboard.press("End");
    await expect(tabs.nth(4)).toBeFocused();
    await expect(page.getByRole("tabpanel")).toContainText("Structured history, with consent.");

    await page.keyboard.press("ArrowRight"); // wraps
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press("ArrowLeft"); // wraps back
    await expect(tabs.nth(4)).toBeFocused();
    await page.keyboard.press("Home");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    // Only the selected tab is in the tab order.
    await expect(tabs.nth(2)).toHaveAttribute("tabindex", "-1");
  });

  test("a role's button pre-selects that audience in the form", async ({ page }) => {
    await page.goto("/#roles");
    await page.getByRole("tab", { name: "Care providers" }).click();
    await page.getByRole("link", { name: "Register as a provider" }).click();
    await expect(page.locator("#audience")).toHaveValue("provider");
    await expect(page.getByLabel("Organisation name")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Register your interest" })).toBeInViewport();
  });

  test("?for= in a shared link pre-selects the audience", async ({ page }) => {
    await page.goto("/?for=vet#pilot");
    await expect(page.locator("#audience")).toHaveValue("vet");
    await expect(page.getByLabel(/Practice name/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Keep me posted" })).toBeVisible();
  });
});

test.describe("register interest form", () => {
  test("empty submit shows a focused error summary linking to each field", async ({ page }) => {
    await page.goto("/#pilot");
    await page.getByRole("button", { name: "Apply to be a founding partner" }).click();
    const summary = page.getByRole("alert").filter({ hasText: "There is a problem" });
    await expect(summary).toBeFocused();
    await expect(summary.getByRole("link")).toHaveText([
      "Tell us who you are",
      "Enter your name",
      /Enter an email address/,
      /Tick the box/,
    ]);
    await expect(page.locator("#name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#name")).toHaveAttribute("aria-describedby", "name-error");

    await summary.getByRole("link", { name: /Enter an email address/ }).click();
    await expect(page.locator("#email")).toBeFocused();
  });

  test("organisation is required for rescues, and postcodes must be real", async ({ page }) => {
    await page.goto("/#pilot");
    await page.locator("#name").fill("Sam Patel");
    await page.locator("#email").fill("sam@example.com");
    await page.locator("#audience").selectOption("rescue");
    await page.locator("#postcode").fill("NOTAPOSTCODE");
    await page.locator("#consent").check();
    await page.getByRole("button", { name: "Apply to be a founding partner" }).click();
    const summary = page.getByRole("alert").filter({ hasText: "There is a problem" });
    await expect(summary.getByRole("link")).toHaveText([
      "Enter your organisation's name",
      "Enter a real UK postcode, or leave it blank",
    ]);
  });

  test("a rescue signs up; details and consent are stored for the team", async ({ page }) => {
    const email = testEmail("rescue");
    await page.goto("/#pilot");
    await page.locator("#name").fill("Priya Shah");
    await page.locator("#email").fill(email);
    await page.locator("#audience").selectOption("rescue");
    await page.locator("#organisation").fill("Hope Hollow Test Rescue");
    await page.locator("#animalsPerYear").selectOption("50-200");
    await page.locator("#postcode").fill("SW1A 1AA");
    await page.locator("#message").fill("Spreadsheets everywhere.");
    await page.getByLabel(/I agree that Nurtail can store these details/).check();
    await page.getByRole("button", { name: "Apply to be a founding partner" }).click();

    const done = page.getByRole("status");
    await expect(done).toBeFocused();
    await expect(done).toContainText("Thank you, Priya.");
    await expect(done).toContainText(email);

    const [row] = await findInterest(admin, email);
    expect(row).toMatchObject({
      audience: "rescue",
      organisation: "Hope Hollow Test Rescue",
      animalsPerYear: "50-200",
      message: "Spreadsheets everywhere.",
      source: "landing",
      status: "new",
    });
    expect(row.postcode.replace(/\s/g, "")).toBe("SW1A1AA");
    expect(new Date(row.consentAt).getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  test("an owner joins the waitlist with only the essentials", async ({ page }) => {
    const email = testEmail("owner");
    await page.goto("/?for=owner#pilot");
    await expect(page.locator("#organisation")).toHaveCount(0);
    await page.locator("#name").fill("Tom");
    await page.locator("#email").fill(email);
    await page.locator("#consent").check();
    await page.getByRole("button", { name: "Keep me posted" }).click();
    await expect(page.getByRole("status")).toContainText(
      "when Nurtail opens for owners and adopters",
    );
    expect(await findInterest(admin, email)).toHaveLength(1);
  });

  test("signing up twice updates rather than duplicates", async ({ request }) => {
    const email = testEmail("repeat");
    const body = { name: "Ana", email, audience: "foster", consent: true };
    expect((await request.post(`${API}/public/interest`, { data: body })).status()).toBe(201);
    expect(
      (
        await request.post(`${API}/public/interest`, { data: { ...body, message: "Second" } })
      ).status(),
    ).toBe(201);
    const rows = await findInterest(admin, email);
    expect(rows).toHaveLength(1);
    expect(rows[0].message).toBe("Second");
  });

  test("the API rejects bots and missing consent", async ({ request }) => {
    const base = { name: "Bot", email: testEmail("bot"), audience: "owner", consent: true };
    const bot = await request.post(`${API}/public/interest`, {
      data: { ...base, website: "http://spam.example" },
    });
    expect(bot.status()).toBe(400);
    const noConsent = await request.post(`${API}/public/interest`, {
      data: { ...base, consent: false },
    });
    expect(noConsent.status()).toBe(400);
    expect(await findInterest(admin, base.email)).toHaveLength(0);
    // The admin list is not public.
    expect((await request.get(`${API}/interest`)).status()).toBe(401);
  });

  test("a network failure is explained and the answers are kept", async ({ page }) => {
    await page.route("**/public/interest", (r) => r.abort());
    await page.goto("/?for=owner#pilot");
    await page.locator("#name").fill("Offline Olly");
    await page.locator("#email").fill("olly@example.com");
    await page.locator("#consent").check();
    await page.getByRole("button", { name: "Keep me posted" }).click();
    await expect(page.getByRole("alert")).toHaveText(/couldn't send that just now/);
    await expect(page.locator("#name")).toHaveValue("Offline Olly");
  });
});

/**
 * axe scan of the settled page. Reduced motion is set first so scroll-reveal
 * content isn't caught mid-fade. The wordmark is excluded: logotypes are
 * exempt from WCAG 1.4.3, and its link carries an accessible name anyway.
 */
const axe = (page: Parameters<typeof AxeBuilder>[0]["page"]) =>
  new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .exclude('[aria-label="Nurtail home"]');

test.describe("accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const path of ["/", "/privacy"]) {
    test(`${path} has no WCAG 2.2 A/AA violations`, async ({ page }) => {
      await page.goto(path);
      const results = await axe(page).analyze();
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
        ),
      ).toEqual([]);
    });
  }

  test("form errors are also announced for axe after validation", async ({ page }) => {
    await page.goto("/#pilot");
    await page.getByRole("button", { name: "Apply to be a founding partner" }).click();
    const results = await axe(page).include("#pilot").analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

test.describe("layout", () => {
  for (const width of [1024, 1100, 1280, 1440, 1920]) {
    test(`hero fits at ${width}px wide`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const mockup = await page.getByTestId("hero-visual").boundingBox();
      expect(mockup!.x + mockup!.width).toBeLessThanOrEqual(width);
      // Header nav stays on one line.
      const nav = await page.getByRole("navigation", { name: "Main" }).boundingBox();
      expect(nav!.height).toBeLessThan(50);
    });
  }
});

/**
 * First paint on real laptops: the primary action and the animal's face must be
 * on screen without scrolling. 1536×660 is a 1920×1080 window at 125% zoom.
 */
test.describe("first viewport", () => {
  for (const [width, height] of [
    [1280, 720],
    [1366, 768],
    [1536, 660],
    [1536, 864],
    [1920, 1080],
  ]) {
    test(`CTA and photo are above the fold at ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      const cta = page
        .locator("main")
        .getByRole("link", { name: "Become a founding partner" })
        .first();
      await expect(cta).toBeInViewport({ ratio: 1 });
      const photo = await page.locator("[data-testid=hero-visual] img").boundingBox();
      expect(photo!.y).toBeGreaterThanOrEqual(0);
      expect(photo!.y + photo!.height).toBeLessThanOrEqual(height);
      await expect(
        page.locator("[data-testid=hero-visual]").getByText("Verified rescue"),
      ).toBeInViewport();
    });
  }
});

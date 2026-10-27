import { expect, test } from "@playwright/test";

/** What crawlers, link previews and no-JS visitors receive — before React runs. */
test.describe("prerendered HTML & SEO", () => {
  test("home page ships real content and complete meta in the HTML", async ({ request }) => {
    const res = await request.get("/");
    expect(res.ok()).toBeTruthy();
    const html = await res.text();

    expect(html).toContain('<html lang="en-GB"');
    expect(html).toMatch(
      /<title>Nurtail — Animal health, welfare &amp; verified care for the UK<\/title>/,
    );
    expect(html).toMatch(/<meta name="description" content="One trusted record for every animal\./);
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:5190\/"/);
    expect(html).toMatch(
      /<meta property="og:image" content="http:\/\/localhost:5190\/og-image\.png"/,
    );
    expect(html).toContain('"@type":"Organization"');
    // The hero, every section and the form are in the markup, not injected later.
    expect(html).toMatch(/<h1[^>]*id="hero-title"/);
    for (const id of ["platform", "roles", "trust", "mission", "pricing", "pilot", "faq"])
      expect(html).toContain(`id="${id}"`);
    expect(html).toContain('id="email"');
    // No placeholder left unfilled, and no third-party font requests.
    expect(html).not.toMatch(/<!--(page-|site-url|structured-data|app-html)/);
    expect(html).not.toContain("fonts.googleapis.com");
    // No invented social proof.
    expect(html).not.toMatch(/testimonial|trusted by \d|★/i);
  });

  test("privacy notice is its own prerendered page", async ({ request }) => {
    const html = await (await request.get("/privacy")).text();
    expect(html).toContain("<title>Privacy notice — Nurtail</title>");
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:5190\/privacy"/);
    expect(html).toContain("Our lawful basis");
    expect(html).toContain("ico.org.uk");
  });

  test("unknown pages are a real 404, not the home page", async ({ request }) => {
    expect((await request.get("/not-a-page")).status()).toBe(404);
  });

  test("robots.txt, sitemap and share image are published", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap: http://localhost:5190/sitemap.xml");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("<loc>http://localhost:5190/</loc>");
    expect(sitemap).toContain("<loc>http://localhost:5190/privacy</loc>");
    const og = await request.get("/og-image.png");
    expect(og.ok()).toBeTruthy();
    expect(og.headers()["content-type"]).toContain("image/png");
  });

  test("page is fully readable with JavaScript switched off", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Every animal, known and cared for.",
    );
    // Reveal-on-scroll never hides content without JS.
    await page.locator("#trust").scrollIntoViewIfNeeded();
    await expect(page.locator(".reveal.is-hidden")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Checked by a person" })).toBeVisible();
    // FAQ works natively.
    await page.getByText("Does Nurtail give veterinary advice?").click();
    await expect(page.getByText(/never diagnoses or recommends treatment/)).toBeVisible();
    await ctx.close();
  });

  test("hydrates without errors or hydration mismatches", async ({ page }) => {
    const problems: string[] = [];
    page.on(
      "console",
      (m) => (m.type() === "error" || m.type() === "warning") && problems.push(m.text()),
    );
    page.on("pageerror", (e) => problems.push(e.message));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.goto("/privacy");
    await page.waitForLoadState("networkidle");
    expect(problems).toEqual([]);
  });
});

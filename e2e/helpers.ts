import { expect, request, type APIRequestContext, type Page } from "@playwright/test";

export const API = process.env.E2E_API_URL || "http://localhost:5010/api";
export const PASSWORD = process.env.E2E_PASSWORD || "Nurtail@12345";

/** Seeded accounts (30sep26-nurtail-back/scripts/seed.js). */
export const ACCOUNTS = {
  admin: "admin@nurtail.test",
  manager: "manager@hopehollow.test",
  staff: "staff@hopehollow.test",
  foster: "foster@hopehollow.test",
  foster2: "foster2@hopehollow.test",
  owner: "owner@nurtail.test",
  owner2: "olivia@nurtail.test",
  vendor: "vendor@greenway.test",
  vendor2: "vendor@riverside.test",
  vet: "vet@nurtail.test",
  northern: "manager@northernpaws.test",
} as const;
export type Who = keyof typeof ACCOUNTS;

/**
 * A tag stamped into every record the tests create, so fixtures are easy to
 * find and impossible to confuse with seed data.
 */
export const RUN_TAG = `E2E${Date.now().toString(36).toUpperCase()}`;

export async function apiLogin(
  ctx: APIRequestContext,
  who: Who,
): Promise<{ token: string; user: any }> {
  const res = await ctx.post(`${API}/auth/login`, {
    data: { email: ACCOUNTS[who], password: PASSWORD },
  });
  expect(res.ok(), `login ${who} failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return { token: body.data.accessToken, user: body.data.user };
}

/** A standalone API context carrying `who`'s bearer token. */
export async function apiAs(
  who: Who,
): Promise<{ ctx: APIRequestContext; user: any; token: string }> {
  const bare = await request.newContext();
  const { token, user } = await apiLogin(bare, who);
  await bare.dispose();
  const ctx = await request.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${token}` } });
  return { ctx, user, token };
}

export async function anonApi(): Promise<APIRequestContext> {
  return request.newContext();
}

/** Sign in through the real form so the auth flow stays covered. */
export async function uiLogin(page: Page, who: Who) {
  await page.goto("/login");
  await page.locator("#email").fill(ACCOUNTS[who]);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

/** Unwrap `{ success, data }` and assert the status. */
export async function expectData(res: Awaited<ReturnType<APIRequestContext["get"]>>, status = 200) {
  const text = await res.text();
  expect(res.status(), text).toBe(status);
  return JSON.parse(text).data;
}

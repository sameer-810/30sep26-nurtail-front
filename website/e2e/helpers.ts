import { expect, request, type APIRequestContext } from "@playwright/test";

export const API = process.env.E2E_API_URL || "http://localhost:5010/api";
const ADMIN = {
  email: "admin@nurtail.test",
  password: process.env.E2E_PASSWORD || "Nurtail@12345",
};

/** Unique per run, so sign-ups made by tests can be found and removed. */
export const RUN_TAG = `e2e${Date.now().toString(36)}`;
export const testEmail = (label: string) => `${label}.${RUN_TAG}@example.com`;

/** An API context signed in as the seeded platform admin. */
export async function adminApi(): Promise<APIRequestContext> {
  const bare = await request.newContext();
  const res = await bare.post(`${API}/auth/login`, { data: ADMIN });
  expect(res.ok(), `admin login failed: ${res.status()}`).toBeTruthy();
  const token = (await res.json()).data.accessToken as string;
  await bare.dispose();
  return request.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${token}` } });
}

type Interest = {
  id: string;
  email: string;
  audience: string;
  organisation: string;
  postcode: string;
  animalsPerYear: string;
  message: string;
  source: string;
  consentAt: string;
  status: string;
};

export async function findInterest(api: APIRequestContext, email: string): Promise<Interest[]> {
  const res = await api.get(`${API}/interest`);
  expect(res.ok()).toBeTruthy();
  return ((await res.json()).data as Interest[]).filter((i) => i.email === email);
}

/** Remove every sign-up this run created (erasure endpoint). */
export async function cleanUp(api: APIRequestContext) {
  const res = await api.get(`${API}/interest`);
  const mine = ((await res.json()).data as Interest[]).filter((i) => i.email.includes(RUN_TAG));
  for (const i of mine) await api.delete(`${API}/interest/${i.id}`);
}

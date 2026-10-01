import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests, one API spec and one UI spec per delivery phase.
 *
 * They run against a REAL backend + database. Every record a test creates is
 * tagged with a run id so it can never be confused with seed data. For a clean
 * slate, re-run `npm run seed` in the backend first.
 *
 * Start both servers first:
 *   cd 30sep26-nurtail-back  && npm run seed && npm start
 *   cd 30sep26-nurtail-front && npm run dev
 */
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5180";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

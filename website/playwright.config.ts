import { defineConfig, devices } from "@playwright/test";

/**
 * Landing-page end-to-end tests. They run against the PRODUCTION build
 * (prerendered HTML served by `vite preview`), because that's what search
 * engines and visitors actually receive.
 *
 * The sign-up tests need the real API running:
 *   cd 30sep26-nurtail-back && npm start
 *   cd 30sep26-nurtail-web  && npm run build && npm run e2e
 */
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5190";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run preview",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec/ },
  ],
});

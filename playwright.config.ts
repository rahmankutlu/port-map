import { defineConfig, devices } from "@playwright/test";

const testPort = 3100;
const baseURL = `http://localhost:${testPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: { baseURL, trace: "on-first-retry" },
  webServer: {
    command: `pnpm dev --port ${testPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

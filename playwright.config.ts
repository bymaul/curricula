import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: isCI ? 'pnpm start' : 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});

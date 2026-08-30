/*
 * Author: Bob
 * Created (yyyy-mm-dd): 2025-07-10
 * Description: Playwright configuration for the DemoQA e2e test suite.
 *              Base URL loaded from the DEMOQA_URL environment variable (.env).
 */
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from workspace root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 3,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.DEMOQA_URL ?? 'https://demoqa.com',
    trace: 'on-first-retry',
    navigationTimeout: 30000,
    actionTimeout: 15000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

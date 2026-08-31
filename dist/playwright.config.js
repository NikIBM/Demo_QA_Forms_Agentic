"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Author: Bob
 * Created (yyyy-mm-dd): 2025-07-10
 * Description: Single consolidated Playwright configuration for the DemoQA e2e test suite.
 *              Base URL loaded from the DEMOQA_URL environment variable (.env).
 */
const test_1 = require("@playwright/test");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env from workspace root
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '.env') });
exports.default = (0, test_1.defineConfig)({
    testDir: './apps/demoqa-e2e/tests',
    timeout: 60000,
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry failed tests (3 on both CI and local for DemoQA flakiness) */
    retries: process.env.CI ? 3 : 3,
    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        baseURL: process.env.DEMOQA_URL ?? 'https://demoqa.com',
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        navigationTimeout: 30000,
        actionTimeout: 15000,
        ignoreHTTPSErrors: true,
    },
    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...test_1.devices['Desktop Chrome'] },
        },
    ],
});

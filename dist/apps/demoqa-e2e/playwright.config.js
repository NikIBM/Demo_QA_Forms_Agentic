"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Author: Bob
 * Created (yyyy-mm-dd): 2025-07-10
 * Description: Playwright configuration for the DemoQA e2e test suite.
 *              Base URL loaded from the DEMOQA_URL environment variable (.env).
 */
const test_1 = require("@playwright/test");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env from workspace root
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.default = (0, test_1.defineConfig)({
    testDir: path_1.default.join(__dirname, 'tests'),
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
            use: { ...test_1.devices['Desktop Chrome'] },
        },
    ],
});

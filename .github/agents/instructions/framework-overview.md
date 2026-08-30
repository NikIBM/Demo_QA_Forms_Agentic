# Playwright Regression Framework — Instruction Reference

> **Purpose:** This document is the single source of truth for any agent or assistant working in
> this repository. Read this file first before writing, modifying, or debugging any code.
> The patterns described here apply to **every application suite** added under `apps/`.

---

## 1. Repository Layout

```
playwright-regression/
├── apps/
│   └── <app-suite>/                  ← one folder per tested application
│       ├── pages/                    ← Page Object classes (.page.ts)
│       │   ├── Common/
│       │   │   └── base.page.ts      ← shared BasePage all pages extend
│       │   └── <Feature>/
│       │       └── <Feature>.page.ts
│       ├── test-data/                ← CSV test-data files
│       │   └── <Feature>/
│       │       └── <Feature>Test-data.csv
│       ├── tests/                    ← spec files
│       │   └── <Feature>/
│       │       └── <Feature>Test.spec.ts
│       ├── utils/
│       │   ├── TestController.ts     ← master test-run registry
│       │   ├── TestController.js     ← compiled copy (committed)
│       │   ├── CommonFunctions.ts    ← shared helpers (screenshots etc.)
│       │   └── index.ts              ← low-level utilities (fillInputField …)
│       ├── test-planner/             ← automation-ready test plans, per suite (gitignored)
│       │   ├── README.md             ← folder conventions and naming rules
│       │   └── <Feature>/
│       │       └── <NN>_<ScenarioName>.md
│       └── playwright.config.ts      ← suite-specific Playwright config
├── docs/                             ← local test-case reference docs (gitignored)
│   ├── README.md                     ← folder conventions and file template
│   └── <app-suite>/
│       └── <Feature>/
│           └── <Feature>-test-cases.md
├── ExecuteTest.ts                    ← entry point — orchestrates test runs
├── GenerateSummaryReport.ts          ← HTML summary generator
├── .env                              ← runtime secrets (never committed)
├── tsconfig.json
└── package.json
```

**Key rule:** Every application under `apps/` follows the **exact same sub-structure** above.
When adding a new application, mirror the `saucedemo-e2e` layout.

---

## 2. Core Architectural Patterns

### 2.1 Page Object Model (POM)

Every page is a TypeScript class that:

1. **Extends `BasePage`** from `apps/<suite>/pages/Common/base.page.ts`.
2. Declares all locators as `readonly` class properties in the constructor.
3. Groups locators by page section with `// Section N: <label>` comments.
4. Exposes **actions** (navigate, fill, click) and **validations** (`verify…`) as `async` methods.
5. Contains **no test logic and no hardcoded test data**.

```ts
// Pattern: apps/<suite>/pages/<Feature>/<Feature>.page.ts
import { Locator, Page, expect } from "@playwright/test";
import { BasePage } from "../Common/base.page";

export class MyFeaturePage extends BasePage {
  // ============================================================
  // Section 1: <Label> Locators
  // ============================================================
  readonly someInput: Locator;

  constructor(page: Page) {
    super(page);
    this.someInput = this.page.locator('#some-id');
  }

  // ============================================================
  // Section 2: Actions
  // ============================================================
  async goToPage(url: string): Promise<void> {
    await this.navigateTo(url);
  }

  // ============================================================
  // Section 3: Validations
  // ============================================================
  async verifyPageLoaded(): Promise<void> {
    await expect(this.someInput).toBeVisible();
  }
}
```

### 2.2 BasePage

```ts
// apps/<suite>/pages/Common/base.page.ts
import type { Page } from "@playwright/test";

export class BasePage {
  constructor(readonly page: Page) {}

  protected async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
```

All page classes call `super(page)` and reference `this.page` to access the Playwright `Page`.

### 2.3 Spec File Structure

Every `.spec.ts` file follows this pattern:

```ts
// apps/<suite>/tests/<Feature>/<Feature>Test.spec.ts
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { test, Page } from '@playwright/test';
import { MyFeaturePage } from '../../pages/<Feature>/<Feature>.page';
import { takeScreenShot } from '../../utils/CommonFunctions';

interface FeatureTestData { scenario_description: string; /* … other CSV columns */ }

let testData: FeatureTestData[] = [];
try {
  const filePath = path.resolve(__dirname, '../../test-data/<Feature>/<Feature>Test-data.csv');
  testData = parse(fs.readFileSync(filePath), { columns: true, skip_empty_lines: true });
} catch (error) { console.error('Error reading test data file:', error); }

test.describe('@<FeatureTag>', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await browser.newPage(); });
  test.afterAll(async () => { await page.close(); });

  for (const data of testData) {
    test(`<Feature> - ${data.scenario_description}`, async ({}, testInfo) => {
      const featurePage = new MyFeaturePage(page);
      // All credentials / URLs from process.env (loaded from .env)
      await featurePage.goToPage(process.env.MY_URL!);
      await takeScreenShot(page, testInfo, '1-PageLoad');
      // … actions …
      await featurePage.verifySomething();
      await takeScreenShot(page, testInfo, '2-Result');
    });
  }
});
```

**Rules for spec files:**
- One `test.describe` block per spec file, tagged with `@FeatureName`.
- Shared `page` created once in `beforeAll` and closed in `afterAll`.
- All test data from CSV — **no hardcoded values** in the spec body.
- All secrets (URLs, usernames, passwords) via `process.env.VAR!`.
- Screenshots after every major action using `takeScreenShot`.

### 2.4 CSV Test-Data Files

```
user_id,password,expected_result,scenario_description
standard_user,secret_sauce,success,Valid login with standard_user credentials
```

- First row is always the header.
- `scenario_description` is **mandatory** — it becomes the test title.
- Credentials columns (`user_id`, `password`) are present in the CSV for documentation but
  **must be sourced from `.env` at runtime** (the spec reads `process.env.*`).

### 2.5 Environment Variables (.env)

All runtime secrets live in a `.env` file at the workspace root. The file is loaded by
`ExecuteTest.ts` via `dotenv.config()`. **Never hardcode any URL, username, or password.**

Example variables (adapt per suite):
```
SAUCEDEMO_URL=https://www.saucedemo.com/
SAUCEDEMO_USERNAME=standard_user
SAUCEDEMO_PASSWORD=secret_sauce
TAKE_SCREENSHOTS=true
TEST_EXECUTION_LOCATION=LOCAL
```

`TAKE_SCREENSHOTS=false` disables screenshot capture (useful in fast local runs).
`TEST_EXECUTION_LOCATION` controls report folder strategy (`LOCAL` vs `GITHUB`).

### 2.6 TestController

`apps/<suite>/utils/TestController.ts` is the **test registry** — it declares which spec files
exist, whether each runs, where it runs, and its execution order.

```ts
export const testControlData = [
  {
    file: 'apps/<suite>/tests/<Feature>/<Feature>Test.spec.ts',
    run: true,                          // false = skip without deleting
    location: ['LOCAL', 'GITHUB'],      // or ['LOCAL'] / ['GITHUB']
    sequenceOrder: 1,                   // lower = runs first
    description: 'Human-readable description',
  },
];
```

**Every new spec file must have a corresponding entry here** before it will be picked up by
`ExecuteTest.ts`. After editing the `.ts` file, **also update the compiled `.js` file** (or run
`npx tsc` to regenerate it).

### 2.7 Utility Helpers

| Helper | File | Description |
|---|---|---|
| `takeScreenShot(page, testInfo, label)` | `utils/CommonFunctions.ts` | Attaches JPEG screenshot to report. Respects `TAKE_SCREENSHOTS` env var. |
| `fillInputField(locator, value)` | `utils/index.ts` | Fills input with retry loop (up to 5 attempts). |
| `addTimeout(ms)` | `utils/index.ts` | Promise-based delay — use sparingly. |

---

## 3. Test Execution Flow

```
.env loaded → ExecuteTest.ts reads TestController
           → filters by run=true & location match
           → sorts by sequenceOrder
           → for each spec file:
               npx playwright test <file> --config=apps/<suite>/playwright.config.ts
               copy HTML report → AllTestResults/HTMLReports/Results_<timestamp>/<N>-<Name>/
               copy data/ folder and test-results.json
           → generateSummaryReport() → TestExecutionSummary.html
```

Run locally:
```bash
npx tsc ExecuteTest.ts
node ExecuteTest.js
```

Or with ts-node (if installed):
```bash
npx ts-node ExecuteTest.ts
```

---

## 4. Playwright Configuration

Each app suite has its own `playwright.config.ts`:

```ts
// apps/<suite>/playwright.config.ts
export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://<app-url>/',
    trace: 'on-first-retry',
    navigationTimeout: 30000,
    actionTimeout: 15000,
    ignoreHTTPSErrors: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

The root `playwright.config.ts` is a legacy stub — always point `--config` to the suite-level config.

---

## 5. Reporting

- Individual test run: Playwright HTML report → `playwright-report/index.html`
- Aggregated results: `AllTestResults/HTMLReports/Results_<timestamp>/`
  - Each spec gets its own numbered sub-folder: `1-SpecName/`, `2-SpecName/`, …
  - Master summary: `TestExecutionSummary.html` — lists all tests with pass/fail/skip counts

`GenerateSummaryReport.ts` parses each `test-results.json`, extracts individual test results, and
generates a single self-contained HTML dashboard.

---

## 6. GitHub Actions CI

Two workflows:

| File | Purpose |
|---|---|
| `.github/workflows/playwright.yml` | Reusable workflow — receives URL/creds as inputs, runs tests, uploads `AllTestResults/` artifact |
| `.github/workflows/main.yml` | Dispatcher — reads `EnvInfo.txt` by `envIdentifier` and calls `playwright.yml` |

CI runs on `self-hosted` runners. Node.js and Chrome are pre-installed on the runner.

Execution steps in CI:
```bash
npm install
npm install typescript --save-dev
npx tsc ExecuteTest.ts
node ExecuteTest.js
```

---

## 7. File Naming & Folder Conventions

| Artifact | Convention | Example |
|---|---|---|
| Page class file | `<Feature>.page.ts` | `SaucedemoLogin.page.ts` |
| Page class name | `<AppPrefix><Feature>Page` | `SaucedemoLoginPage` |
| Spec file | `<AppPrefix><Feature>Test.spec.ts` | `SaucedemoLoginTest.spec.ts` |
| Test-data CSV | `<AppPrefix><Feature>Test-data.csv` | `SaucedemoLoginTest-data.csv` |
| Describe tag | `@<AppPrefix><Feature>` | `@SaucedemoLogin` |
| Folder (pages) | `pages/<Feature>/` | `pages/Login/` |
| Folder (tests) | `tests/<Feature>/` | `tests/Login/` |
| Folder (data) | `test-data/<Feature>/` | `test-data/Login/` |

---

## 8. File Header Comment Template

Every `.ts` file must start with this header:

```ts
/*
 * Author: <Name>
 * Created (yyyy-mm-dd): <date>
 * Description: <single-line summary of the file's purpose>
 */
```

---

## 9. Checklist — Adding a New Test Suite for a New App

1. Create `apps/<new-app-e2e>/` mirroring the `saucedemo-e2e` layout.
2. Add `playwright.config.ts` with the correct `baseURL` and `testDir`.
3. Create `pages/Common/base.page.ts` (copy from saucedemo-e2e — it is identical for all suites).
4. For each feature:
   - `pages/<Feature>/<Feature>.page.ts` — locators + actions + validations.
   - `test-data/<Feature>/<Feature>Test-data.csv` — CSV with headers including `scenario_description`.
   - `tests/<Feature>/<Feature>Test.spec.ts` — spec using POM + CSV + env vars.
5. Add entry to `utils/TestController.ts` (and recompile to `.js`).
6. Add required env vars to `.env`.
7. Verify locally: `npx tsc ExecuteTest.ts && node ExecuteTest.js`.

---

## 10. Checklist — Adding a New Test to an Existing Suite

1. Create page file if the page doesn't exist yet.
2. Create CSV data file under the correct feature folder.
3. Write the spec file following §2.3.
4. Add entry to `TestController.ts` / `TestController.js`.
5. Add any new env vars to `.env`.
6. Run locally to validate.

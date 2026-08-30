# Playwright Regression Framework

A structured, scalable end-to-end test automation framework built on [Playwright](https://playwright.dev/) and TypeScript, using the Page Object Model (POM), CSV-driven test data, and an AI-assisted development workflow via IBM Bob agents.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Repository Layout](#3-repository-layout)
4. [Core Concepts](#4-core-concepts)
   - [Page Object Model](#41-page-object-model)
   - [CSV Test Data](#42-csv-test-data)
   - [TestController Registry](#43-testcontroller-registry)
   - [Environment Variables](#44-environment-variables)
   - [Test Execution Flow](#45-test-execution-flow)
   - [Reporting](#46-reporting)
5. [Running Tests Locally](#5-running-tests-locally)
6. [GitHub Actions CI](#6-github-actions-ci)
7. [Adding Tests — Checklist](#7-adding-tests--checklist)
8. [File & Naming Conventions](#8-file--naming-conventions)
9. [Bob AI Agents](#9-bob-ai-agents)
   - [Available Skills](#91-available-skills)
   - [How to Use an Agent](#92-how-to-use-an-agent)
   - [Agent Workflow Examples](#93-agent-workflow-examples)
10. [Project Dependencies](#10-project-dependencies)

---

## 1. Prerequisites

| Tool | Minimum version | Notes |
|---|---|---|
| Node.js | 18 LTS | Pre-installed on CI runners |
| npm | 9+ | Comes with Node.js |
| TypeScript | 5+ | Installed as a dev dependency |
| Chrome | Latest stable | Pre-installed on CI runners; Playwright also manages its own |

---

## 2. Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd playwright-regression-develop

# 2. Install dependencies
npm install

# 3. Create a .env file at the repo root (never commit this file)
cp .env.example .env          # or create it manually — see §4.4

# 4. Compile and run all tests
npx tsc ExecuteTest.ts
node ExecuteTest.js
```

Test results are written to `AllTestResults/HTMLReports/Results_<timestamp>/`.

---

## 3. Repository Layout

```
playwright-regression/
├── apps/
│   └── <app-suite>/                   ← one folder per tested application
│       ├── pages/
│       │   ├── Common/
│       │   │   └── base.page.ts       ← BasePage — all pages extend this
│       │   └── <Feature>/
│       │       └── <Feature>.page.ts  ← locators + actions + validations
│       ├── test-data/
│       │   └── <Feature>/
│       │       └── <Feature>Test-data.csv
│       ├── tests/
│       │   └── <Feature>/
│       │       └── <Feature>Test.spec.ts
│       ├── test-planner/              ← automation-ready plans (gitignored)
│       ├── utils/
│       │   ├── TestController.ts      ← master test registry
│       │   ├── TestController.js      ← compiled copy (committed)
│       │   ├── CommonFunctions.ts     ← takeScreenShot helper
│       │   └── index.ts               ← fillInputField, addTimeout
│       └── playwright.config.ts       ← suite-level Playwright config
├── docs/                              ← local test-case reference docs (gitignored)
├── .github/
│   └── workflows/
│       ├── main.yml                   ← dispatcher — reads EnvInfo.txt
│       └── playwright.yml             ← reusable workflow — runs tests
├── .bob/
│   ├── instructions/
│   │   └── framework-overview.md      ← agent instruction reference
│   └── skills/
│       ├── test-generator/SKILL.md
│       ├── test-healer/SKILL.md
│       ├── test-planner/SKILL.md
│       └── framework-onboarding/SKILL.md
├── ExecuteTest.ts                     ← entry point — orchestrates test runs
├── GenerateSummaryReport.ts           ← HTML summary dashboard generator
├── .env                               ← runtime secrets (never committed)
├── tsconfig.json
└── package.json
```

**Key rule:** Every application suite under `apps/` follows the **same sub-structure**. When adding a new application, mirror the `saucedemo-e2e` layout exactly.

---

## 4. Core Concepts

### 4.1 Page Object Model

Every page is a TypeScript class that:
- **Extends `BasePage`** (`apps/<suite>/pages/Common/base.page.ts`)
- Declares all locators as `readonly` class properties
- Groups locators with `// Section N: <label>` comments
- Exposes **actions** (`navigate`, `fill`, `click`) and **validations** (`verify…`) as `async` methods
- Contains **no test logic and no hardcoded test data**

```ts
// apps/saucedemo-e2e/pages/Login/SaucedemoLogin.page.ts
export class SaucedemoLoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = this.page.locator('#user-name');
    this.passwordInput = this.page.locator('#password');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async verifyLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory/);
  }
}
```

### 4.2 CSV Test Data

Every spec file loads its test scenarios from a CSV file at runtime:

```
user_id,password,expected_result,scenario_description
standard_user,secret_sauce,success,Valid login with standard_user credentials
```

- **`scenario_description`** is mandatory — it becomes the Playwright test title.
- Credential columns are for documentation only; the spec reads actual values from `process.env`.
- Parsed using [`csv-parse/sync`](https://csv.js.org/parse/api/sync/).

### 4.3 TestController Registry

`apps/<suite>/utils/TestController.ts` is the **single source of truth** for which tests run, where, and in what order:

```ts
export const testControlData = [
  {
    file: 'apps/saucedemo-e2e/tests/Login/SaucedemoLoginTest.spec.ts',
    run: true,                          // false = skip without deleting
    location: ['LOCAL', 'GITHUB'],      // restrict to one environment if needed
    sequenceOrder: 1,                   // lower number runs first
    description: 'Saucedemo Login Test',
  },
];
```

After editing `TestController.ts`, always update the compiled `TestController.js` (or run `npx tsc`).

### 4.4 Environment Variables

All runtime secrets live in a `.env` file at the workspace root. This file is **gitignored** and must never be committed.

```dotenv
# Test execution control
TEST_EXECUTION_LOCATION=LOCAL        # LOCAL or GITHUB
TAKE_SCREENSHOTS=true                # true or false

# Saucedemo suite
SAUCEDEMO_URL=https://www.saucedemo.com/
SAUCEDEMO_USERNAME=standard_user
SAUCEDEMO_PASSWORD=secret_sauce
```

`ExecuteTest.ts` loads `.env` via `dotenv.config()` before running any tests.

### 4.5 Test Execution Flow

```
.env loaded
  └─▶ ExecuteTest.ts reads TestController
        └─▶ filters: run=true AND location matches TEST_EXECUTION_LOCATION
              └─▶ sorts by sequenceOrder
                    └─▶ for each spec file:
                          npx playwright test <file> --config=apps/<suite>/playwright.config.ts
                          copy HTML report ─▶ AllTestResults/HTMLReports/Results_<timestamp>/<N>-<Name>/
                          copy data/ folder and test-results.json
                    └─▶ generateSummaryReport() ─▶ TestExecutionSummary.html
```

### 4.6 Reporting

| Output | Location | Description |
|---|---|---|
| Per-suite HTML report | `AllTestResults/HTMLReports/Results_<ts>/<N>-<Name>/<Name>.html` | Playwright HTML report for each spec |
| Master summary | `AllTestResults/HTMLReports/Results_<ts>/TestExecutionSummary.html` | Aggregated pass/fail/skip dashboard |
| Screenshots | Attached to each test in the HTML report | Captured by `takeScreenShot()` after every major step |

---

## 5. Running Tests Locally

```bash
# Compile and run all tests (respects TestController + .env)
npx tsc ExecuteTest.ts
node ExecuteTest.js

# Run a single spec directly (bypass ExecuteTest.ts)
npx playwright test apps/saucedemo-e2e/tests/Login/SaucedemoLoginTest.spec.ts \
  --workers=1 \
  --config=apps/saucedemo-e2e/playwright.config.ts \
  --headed

# Type-check the whole project without emitting files
npx tsc --noEmit
```

---

## 6. GitHub Actions CI

Two workflow files work together:

| File | Role |
|---|---|
| `.github/workflows/main.yml` | **Dispatcher** — triggered manually via `workflow_dispatch`. Reads `EnvInfo.txt` for the target environment, then calls `playwright.yml`. |
| `.github/workflows/playwright.yml` | **Reusable worker** — receives URL/credential inputs, installs dependencies, compiles TypeScript, runs `node ExecuteTest.js`, uploads `AllTestResults/` as a build artifact (retained 60 days). |

CI execution on the runner:
```bash
npm install
npm install typescript --save-dev
npx tsc ExecuteTest.ts
node ExecuteTest.js
```

CI always uses **self-hosted runners** with Node.js and Chrome pre-installed.

---

## 7. Adding Tests — Checklist

### New test in an existing suite

1. Create the page object if the page doesn't exist: `apps/<suite>/pages/<Feature>/<Feature>.page.ts`
2. Create the CSV data file: `apps/<suite>/test-data/<Feature>/<Feature>Test-data.csv`
3. Write the spec file: `apps/<suite>/tests/<Feature>/<Feature>Test.spec.ts`
4. Add an entry in `TestController.ts` (and sync `TestController.js`)
5. Add any new env vars to `.env`
6. Validate: `npx tsc --noEmit && node ExecuteTest.js`

### New application suite

1. Create `apps/<new-app-e2e>/` mirroring the `saucedemo-e2e` layout
2. Add `playwright.config.ts` with the correct `baseURL` and `testDir`
3. Copy `pages/Common/base.page.ts` (identical across all suites)
4. Follow the "new test" steps above for each feature
5. Update `ExecuteTest.ts` to import the new suite's `TestController`

---

## 8. File & Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Page class file | `<Feature>.page.ts` | `SaucedemoLogin.page.ts` |
| Page class name | `<AppPrefix><Feature>Page` | `SaucedemoLoginPage` |
| Spec file | `<AppPrefix><Feature>Test.spec.ts` | `SaucedemoLoginTest.spec.ts` |
| Test-data CSV | `<AppPrefix><Feature>Test-data.csv` | `SaucedemoLoginTest-data.csv` |
| `test.describe` tag | `@<AppPrefix><Feature>` | `@SaucedemoLogin` |
| Pages folder | `pages/<Feature>/` | `pages/Login/` |
| Tests folder | `tests/<Feature>/` | `tests/Login/` |
| Test-data folder | `test-data/<Feature>/` | `test-data/Login/` |

Every `.ts` file must start with this header comment:

```ts
/*
 * Author: <Name>
 * Created (yyyy-mm-dd): <date>
 * Description: <single-line summary of the file's purpose>
 */
```

---

## 9. Bob AI Agents

This repository is pre-wired for **IBM Bob** — an AI coding assistant with framework-specific skills. Bob knows the exact patterns, naming rules, and file structure of this framework and can generate, fix, and plan tests automatically.

The agent instruction reference lives at [`.bob/instructions/framework-overview.md`](.bob/instructions/framework-overview.md).

### 9.1 Available Skills

| Skill | When to use | Trigger phrase |
|---|---|---|
| **`framework-onboarding`** | Orient a new agent or developer to the framework's folder structure, patterns, and execution model | *"Explain the framework"* / *"How does this project work?"* |
| **`test-planner`** | Analyse a feature and produce a structured, automation-ready test plan with scenarios, steps, and expected results | *"Plan tests for the Checkout feature"* |
| **`test-generator`** | Create all five artifacts for a new test: page object, CSV, spec, `TestController` entry, and docs | *"Generate a test for the Search feature"* |
| **`test-healer`** | Diagnose and minimally fix a failing or flaky test without changing test intent | *"This test is failing — can you fix it?"* |

### 9.2 How to Use an Agent

1. Open the repository in Bob (IBM Bob extension in VS Code).
2. Ensure the relevant `.bob/skills/<skill>/SKILL.md` exists — all four are committed.
3. Ask Bob using any natural-language trigger phrase from the table above.
4. Bob automatically reads `framework-overview.md` first (every skill mandates this), then asks clarifying questions if needed, then produces the code.

Bob will never:
- Hardcode credentials or URLs in test files
- Create a spec without a corresponding `TestController` entry
- Skip the file header comment
- Apply a test fix that weakens or removes an assertion

### 9.3 Agent Workflow Examples

#### Generate a new test from scratch

```
You: "Generate a Playwright test for the Search feature on saucedemo-e2e.
      The URL is https://www.saucedemo.com/inventory.html.
      Scenarios: 1) Search by product name and verify result appears.
                 2) Search with no results and verify empty state message."

Bob: Activates test-generator skill →
     Creates pages/Search/SaucedemoSearch.page.ts
     Creates test-data/Search/SaucedemoSearchTest-data.csv
     Creates tests/Search/SaucedemoSearchTest.spec.ts
     Updates TestController.ts + TestController.js
     Runs npx tsc --noEmit to confirm no type errors
     Reports env vars to add to .env
```

#### Fix a failing test

```
You: "The SaucedemoLoginTest is failing with:
      Error: locator('#user-name') - not found"

Bob: Activates test-healer skill →
     Reads the spec file and page object
     Classifies: Selector drift
     Proposes minimal locator fix (getByPlaceholder → data-testid → CSS)
     Applies apply_diff (never rewrites whole file)
     Runs the spec to confirm it passes
     Reports repair summary
```

#### Plan test scenarios before building

```
You: "Plan all test scenarios for the Checkout feature on saucedemo-e2e."

Bob: Activates test-planner skill →
     Identifies happy path, negative paths, edge cases
     Writes structured scenarios to apps/saucedemo-e2e/test-planner/Checkout/
     Flags any ambiguous steps that need clarification
     Recommends running test-generator next
```

---

## 10. Project Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@playwright/test` | ^1.61.1 | Test runner, browser automation, assertions |
| `typescript` | ^7.0.2 | TypeScript compiler |
| `@types/node` | ^26.1.1 | Node.js type definitions |
| `csv-parse` | ^7.0.0 | Parse CSV test-data files |
| `dotenv` | ^17.4.2 | Load `.env` secrets at runtime |

Install all dependencies:
```bash
npm install
```

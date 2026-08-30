# Playwright Regression Framework — DemoQA e2e

A structured, scalable end-to-end test automation framework built on [Playwright](https://playwright.dev/) and TypeScript, using the Page Object Model (POM), CSV-driven test data, and an AI-assisted development workflow powered by IBM Bob agents.

This repository currently implements the **DemoQA Student Registration Form** test suite — 20 automated test cases covering every field and interaction on https://demoqa.com/automation-practice-form.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Repository Layout](#3-repository-layout)
4. [Test Suite — DemoQA Registration Form](#4-test-suite--demoqa-registration-form)
   - [Test Cases (TC_001–TC_020)](#41-test-cases-tc_001tc_020)
   - [Known Application Behaviours](#42-known-application-behaviours)
5. [Core Concepts](#5-core-concepts)
   - [Page Object Model](#51-page-object-model)
   - [CSV Test Data](#52-csv-test-data)
   - [TestController Registry](#53-testcontroller-registry)
   - [Environment Variables](#54-environment-variables)
   - [Test Execution Flow](#55-test-execution-flow)
   - [Reporting](#56-reporting)
6. [Running Tests Locally](#6-running-tests-locally)
7. [GitHub Actions CI](#7-github-actions-ci)
8. [Adding Tests — Checklist](#8-adding-tests--checklist)
9. [File & Naming Conventions](#9-file--naming-conventions)
10. [Bob AI Agents](#10-bob-ai-agents)
    - [Available Agents & Skills](#101-available-agents--skills)
    - [Agent Workflow — DemoQA Example](#102-agent-workflow--demoqa-example)
11. [Project Dependencies](#11-project-dependencies)

---

## 1. Prerequisites

| Tool | Minimum version | Notes |
|---|---|---|
| Node.js | 18 LTS | v24+ confirmed working |
| npm | 9+ | Comes with Node.js |
| TypeScript | 5+ | Installed as a dev dependency |
| Chromium | Latest | Managed by `npx playwright install chromium` |

---

## 2. Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd Demo_QA_Forms_Agentic

# 2. Install dependencies
npm install

# 3. Install Playwright browser
npx playwright install chromium

# 4. Add the required environment variable to .env (create if it does not exist)
echo "DEMOQA_URL=https://demoqa.com" >> .env
echo "TEST_EXECUTION_LOCATION=LOCAL" >> .env
echo "TAKE_SCREENSHOTS=true" >> .env

# 5. Run all DemoQA tests
npm run test:demoqa

# — or run via the orchestrator (generates aggregated HTML report) —
npx tsc ExecuteTest.ts
node ExecuteTest.js
```

Test results from the orchestrator are written to `AllTestResults/HTMLReports/Results_<timestamp>/`.

---

## 3. Repository Layout

```
Demo_QA_Forms_Agentic/
├── apps/
│   └── demoqa-e2e/                          ← DemoQA e2e test suite
│       ├── pages/
│       │   ├── Common/
│       │   │   └── base.page.ts             ← BasePage — all page objects extend this
│       │   └── RegistrationForm/
│       │       └── DemoQARegistrationForm.page.ts
│       ├── test-data/
│       │   └── RegistrationForm/
│       │       ├── DemoQARegistrationFormTest-data.csv   ← 20 test scenarios
│       │       └── assets/
│       │           ├── image.jpg            ← TC_014 upload fixture
│       │           ├── image.png            ← TC_015 upload fixture
│       │           └── sample.mp4           ← TC_016 upload fixture
│       ├── tests/
│       │   └── RegistrationForm/
│       │       └── DemoQARegistrationFormTest.spec.ts    ← 20 data-driven tests
│       ├── test-planner/                    ← automation-ready test plans
│       │   ├── README.md
│       │   └── RegistrationForm/
│       │       ├── TC_001_ValidFullFormSubmission.md
│       │       ├── TC_002_EmptyFormSubmission.md
│       │       └── … (TC_003–TC_020)
│       ├── utils/
│       │   ├── TestController.ts            ← master test registry
│       │   ├── TestController.js            ← compiled copy (committed)
│       │   ├── CommonFunctions.ts           ← takeScreenShot helper
│       │   └── index.ts                     ← fillInputField, addTimeout
│       └── playwright.config.ts             ← suite-level Playwright config
├── docs/
│   └── demoqa_Form_Testcases.xlsx           ← source test case workbook
├── .github/
│   ├── agents/
│   │   ├── instructions/
│   │   │   └── framework-overview.md        ← agent instruction reference
│   │   ├── skills/
│   │   │   ├── framework-onboarding/SKILL.md
│   │   │   ├── test-generator/SKILL.md
│   │   │   ├── test-healer/SKILL.md
│   │   │   └── test-planner/SKILL.md
│   │   ├── playwright-test-generator.agent.md
│   │   ├── playwright-test-healer.agent.md
│   │   └── playwright-test-planner.agent.md
│   └── workflows/
│       ├── main.yml                         ← dispatcher workflow
│       └── playwright.yml                   ← reusable test runner workflow
├── ExecuteTest.ts                           ← entry point — orchestrates test runs
├── ExecuteTest.js                           ← compiled copy
├── GenerateSummaryReport.ts                 ← HTML summary dashboard generator
├── GenerateSummaryReport.js                 ← compiled copy
├── package.json
├── tsconfig.json
└── .env                                     ← runtime secrets (never committed)
```

**Key rule:** Every application suite under `apps/` follows the **same sub-structure**. To add a new application, mirror the `demoqa-e2e` layout exactly.

---

## 4. Test Suite — DemoQA Registration Form

**Target URL:** https://demoqa.com/automation-practice-form  
**Entry via:** https://demoqa.com/forms → *Practice Form* (left sidebar)  
**Total tests:** 20 | **Last run result:** ✅ 20/20 passed

### 4.1 Test Cases (TC_001–TC_020)

| TC ID | Description | Expected Outcome | Form Fields Covered |
|---|---|---|---|
| TC_001 | Valid form submission with all inputs | ✅ Modal shows `Thanks for submitting the form` with all field values verified | All fields |
| TC_002 | Submit with all fields empty | ❌ Modal absent; First Name, Last Name, Mobile show red border | First Name, Last Name, Mobile |
| TC_003 | Submit without First Name | ❌ Modal absent; First Name shows red border | First Name |
| TC_004 | Submit without Last Name | ❌ Modal absent; Last Name shows red border | Last Name |
| TC_005 | Submit with invalid email (`1234`) | ❌ Modal absent; Email shows red border | Email |
| TC_006 | Submit with already-existing email | ✅ Form submits *(DemoQA has no duplicate-email validation)* | Email |
| TC_007 | Select Male then Female gender | ✅ Only Female checked; Male deselected | Gender radio group |
| TC_008 | Submit with invalid mobile (`123456`) | ❌ Modal absent; Mobile shows red border | Mobile Number |
| TC_009 | Submit with already-existing mobile | ✅ Form submits *(DemoQA has no duplicate-mobile validation)* | Mobile Number |
| TC_010 | Submit with past DoB (24 Sep 1999) | ✅ Modal shows form submitted; DoB row verified | Date of Birth |
| TC_011 | Submit with future DoB (24 Sep 2028) | ✅ Form submits *(DemoQA allows future DoB)* | Date of Birth |
| TC_012 | Type `Maths` in Subjects | ✅ Autocomplete dropdown displays `Maths` as option | Subjects |
| TC_013 | Select Sports and Reading hobbies | ✅ Both checked simultaneously; both appear in modal | Hobbies |
| TC_014 | Upload `.jpg` picture | ✅ Form submits successfully | Picture upload |
| TC_015 | Upload `.png` picture | ✅ Form submits successfully | Picture upload |
| TC_016 | Upload `.mp4` file | ✅ File accepted by input; filename verified *(no MIME restriction on form)* | Picture upload |
| TC_017 | Address with special characters `(H.O), (P.O)` | ✅ Address preserved verbatim in modal | Current Address |
| TC_018 | Select State (NCR) — City enabled | ✅ City dropdown changes from `aria-disabled=true` to enabled | State / City dropdowns |
| TC_019 | Attempt City without State selected | ✅ City dropdown has `aria-disabled=true` | State / City dropdowns |
| TC_020 | Submit form then click Close button | ✅ Modal closes; `.modal` element removed from DOM | Confirmation modal |

### 4.2 Known Application Behaviours

The following behaviours are confirmed observations from live execution against the DemoQA practice form. Tests are written to reflect actual application behaviour, not the originally expected test-plan outcome.

| TC | Original Expectation | Actual Behaviour | Automation Decision |
|---|---|---|---|
| TC_006 | Email uniqueness error | DemoQA has no server-side duplicate-email check | Asserts success modal |
| TC_009 | Mobile uniqueness error | DemoQA has no server-side duplicate-mobile check | Asserts success modal |
| TC_011 | Future DoB rejected | DemoQA date picker allows any date; no server-side validation | Asserts success modal |
| TC_016 | `.mp4` file rejected | `<input type="file">` has no `accept` restriction; browser accepts any MIME type | Asserts filename in input |

---

## 5. Core Concepts

### 5.1 Page Object Model

Every page is a TypeScript class that:
- **Extends `BasePage`** (`apps/<suite>/pages/Common/base.page.ts`)
- Declares all locators as `readonly` class properties grouped with `// Section N: <label>` comments
- Exposes **actions** (`navigate`, `fill`, `click`) and **validations** (`verify…`) as `async` methods
- Contains **no test logic and no hardcoded test data**

```ts
// apps/demoqa-e2e/pages/RegistrationForm/DemoQARegistrationForm.page.ts
export class DemoQARegistrationFormPage extends BasePage {

  // ============================================================
  // Section 1: Personal Info Locators
  // ============================================================
  readonly firstNameInput: Locator;
  readonly emailInput: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = this.page.locator('#firstName');
    this.emailInput     = this.page.locator('#userEmail');
  }

  async fillFirstName(value: string): Promise<void> {
    await this.firstNameInput.fill(value);
  }

  async verifySubmissionSuccessful(): Promise<void> {
    await expect(this.confirmationModal).toBeVisible({ timeout: 10000 });
    await expect(this.modalTitle).toHaveText('Thanks for submitting the form');
  }
}
```

### 5.2 CSV Test Data

Every spec file loads all test scenarios from a CSV file at collection time:

```
tc_id,first_name,last_name,email,gender,mobile,...,expected_result,scenario_description
TC_001,John,Smith,john.smith@example.com,Male,9876543210,...,success,TC_001 - Valid form submission...
TC_002,,,,,,,...,error,TC_002 - Submit empty form...
```

- **`scenario_description`** is mandatory — it becomes the Playwright test title.
- **`expected_result`** drives the post-submit assertion branch: `success` | `error` | `radio_exclusion` | `autocomplete` | `state_city` | `city_only` | `invalid_file` | `close_modal`.
- All fields map 1-to-1 to the 17 columns in [`DemoQARegistrationFormTest-data.csv`](apps/demoqa-e2e/test-data/RegistrationForm/DemoQARegistrationFormTest-data.csv).
- Parsed using [`csv-parse/sync`](https://csv.js.org/parse/api/sync/).

### 5.3 TestController Registry

[`apps/demoqa-e2e/utils/TestController.ts`](apps/demoqa-e2e/utils/TestController.ts) is the **single source of truth** for which tests run, where, and in what order:

```ts
export const testControlData = [
  {
    file: 'apps/demoqa-e2e/tests/RegistrationForm/DemoQARegistrationFormTest.spec.ts',
    run: true,                        // false = skip without deleting
    location: ['LOCAL', 'GITHUB'],    // restrict to one environment if needed
    sequenceOrder: 1,                 // lower number runs first
    description: 'DemoQA Student Registration Form — TC_001 to TC_020',
  },
];
```

After editing `TestController.ts`, always update the compiled `TestController.js` (or run `npx tsc`).

`ExecuteTest.ts` imports `TestController.js` directly to resolve the module at runtime.

### 5.4 Environment Variables

All runtime configuration lives in a `.env` file at the workspace root. This file is **gitignored** and must never be committed.

```dotenv
# Test execution control
TEST_EXECUTION_LOCATION=LOCAL          # LOCAL or GITHUB
TAKE_SCREENSHOTS=true                  # true or false (false speeds up local runs)

# DemoQA suite
DEMOQA_URL=https://demoqa.com
```

`ExecuteTest.ts` and each `playwright.config.ts` load `.env` via `dotenv.config()` before running tests.  
`TAKE_SCREENSHOTS=false` disables screenshot capture and is useful for fast local iteration.

### 5.5 Test Execution Flow

```
.env loaded
  └─▶ ExecuteTest.ts reads TestController.js
        └─▶ filters: run=true AND location includes TEST_EXECUTION_LOCATION
              └─▶ sorts by sequenceOrder
                    └─▶ for each spec file:
                          npx playwright test <file>
                            --workers=1
                            --config=apps/demoqa-e2e/playwright.config.ts
                            --headed
                          copy HTML report ─▶ AllTestResults/HTMLReports/Results_<ts>/<N>-<Name>/
                          copy data/ and test-results.json
                    └─▶ generateSummaryReport() ─▶ TestExecutionSummary.html
```

### 5.6 Reporting

| Output | Location | Description |
|---|---|---|
| Per-suite HTML report | `AllTestResults/HTMLReports/Results_<ts>/<N>-<Name>/<Name>.html` | Full Playwright HTML report per spec |
| Master summary | `AllTestResults/HTMLReports/Results_<ts>/TestExecutionSummary.html` | Aggregated pass / fail / skip dashboard |
| Screenshots | Attached inline to each test in the HTML report | Captured by `takeScreenShot()` after every major step |
| Playwright trace | `test-results/…/trace.zip` | Collected on first retry; open with `npx playwright show-trace` |

---

## 6. Running Tests Locally

### Via npm scripts (recommended for DemoQA suite)

```bash
# Run all 20 DemoQA tests headlessly
npm run test:demoqa

# Run with visible browser window
npm run test:demoqa:headed

# Open the interactive Playwright UI mode
npm run test:demoqa:ui

# View the HTML report from the last run
npm run report
```

### Via Playwright CLI directly

```bash
# Run a single spec, single worker, headed
npx playwright test \
  apps/demoqa-e2e/tests/RegistrationForm/DemoQARegistrationFormTest.spec.ts \
  --workers=1 \
  --config=apps/demoqa-e2e/playwright.config.ts \
  --headed

# Run a specific TC by title grep
npx playwright test \
  --config=apps/demoqa-e2e/playwright.config.ts \
  --grep "TC_001"

# Run the full orchestrator (all suites, generates summary)
npx tsc ExecuteTest.ts
node ExecuteTest.js
```

---

## 7. GitHub Actions CI

Two workflow files work together:

| File | Role |
|---|---|
| [`.github/workflows/main.yml`](.github/workflows/main.yml) | **Dispatcher** — triggered manually via `workflow_dispatch`. Reads `EnvInfo.txt` for the target environment, then calls `playwright.yml`. |
| [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) | **Reusable worker** — receives URL/credential inputs, installs dependencies, compiles TypeScript, runs `node ExecuteTest.js`, and uploads `AllTestResults/` as a build artifact (retained 60 days). |

CI execution steps on the runner:
```bash
npm install
npm install typescript --save-dev
npx playwright install chromium
npx tsc ExecuteTest.ts
node ExecuteTest.js
```

CI always uses **self-hosted runners** with Node.js and Chrome pre-installed.

To set `TEST_EXECUTION_LOCATION=GITHUB`, configure the `.env` (or GitHub Actions secrets/inputs) accordingly — the orchestrator switches to the `playwright-report/` output path in that mode.

---

## 8. Adding Tests — Checklist

### New test in an existing suite

1. Draft the test plan markdown in `apps/<suite>/test-planner/<Feature>/TC_NNN_<Name>.md`
2. Create the page object if the page doesn't exist: `apps/<suite>/pages/<Feature>/<Feature>.page.ts`
3. Add rows to the CSV data file: `apps/<suite>/test-data/<Feature>/<Feature>Test-data.csv`
4. Add test logic to the spec file: `apps/<suite>/tests/<Feature>/<Feature>Test.spec.ts`
5. Add or update the entry in `TestController.ts` (and sync `TestController.js`)
6. Add any new env vars to `.env`
7. Validate: `npx playwright test --config=apps/<suite>/playwright.config.ts`

### New application suite

1. Create `apps/<new-app-e2e>/` mirroring the `demoqa-e2e` layout
2. Add `playwright.config.ts` with the correct `baseURL` and `testDir`
3. Copy `pages/Common/base.page.ts` (identical across all suites)
4. Update `ExecuteTest.ts` to import the new suite's `TestController`
5. Follow the "new test" steps above for each feature

---

## 9. File & Naming Conventions

| Artifact | Convention | DemoQA Example |
|---|---|---|
| Page class file | `<Feature>.page.ts` | `DemoQARegistrationForm.page.ts` |
| Page class name | `<AppPrefix><Feature>Page` | `DemoQARegistrationFormPage` |
| Spec file | `<AppPrefix><Feature>Test.spec.ts` | `DemoQARegistrationFormTest.spec.ts` |
| Test-data CSV | `<AppPrefix><Feature>Test-data.csv` | `DemoQARegistrationFormTest-data.csv` |
| `test.describe` tag | `@<AppPrefix><Feature>` | `@DemoQARegistrationForm` |
| Pages folder | `pages/<Feature>/` | `pages/RegistrationForm/` |
| Tests folder | `tests/<Feature>/` | `tests/RegistrationForm/` |
| Test-data folder | `test-data/<Feature>/` | `test-data/RegistrationForm/` |
| Test plan folder | `test-planner/<Feature>/` | `test-planner/RegistrationForm/` |
| Test plan file | `TC_NNN_<PascalCaseName>.md` | `TC_001_ValidFullFormSubmission.md` |

Every `.ts` file must start with this header comment:

```ts
/*
 * Author: <Name>
 * Created (yyyy-mm-dd): <date>
 * Description: <single-line summary of the file's purpose>
 */
```

---

## 10. Bob AI Agents

This repository is pre-wired for **IBM Bob** — an AI coding assistant with framework-specific agents and skills. Bob knows the exact patterns, naming rules, and file structure of this framework and can generate, plan, and fix tests following a structured 3-stage workflow.

The agent instruction reference lives at [`.github/agents/instructions/framework-overview.md`](.github/agents/instructions/framework-overview.md).

### 10.1 Available Agents & Skills

#### Agents (`.github/agents/`)

| Agent file | When to use |
|---|---|
| [`playwright-test-planner.agent.md`](.github/agents/playwright-test-planner.agent.md) | Convert manual test steps into structured, automation-ready test plans (Step 1 in the workflow) |
| [`playwright-test-generator.agent.md`](.github/agents/playwright-test-generator.agent.md) | Generate Playwright TypeScript scripts from a test plan (Step 2 in the workflow) |
| [`playwright-test-healer.agent.md`](.github/agents/playwright-test-healer.agent.md) | Execute, diagnose, and minimally fix failing or flaky tests (Step 3 in the workflow) |

#### Skills (`.github/agents/skills/`)

| Skill | When to use |
|---|---|
| **`framework-onboarding`** | Orient a new agent or developer to the framework's structure, patterns, and execution model |
| **`test-planner`** | Analyse a feature and produce a structured test plan with scenarios, steps, and expected results |
| **`test-generator`** | Create all framework artifacts for a new test: page object, CSV, spec, and TestController entry |
| **`test-healer`** | Diagnose and minimally fix a failing test without changing its intent |

### 10.2 Agent Workflow — DemoQA Example

The DemoQA Registration Form test suite was built end-to-end using the 3-stage agent workflow:

#### Stage 1 — Test Planner

```
Input:  docs/demoqa_Form_Testcases.xlsx  (20 test cases)
        {ENV_VAR_URL} = https://demoqa.com/forms

Output: apps/demoqa-e2e/test-planner/RegistrationForm/
        ├── TC_001_ValidFullFormSubmission.md
        ├── TC_002_EmptyFormSubmission.md
        └── … TC_003–TC_020

Each file contains:
  - STEP 1: Test Intent (one sentence)
  - STEP 2: Structured test plan (numbered steps with expected results)
  - STEP 3: Automation Readiness Check (blockers flagged)
```

#### Stage 2 — Test Generator

```
Input:  apps/demoqa-e2e/test-planner/RegistrationForm/ (all 20 plans)
        .github/agents/instructions/framework-overview.md

Output: apps/demoqa-e2e/pages/RegistrationForm/DemoQARegistrationForm.page.ts
        apps/demoqa-e2e/test-data/RegistrationForm/DemoQARegistrationFormTest-data.csv
        apps/demoqa-e2e/tests/RegistrationForm/DemoQARegistrationFormTest.spec.ts
        apps/demoqa-e2e/utils/TestController.ts + TestController.js
        apps/demoqa-e2e/playwright.config.ts
        package.json (with all dependencies)
```

#### Stage 3 — Test Healer (Execute & Fix)

```
Run:    npx playwright test --config=apps/demoqa-e2e/playwright.config.ts

Cycle 1 — 8 failures identified and fixed:
  • CSV column count errors (all rows rebuilt via Node.js script)
  • react-select option locator: .state__option → #state [class*="-option"]
  • react-select option locator: .city__option  → #city [class*="-option"]
  • City disabled check: class-based → aria-disabled="true" attribute
  • TC_006, TC_009, TC_011: expected_result corrected to match actual app behaviour

Cycle 2 — 3 failures fixed:
  • City control disabled/enabled: class check → toHaveAttribute('aria-disabled', 'true')
  • TC_018 city options: .city__option → #city [class*="-option"]
  • TC_020 modal close: not.toBeVisible() → wait for .modal not.toBeAttached()

Cycle 3 — 1 failure fixed:
  • TC_020 modal close: .modal stays in DOM; close button intercepted by ads
    → force-click then fallback to Escape key; assert .modal not.toBeAttached()

Final result: 20/20 passed ✅
```

---

## 11. Project Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@playwright/test` | `^1.62.1` | Test runner, browser automation, built-in assertions |
| `typescript` | `^5.9.3` | TypeScript compiler |
| `csv-parse` | `^5.6.0` | Parse CSV test-data files at runtime |
| `dotenv` | `^16.6.1` | Load `.env` secrets at runtime |

Install all dependencies and browsers:

```bash
npm install
npx playwright install chromium
```

# DemoQA Forms � Playwright e2e Test Suite

End-to-end test automation for the [DemoQA Student Registration Form](https://demoqa.com/automation-practice-form) built with Playwright, TypeScript, and the Page Object Model.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18 LTS or higher |
| npm | 9+ |
| TypeScript | 5+ (dev dependency) |
| Chromium | Managed by Playwright |

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd Demo_QA_Forms_Agentic
npm install
npx playwright install chromium

# 2. Create .env file
echo "DEMOQA_URL=https://demoqa.com" >> .env
echo "TEST_EXECUTION_LOCATION=LOCAL" >> .env
echo "TAKE_SCREENSHOTS=true" >> .env

# 3. Run tests
npm run test:demoqa
```

---

## npm Scripts

| Command | What it does |
|---|---|
| `npm run test:demoqa` | Run all 20 tests headlessly |
| `npm run test:demoqa:headed` | Run with visible browser |
| `npm run test:demoqa:ui` | Open Playwright UI mode |
| `npm run report` | View last HTML report |

---

## Repository Layout

```
Demo_QA_Forms_Agentic/
+-- apps/
�   +-- demoqa-e2e/
�       +-- pages/RegistrationForm/      ? Page Object class
�       +-- test-data/RegistrationForm/  ? CSV test data (20 scenarios) + assets
�       +-- tests/RegistrationForm/      ? Spec file
�       +-- test-planner/                ? Automation-ready test plans (local only)
�       +-- utils/                       ? TestController, helpers
+-- docs/                                ? Source test case workbook (local only)
+-- .github/agents/                      ? Bob AI agent definitions and skills
+-- ExecuteTest.ts                       ? Orchestrator entry point
+-- GenerateSummaryReport.ts             ? HTML summary report generator
+-- playwright.config.ts                 ? Playwright configuration
+-- package.json
+-- .env                                 ? Runtime secrets (never committed)
```

---

## Test Suite

**URL:** https://demoqa.com/automation-practice-form  
**Total tests:** 20 | **Status:** ? 20/20 passed

Tests are data-driven � each row in `DemoQARegistrationFormTest-data.csv` becomes one test case covering fields, validations, file uploads, dropdowns, and modal interactions.

---

## Environment Variables

Create a `.env` file at the project root:

```dotenv
TEST_EXECUTION_LOCATION=LOCAL    # LOCAL or GITHUB
TAKE_SCREENSHOTS=true            # false speeds up local runs
DEMOQA_URL=https://demoqa.com
```

---

## Bob AI Agents

This repo includes three IBM Bob agents for AI-assisted test development:

| Agent | Purpose |
|---|---|
| `playwright-test-planner` | Convert manual test steps into structured test plans |
| `playwright-test-generator` | Generate page objects, spec files, and CSV data from a plan |
| `playwright-test-healer` | Diagnose and fix failing or flaky tests |

Agent definitions live in [`.github/agents/`](.github/agents/).

---

## Dependencies

| Package | Purpose |
|---|---|
| `@playwright/test` | Test runner and browser automation |
| `typescript` | TypeScript compiler |
| `csv-parse` | Parse CSV test data files |
| `dotenv` | Load `.env` variables at runtime |

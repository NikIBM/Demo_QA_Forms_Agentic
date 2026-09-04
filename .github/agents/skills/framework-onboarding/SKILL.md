---
name: framework-onboarding
description: Use when an agent or developer needs to understand this Playwright regression framework — its folder structure, patterns, execution model, and conventions — before starting any work in the repository.
---

# Framework Onboarding

This skill walks any agent through learning this repository's test automation framework so it
can work on it effectively without needing prior knowledge of the codebase.

## Step 1 — Read the Master Instructions

Use `read_file` to read `agents/instructions/framework-overview.md` in full.
This single document describes every pattern used in the framework:

- Folder layout under `apps/`
- Page Object Model conventions
- Spec file structure
- CSV test-data conventions
- `.env` secrets management
- `TestController` registry
- Utility helpers
- Test execution flow (`ExecuteTest.ts`)
- Reporting (`GenerateSummaryReport.ts`)
- GitHub Actions CI setup
- File naming conventions
- File header comment template

**Do not proceed to any code task until this file has been read and understood.**

## Step 2 — Explore the Reference Implementation

Read the following files as concrete examples of the patterns:

| File | What it demonstrates |
|---|---|
| `apps/test-e2e/pages/Common/base.page.ts` | BasePage — the class all pages extend |
| `apps/test-e2e/pages/Login/testLogin.page.ts` | Full page object with locators, actions, validations |
| `apps/test-e2e/tests/Login/testLoginTest.spec.ts` | Complete spec: CSV load, beforeAll/afterAll, test loop, screenshots |
| `apps/test-e2e/test-data/Login/testLoginTest-data.csv` | CSV format with headers |
| `apps/test-e2e/utils/TestController.ts` | Registry entry structure |
| `apps/test-e2e/utils/CommonFunctions.ts` | `takeScreenShot` helper |
| `apps/test-e2e/utils/index.ts` | `fillInputField`, `addTimeout` utilities |
| `apps/test-e2e/playwright.config.ts` | Suite-level Playwright config |
| `ExecuteTest.ts` | Orchestration entry point |

Use `read_file` for each file listed above.

## Step 3 — Confirm Understanding

After reading, summarize these key points back to the user / calling agent:

1. **Entry point:** How tests are run (`ExecuteTest.ts` → `TestController` → `playwright test`).
2. **Adding a test:** The five artifacts needed (page, CSV, spec, TestController entry, env vars).
3. **Secrets:** Where credentials live (`.env`, never hardcoded).
4. **Reporting:** Where results appear (`AllTestResults/HTMLReports/`).
5. **CI:** How GitHub Actions triggers and passes parameters.

## Step 4 — Ready for Work

Once the above is complete, the agent is fully context-loaded. Direct it to one of:
- `test-generator` skill — to create new tests.
- `test-healer` skill — to fix failing tests.
- `test-planner` skill — to plan new scenarios.

All three skills also begin by reading `framework-overview.md`, so this onboarding skill
acts as an accelerator for agents that will perform multiple tasks in a session.

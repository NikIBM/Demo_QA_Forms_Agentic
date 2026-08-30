---
name: test-generator
description: Use when the user wants to generate, create, add, or write a new Playwright test — including new page objects, test spec files, CSV test data, and TestController entries — following this project's framework conventions.
---

# Playwright Test Generator

Follow these steps in order to generate a complete, framework-compliant test for any feature.

## Step 0 — Load Framework Instructions

Before writing any code, read `agents/instructions/framework-overview.md` in full using `read_file`.
This is mandatory — it contains all naming conventions, patterns, and rules that must be followed.

## Step 1 — Gather Requirements

Use `ask_followup_question` to collect any missing details:
- **Application suite** — which `apps/<suite>/` does this test belong to?
- **Feature / module name** — e.g. "Login", "Checkout", "UserManagement".
- **Target URL** — where does the flow start?
- **Test scenarios** — list of scenarios (becomes CSV rows). Each must have a `scenario_description`.
- **Steps per scenario** — what actions does the user take?
- **Assertions** — what must be true after the actions?
- **New env vars needed** — any credentials or URLs not already in `.env`?

Stop and ask rather than assume. Do not proceed with placeholders.

## Step 2 — Explore Existing Files

Use `list_files` or `glob` to inspect the target app suite:
- `apps/<suite>/pages/` — check for an existing page file for this feature.
- `apps/<suite>/utils/TestController.ts` — read it to understand existing sequence orders.
- `apps/<suite>/utils/CommonFunctions.ts` and `utils/index.ts` — confirm available helpers.
- Check `apps/<suite>/pages/Common/base.page.ts` — confirm the BasePage API.

Reuse existing page classes and helpers wherever possible.

## Step 3 — Create the Page Object File

File path: `apps/<suite>/pages/<Feature>/<Feature>.page.ts`

Rules (from framework-overview.md §2.1):
- Class extends `BasePage`.
- All locators as `readonly` class properties, grouped under `// Section N:` comments.
- Actions (navigate, fill, click) and validations (`verify…`) as `async` methods.
- No hardcoded test data, no test logic.
- File header comment with Author, Created date, and Description.

Use `write_file` to create the file. Prefer `getByRole`, `getByLabel`, `getByPlaceholder`, then
`data-testid`, then CSS selector as a last resort.

## Step 4 — Create the CSV Test-Data File

File path: `apps/<suite>/test-data/<Feature>/<Feature>Test-data.csv`

Rules:
- First row is the header.
- `scenario_description` column is mandatory — it becomes part of the test title.
- Include one row per scenario.
- Credentials columns may be present for documentation but will be read from `.env` at runtime.

Use `write_file` to create the file.

## Step 5 — Create the Spec File

File path: `apps/<suite>/tests/<Feature>/<Feature>Test.spec.ts`

Rules (from framework-overview.md §2.3):
- One `test.describe('@<AppPrefix><Feature>')` block.
- Shared `page` created in `beforeAll`, closed in `afterAll`.
- Load CSV with `csv-parse/sync`.
- Iterate `testData` array — one `test(...)` per row.
- All credentials and URLs from `process.env.VAR!`.
- Call `takeScreenShot` after every major action step.
- File header comment.

Use `write_file` to create the file.

## Step 6 — Register in TestController

Read `apps/<suite>/utils/TestController.ts` using `read_file`.
Add a new entry to the `testControlData` array:

```ts
{
  file: 'apps/<suite>/tests/<Feature>/<Feature>Test.spec.ts',
  run: true,
  location: ['LOCAL', 'GITHUB'],
  sequenceOrder: <next available number>,
  description: '<human-readable description>',
},
```

Use `apply_diff` (not `write_file`) to append the entry. Then do the same for the `.js` file
(same content, CommonJS `exports.testControlData` format).

## Step 7 — Document New Env Vars

If new environment variables are needed, tell the user:
- The exact variable names.
- Example values.
- That they must be added to the `.env` file at the workspace root.

Do NOT write to `.env` directly — it is gitignored and may contain live secrets.

## Step 8 — Validate

Run a TypeScript check to confirm no compile errors:

```
npx tsc --noEmit
```

Use `execute_command` to run this and report any errors. Fix any type errors before finishing.

## Step 9 — Write Test-Case Documentation

Create a test-case doc in the `docs/` folder (gitignored — local only):

File path: `docs/<suite>/<Feature>/<Feature>-test-cases.md`

Use `write_file` to create it. Follow the template in `docs/README.md`.
Each test scenario from the CSV should have a corresponding TC entry with:
- Preconditions.
- Numbered steps table (Action | Expected Result).
- Screenshots captured.
- Postconditions.

Read `docs/README.md` first for the full template if it exists.

## Output Summary

After all files are created, present a summary table:

| File | Type | Action |
|---|---|---|
| `apps/<suite>/pages/<Feature>/<Feature>.page.ts` | Page Object | Created |
| `apps/<suite>/test-data/<Feature>/<Feature>Test-data.csv` | Test Data | Created |
| `apps/<suite>/tests/<Feature>/<Feature>Test.spec.ts` | Spec | Created |
| `apps/<suite>/utils/TestController.ts` | Registry | Updated |
| `apps/<suite>/utils/TestController.js` | Registry (compiled) | Updated |
| `docs/<suite>/<Feature>/<Feature>-test-cases.md` | Documentation | Created |

List any env vars the user must add to `.env`.

# Tester Playbook — End-to-End Execution Guide

> **Who this is for:** Any tester who has received a test plan `.md` file and needs to run the
> automated tests and produce a results report.
> Follow every phase in order. Do not skip steps.

---

## Table of Contents

1. [Phase 0 — Prerequisites](#phase-0--prerequisites)
2. [Phase 1 — Receive & Review the Test Plan](#phase-1--receive--review-the-test-plan)
3. [Phase 2 — Set Up the Environment](#phase-2--set-up-the-environment)
4. [Phase 3 — Configure Test Data](#phase-3--configure-test-data)
5. [Phase 4 — Register the Test in TestController](#phase-4--register-the-test-in-testcontroller)
6. [Phase 5 — Run the Tests](#phase-5--run-the-tests)
7. [Phase 6 — Review the Results](#phase-6--review-the-results)
8. [Phase 7 — Report & Hand Off](#phase-7--report--hand-off)
9. [Quick Reference Card](#quick-reference-card)
10. [Troubleshooting](#troubleshooting)

---

## Phase 0 — Prerequisites

Before you start, confirm the following are installed on your machine:

| Tool | How to verify | Minimum version |
|---|---|---|
| Node.js | `node -v` | 18 LTS |
| npm | `npm -v` | 9+ |
| Git | `git --version` | Any recent |
| Chrome browser | Open Chrome → Help → About | Latest stable |

If any of these are missing, install them before continuing.

---

## Phase 1 — Receive & Review the Test Plan

### 1.1 Open the `.md` file

The test plan file you received will be under:

```
apps/<suite>/test-planner/<Feature>/<NN>_<ScenarioName>.md
```

Example:
```
apps/saucedemo-e2e/test-planner/Login/02_Login_Invalid_User.md
```

### 1.2 Read and understand the three sections

Every test plan `.md` file has exactly three sections. Read all three before touching any code.

| Section | What it tells you | What you need from it |
|---|---|---|
| **STEP 1 — Test Intent** | One-sentence goal of the test | Confirm you understand what is being verified |
| **STEP 2 — Structured Test Plan** | Test Case ID, preconditions, numbered steps, expected results, screenshots, CSV row to add | The exact test data row to add to the CSV; the preconditions you must satisfy |
| **STEP 3 — Automation Readiness Check** | Whether locators and page-object methods exist; any blockers | If any row shows ❌ — stop and raise it with the developer before proceeding |

### 1.3 Check the header block

At the top of the `.md` file you will see a header like this:

```
Application suite:   saucedemo-e2e
Base URL:            https://www.saucedemo.com/
Playwright config:   apps/saucedemo-e2e/playwright.config.ts
Spec file:           apps/saucedemo-e2e/tests/Login/SaucedemoLoginTest.spec.ts
Page object:         apps/saucedemo-e2e/pages/Login/SaucedemoLogin.page.ts
Test data CSV:       apps/saucedemo-e2e/test-data/Login/SaucedemoLoginTest-data.csv
```

Note these paths — you will need them in the steps that follow.

### 1.4 Blockers checklist

Before proceeding, verify:

- [ ] STEP 3 shows **no ❌ rows** (all checks pass)
- [ ] You have the `.env` credentials for the target environment (see §2.3)
- [ ] The spec file listed in the header actually exists on disk

If any item is unchecked, **stop here** and resolve it with the development team.

---

## Phase 2 — Set Up the Environment

### 2.1 Clone or pull the repository

If you do not have the repo locally:

```bash
git clone <repo-url>
cd playwright-regression-develop
```

If you already have it, pull the latest changes:

```bash
git pull origin main
```

### 2.2 Install dependencies

Run this from the **repo root** (the folder that contains `package.json`):

```bash
npm install
```

Expected output ends with something like `added N packages`. No errors should appear.

### 2.3 Create the `.env` file

The `.env` file holds all credentials and run-control variables. It is **never committed** to Git —
you must create it yourself from the values provided by your team.

Create a file named `.env` at the repo root (same level as `package.json`):

```
# ── Run control ──────────────────────────────────────────
TEST_EXECUTION_LOCATION=LOCAL
TAKE_SCREENSHOTS=true

# ── Saucedemo suite ──────────────────────────────────────
SAUCEDEMO_URL=https://www.saucedemo.com/
SAUCEDEMO_USERNAME=<username provided by your team>
SAUCEDEMO_PASSWORD=<password provided by your team>
```

> **Security rule:** Never share, commit, or email the `.env` file. Treat the passwords inside
> it like a bank PIN.

**Verify it is working** — open `apps/saucedemo-e2e/playwright.config.ts` and confirm the path
`../../.env` resolves to the file you just created.

---

## Phase 3 — Configure Test Data

### 3.1 Locate the CSV file

The path is in the header block of your `.md` file, for example:

```
apps/saucedemo-e2e/test-data/Login/SaucedemoLoginTest-data.csv
```

Open the file. The first row is always the header row — **do not delete it**.

### 3.2 Add the CSV row from the test plan

In STEP 2 of your `.md` file, find the **CSV row** block, for example:

```
invalid_user,invalid_password,error,Login attempt with invalid credentials
```

Append this row on a new line at the end of the CSV file. The file should look like:

```
user_id,password,expected_result,scenario_description
standard_user,secret_sauce,success,Valid login with standard_user credentials
invalid_user,invalid_password,error,Login attempt with invalid credentials
```

**Rules:**
- One row per scenario.
- The `scenario_description` column value becomes the test title in the report — make it descriptive.
- Credential values in the CSV are for documentation reference only. The spec always reads real
  credentials from `.env` at runtime.
- Do not add empty lines or trailing spaces.

### 3.3 Save and verify

Save the CSV. Open it in a text editor and confirm:
- The header row is intact.
- Your new row is complete with the correct number of comma-separated columns.
- No blank lines at the end.

---

## Phase 4 — Register the Test in TestController

Open `apps/<suite>/utils/TestController.ts` and check whether the spec file from your `.md`
header is already listed.

### Already registered (most common case)

If you see an entry like this — **no change needed**:

```ts
{
  file: 'apps/saucedemo-e2e/tests/Login/SaucedemoLoginTest.spec.ts',
  run: true,
  location: ['LOCAL', 'GITHUB'],
  sequenceOrder: 1,
  description: 'Saucedemo Login Test',
},
```

Adding a new CSV row is all that is required. The test will be discovered automatically from
the CSV on the next run.

### Not yet registered (new spec file)

If the spec file does not appear in `TestController.ts`, add an entry to the array:

```ts
{
  file: 'apps/<suite>/tests/<Feature>/<Feature>Test.spec.ts',
  run: true,
  location: ['LOCAL', 'GITHUB'],
  sequenceOrder: <next number after the last entry>,
  description: '<copy the Test Title from STEP 2 of your .md file>',
},
```

Then **sync the compiled JavaScript file** — open `apps/<suite>/utils/TestController.js` and
apply the same addition in CommonJS format:

```js
exports.testControlData = [
  // ... existing entries ...
  {
    file: 'apps/<suite>/tests/<Feature>/<Feature>Test.spec.ts',
    run: true,
    location: ['LOCAL', 'GITHUB'],
    sequenceOrder: <N>,
    description: '<description>',
  },
];
```

### Temporarily skipping a test

To skip a test without deleting it, set `run: false` in its entry. Set it back to `true` when
ready to include it again.

---

## Phase 5 — Run the Tests

### 5.1 Full suite run (recommended)

This runs every test in the `TestController` that has `run: true` and `location: ['LOCAL']`
or `['LOCAL', 'GITHUB']`, in sequence order:

```bash
npx tsc ExecuteTest.ts
node ExecuteTest.js
```

You will see console output like:

```
Test files selected to run in sequence order: [
  'apps/saucedemo-e2e/tests/Login/SaucedemoLoginTest.spec.ts',
  'apps/saucedemo-e2e/tests/Checkout/SaucedemoCheckoutTest.spec.ts'
]
Results folder: AllTestResults/HTMLReports/Results_2025-07-15_10-30-00
Running: apps/saucedemo-e2e/tests/Login/SaucedemoLoginTest.spec.ts
  ...
Running: apps/saucedemo-e2e/tests/Checkout/SaucedemoCheckoutTest.spec.ts
  ...
```

A browser window will open during the run — this is expected (`--headed` mode).

### 5.2 Single spec run (for faster iteration)

To run only the spec from your test plan:

```bash
npx playwright test "apps/saucedemo-e2e/tests/Login/SaucedemoLoginTest.spec.ts" \
  --workers=1 \
  --config=apps/saucedemo-e2e/playwright.config.ts \
  --headed
```

Replace the path with the spec file listed in your `.md` header.

### 5.3 What you will see while tests run

| Console message | Meaning |
|---|---|
| `Running: apps/.../Login/...spec.ts` | Test file started |
| `✓ Saucedemo Login - Valid login…` | Individual test passed |
| `✗ Saucedemo Login - …` | Individual test failed — do not panic; see Phase 6 |
| `Copied HTML report for SaucedemoLoginTest` | Report saved successfully |
| `Results folder: AllTestResults/…` | Where to find your results |

---

## Phase 6 — Review the Results

### 6.1 Locate the results folder

After the run, open:

```
AllTestResults/HTMLReports/Results_<timestamp>/
```

The `<timestamp>` is in the format `YYYY-MM-DD_HH-MM-SS` (local time).

Inside you will find:

```
Results_2025-07-15_10-30-00/
├── 1-SaucedemoLoginTest/
│   └── SaucedemoLoginTest.html        ← per-spec Playwright report
├── 2-SaucedemoCheckoutTest/
│   └── SaucedemoCheckoutTest.html     ← per-spec Playwright report
└── TestExecutionSummary.html          ← master dashboard
```

### 6.2 Open the master summary

Open `TestExecutionSummary.html` in any browser. It shows:
- Total tests run, passed, failed, skipped
- Per-spec breakdown with durations
- Overall pass/fail status

### 6.3 Open a per-spec report

Open the `.html` file inside any numbered sub-folder. For each test you will see:
- Pass / Fail / Skip status
- Full step-by-step console log
- Screenshots attached at each step (labelled `1-LoginPage`, `2-AfterLogin`, etc.)
- Error message and stack trace if the test failed

### 6.4 Verify against the test plan

For each scenario row you added to the CSV, cross-reference with the test plan:

| Check | Where to verify |
|---|---|
| Test appears in the report | Look for the `scenario_description` value as the test title |
| All screenshot labels present | Check the attachments panel — labels from STEP 2 of the `.md` should appear |
| Assertions passed | Green check next to the test name |
| Expected result matches | Compare the assertion outcome to STEP 2's "Expected Result" column |

### 6.5 Investigating a failure

1. Click the failing test in the HTML report.
2. Read the **error message** — it will name the failing assertion.
3. Check the **screenshot** taken just before the failure.
4. Compare the actual UI state (from the screenshot) against the expected result in the test plan.
5. Determine the failure category:

| Category | Symptoms | Action |
|---|---|---|
| **Wrong test data** | Assertion value does not match | Fix the CSV row or `.env` value |
| **Missing env var** | `process.env.VAR is undefined` | Add the variable to `.env` |
| **UI change / selector broken** | `Locator not found` or `Element not visible` | Raise with the developer — do not modify selectors yourself |
| **App defect** | UI does what the test said but result is wrong | Raise a bug with a screenshot from the report |
| **Flaky / timeout** | Passes on re-run | Re-run with `--retries=1`; if it persists, raise with the developer |

---

## Phase 7 — Report & Hand Off

### 7.1 What to deliver

At the end of a test run, provide the following to your team:

| Deliverable | Location | Notes |
|---|---|---|
| Master summary | `AllTestResults/HTMLReports/Results_<ts>/TestExecutionSummary.html` | Open in browser and take a screenshot, or share the file directly |
| Per-spec reports | `AllTestResults/HTMLReports/Results_<ts>/<N>-<SpecName>/<SpecName>.html` | Share the failing spec reports when there are failures |
| Bug reports | Your team's bug tracker | One ticket per failed test; attach the screenshot from the report |

### 7.2 Archiving results

The `AllTestResults/` folder accumulates run history. Each timestamped sub-folder is a
complete, self-contained run. Do not delete old runs until they have been reviewed and signed off.

### 7.3 CI run results (GitHub Actions)

If tests ran via GitHub Actions:
1. Go to the repository on GitHub.
2. Click **Actions** → select the workflow run.
3. Under **Artifacts**, download `html-reports.zip`.
4. Extract it and open `TestExecutionSummary.html` — same structure as a local run.
   Artifacts are retained for **60 days**.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│  TESTER QUICK REFERENCE                                         │
├──────┬──────────────────────────────────────────────────────────┤
│  1   │  Read .md — check STEP 3 for ❌ before anything else     │
│  2   │  npm install  (repo root)                                │
│  3   │  Create .env with credentials                            │
│  4   │  Add CSV row from STEP 2 of .md                          │
│  5   │  Check TestController.ts — add entry if spec is new      │
│  6   │  npx tsc ExecuteTest.ts && node ExecuteTest.js           │
│  7   │  Open AllTestResults/HTMLReports/Results_.../            │
│  8   │  Open TestExecutionSummary.html — verify all green       │
│  9   │  Share summary + raise bugs for any failures             │
└──────┴──────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `Cannot find module './apps/saucedemo-e2e/utils/TestController.js'` | `TestController.js` is out of sync | Run `npx tsc apps/saucedemo-e2e/utils/TestController.ts --outDir apps/saucedemo-e2e/utils` |
| `Error reading test data file` | CSV path wrong or file missing | Check the CSV path in the spec header matches the actual file location |
| `process.env.SAUCEDEMO_URL is undefined` | `.env` file missing or wrong location | Confirm `.env` exists at repo root (same level as `package.json`) |
| `No test files found for execution` | All entries in `TestController` have `run: false` | Set `run: true` for at least one entry |
| Browser opens but no login happens | Wrong `SAUCEDEMO_USERNAME` or `SAUCEDEMO_PASSWORD` in `.env` | Verify credentials with your team |
| `TypeScript error` on compile | Type mismatch after editing a file | Run `npx tsc --noEmit` to see all errors; share with the developer |
| Report is empty / placeholder HTML | Playwright crashed before generating a report | Check the terminal output for the error message; share it with the developer |
| Tests pass locally but fail on CI | Environment variable not set in GitHub workflow | Confirm all required env vars are configured as workflow inputs |

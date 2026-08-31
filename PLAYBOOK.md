# Tester Playbook — DemoQA Registration Form

A step-by-step guide to set up, run, and review the automated tests.

---

## Step 1 — Prerequisites

Confirm these are installed:

| Tool | Verify |
|---|---|
| Node.js (18+) | `node -v` |
| npm (9+) | `npm -v` |
| Git | `git --version` |

---

## Step 2 — Set Up

```bash
# Clone the repo
git clone <repo-url>
cd Demo_QA_Forms_Agentic

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium
```

Create a `.env` file at the repo root:

```dotenv
TEST_EXECUTION_LOCATION=LOCAL
TAKE_SCREENSHOTS=true
DEMOQA_URL=https://demoqa.com
```

> Never commit the `.env` file — it is gitignored.

---

## Step 3 — Review the Test Plan

Test plan files are in:
```
apps/demoqa-e2e/test-planner/RegistrationForm/
+-- TC_001_ValidFullFormSubmission.md
+-- TC_002_EmptyFormSubmission.md
+-- … TC_003 through TC_020
```

Each file has:
- **Test Intent** — one-sentence goal
- **Structured Test Plan** — steps and expected results
- **Automation Readiness Check** — any blockers

---

## Step 4 — Check Test Data

CSV file location:
```
apps/demoqa-e2e/test-data/RegistrationForm/DemoQARegistrationFormTest-data.csv
```

- 20 rows — one per test case
- `scenario_description` column becomes the test title in the report
- `expected_result` controls the post-submit assertion (`success`, `error`, `close_modal`, etc.)
- Do not delete the header row

---

## Step 5 — Run the Tests

### Full orchestrated run (recommended)
```bash
npx tsc
node ExecuteTest.js
```
Runs all tests, collects reports, and generates a master summary.

### npm shortcuts
```bash
npm run test:demoqa           # headless
npm run test:demoqa:headed    # browser visible
npm run test:demoqa:ui        # interactive UI mode
npm run report                # open last report
```

### Run a single test case
```bash
npx playwright test --grep "TC_001" --headed
```

---

## Step 6 — Review Results

Results are saved to:
```
AllTestResults/HTMLReports/Results_<timestamp>/
+-- 1-DemoQARegistrationFormTest/
¦   +-- DemoQARegistrationFormTest.html   ? per-spec report
+-- TestExecutionSummary.html             ? master dashboard
```

Open `TestExecutionSummary.html` in a browser to see overall pass/fail counts.  
Open the per-spec report for screenshots, step logs, and failure details.

---

## Step 7 — Investigating Failures

| Symptom | Likely Cause | Action |
|---|---|---|
| Value mismatch in assertion | Wrong CSV data | Fix the CSV row |
| `process.env.DEMOQA_URL is undefined` | Missing `.env` | Add the variable to `.env` |
| `Locator not found` | UI changed | Raise with the developer |
| Fails 3 times then stops | Flaky / timeout | Raise with the developer |
| App result doesn't match expectation | App defect | Raise a bug with the screenshot |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module TestController.js` | Run `npx tsc` |
| `Error reading test data file` | Check CSV path exists |
| `No test files found for execution` | Set `run: true` in `TestController.ts` |
| `TypeScript error` on compile | Run `npx tsc --noEmit` to see all errors |
| Report is empty | Check terminal for crash message |

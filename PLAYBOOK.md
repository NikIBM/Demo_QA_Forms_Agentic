# Tester Playbook — DemoQA Student Registration Form

> **Who this is for:** Any tester who needs to run the automated tests for the DemoQA
> Student Registration Form and produce a results report.
> Follow every phase in order. Do not skip steps.

---

## Table of Contents

1. [Phase 0 — Prerequisites](#phase-0--prerequisites)
2. [Phase 1 — Understand the Project Structure](#phase-1--understand-the-project-structure)
3. [Phase 2 — Set Up the Environment](#phase-2--set-up-the-environment)
4. [Phase 3 — Review the Test Plan](#phase-3--review-the-test-plan)
5. [Phase 4 — Configure Test Data](#phase-4--configure-test-data)
6. [Phase 5 — Register the Test in TestController](#phase-5--register-the-test-in-testcontroller)
7. [Phase 6 — Run the Tests](#phase-6--run-the-tests)
8. [Phase 7 — Review the Results](#phase-7--review-the-results)
9. [Phase 8 — Report & Hand Off](#phase-8--report--hand-off)
10. [Quick Reference Card](#quick-reference-card)
11. [Troubleshooting](#troubleshooting)

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

## Phase 1 — Understand the Project Structure

```
Demo_QA_Forms_Agentic/
├── apps/
│   └── demoqa-e2e/                         ← The DemoQA test suite
│       ├── pages/
│       │   ├── Common/
│       │   │   └── base.page.ts            ← Base page object (shared helpers)
│       │   └── RegistrationForm/
│       │       └── DemoQARegistrationForm.page.ts  ← Registration Form page object
│       ├── test-data/
│       │   └── RegistrationForm/
│       │       ├── DemoQARegistrationFormTest-data.csv  ← All 20 test cases' data
│       │       └── assets/
│       │           ├── image.jpg           ← Upload asset (TC_014)
│       │           ├── image.png           ← Upload asset (TC_015)
│       │           └── sample.mp4          ← Upload asset — invalid format (TC_016)
│       ├── test-planner/
│       │   └── RegistrationForm/
│       │       ├── TC_001_ValidFullFormSubmission.md
│       │       ├── TC_002_EmptyFormSubmission.md
│       │       └── … TC_003 through TC_020
│       ├── tests/
│       │   └── RegistrationForm/
│       │       └── DemoQARegistrationFormTest.spec.ts  ← Single spec for all 20 TCs
│       └── utils/
│           ├── CommonFunctions.ts          ← Screenshot helper
│           ├── index.ts                    ← fillInputField retry helper
│           └── TestController.ts           ← Test run registry
├── playwright.config.ts                    ← Single consolidated Playwright config
├── ExecuteTest.ts                          ← Orchestrator: runs all tests in order
├── GenerateSummaryReport.ts                ← Builds TestExecutionSummary.html
├── AllTestResults/                         ← Per-run HTML reports (auto-created)
└── .env                                    ← Credentials & run-control (never committed)
```

### Key design decisions

| Decision | Detail |
|---|---|
| **Single spec file** | All 20 test cases (`TC_001`–`TC_020`) run from one spec driven by the CSV |
| **Data-driven** | Each row in the CSV becomes one Playwright `test()` — the `scenario_description` column becomes the test title |
| **Single config** | `playwright.config.ts` at the repo root is the only config file |
| **Retries** | 3 retries always (CI and local) to handle DemoQA flakiness |
| **Screenshots** | Captured at each major step; controlled by `TAKE_SCREENSHOTS` env var |

---

## Phase 2 — Set Up the Environment

### 2.1 Clone or pull the repository

If you do not have the repo locally:

```bash
git clone <repo-url>
cd Demo_QA_Forms_Agentic
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

The `.env` file holds all credentials and run-control variables. It is **never committed to Git** —
you must create it yourself at the repo root (same level as `package.json`):

```
# ── Run control ──────────────────────────────────────────
TEST_EXECUTION_LOCATION=LOCAL
TAKE_SCREENSHOTS=true

# ── DemoQA suite ─────────────────────────────────────────
DEMOQA_URL=https://demoqa.com
```

> **Security rule:** Never share, commit, or email the `.env` file.

**Variables explained:**

| Variable | Required | Description |
|---|---|---|
| `TEST_EXECUTION_LOCATION` | Yes | `LOCAL` for local runs; `GITHUB` for CI runs |
| `TAKE_SCREENSHOTS` | No | Set to `false` to disable screenshots (speeds up local runs) |
| `DEMOQA_URL` | No | Defaults to `https://demoqa.com` if not set |

---

## Phase 3 — Review the Test Plan

### 3.1 Locate the test plan files

Test plan files are located at:

```
apps/demoqa-e2e/test-planner/RegistrationForm/
├── TC_001_ValidFullFormSubmission.md
├── TC_002_EmptyFormSubmission.md
├── TC_003_SubmitWithoutFirstName.md
├── TC_004_SubmitWithoutLastName.md
├── TC_005_InvalidEmailFormat.md
├── TC_006_ExistingEmailSubmission.md
├── TC_007_GenderRadioMutualExclusion.md
├── TC_008_InvalidMobileNumber.md
├── TC_009_ExistingMobileNumber.md
├── TC_010_PastDateOfBirth.md
├── TC_011_FutureDateOfBirth.md
├── TC_012_SubjectsAutocomplete.md
├── TC_013_MultipleHobbiesSelection.md
├── TC_014_UploadJPGPicture.md
├── TC_015_UploadPNGPicture.md
├── TC_016_UploadMP4InvalidFormat.md
├── TC_017_AddressSpecialCharacters.md
├── TC_018_StateSelectionEnablesCity.md
├── TC_019_CityDisabledWithoutState.md
└── TC_020_CloseButtonDismissesModal.md
```

### 3.2 Read each plan before touching any code

Every `.md` file has three sections:

| Section | What it tells you |
|---|---|
| **STEP 1 — Test Intent** | One-sentence goal of the test |
| **STEP 2 — Structured Test Plan** | Test Case ID, preconditions, numbered steps, expected results, CSV row to add |
| **STEP 3 — Automation Readiness Check** | Whether locators and page-object methods exist; any known blockers |

### 3.3 Blockers checklist

Before running, verify for each TC:

- [ ] STEP 3 shows **no ❌ rows** (all checks pass)
- [ ] The spec file `apps/demoqa-e2e/tests/RegistrationForm/DemoQARegistrationFormTest.spec.ts` exists on disk
- [ ] The CSV row for the TC exists in `DemoQARegistrationFormTest-data.csv`

If any item is unchecked, **stop here** and resolve it with the development team.

---

## Phase 4 — Configure Test Data

### 4.1 Locate the CSV file

```
apps/demoqa-e2e/test-data/RegistrationForm/DemoQARegistrationFormTest-data.csv
```

Open the file. The **first row is always the header** — do not delete it.

### 4.2 CSV column reference

| Column | Description | Example |
|---|---|---|
| `tc_id` | Test Case ID | `TC_001` |
| `first_name` | First name (leave empty to test validation) | `John` |
| `last_name` | Last name | `Smith` |
| `email` | Email address | `john.smith@example.com` |
| `gender` | `Male`, `Female`, or `Other` | `Male` |
| `mobile` | 10-digit mobile number | `9876543210` |
| `dob_day` | Day of birth (leave empty to skip date picker) | `15` |
| `dob_month` | Month of birth | `May` |
| `dob_year` | Year of birth | `2000` |
| `subjects` | Subject name for autocomplete | `Maths` |
| `hobbies` | Pipe-separated hobbies | `Sports\|Reading` |
| `upload_file` | Relative path to asset file | `apps/demoqa-e2e/test-data/RegistrationForm/assets/image.jpg` |
| `current_address` | Address text | `120 Baker Street` |
| `state` | State name for dropdown | `NCR` |
| `city` | City name for dropdown | `Delhi` |
| `expected_result` | Controls post-submit assertion | `success` / `error` / `close_modal` / `invalid_file` / `autocomplete` / `radio_exclusion` / `state_city` / `city_only` |
| `scenario_description` | Becomes the test title in the report | `TC_001 - Valid form submission…` |

### 4.3 `expected_result` values explained

| Value | What the spec asserts |
|---|---|
| `success` | Confirmation modal appears; all submitted field values verified in modal table |
| `error` | Confirmation modal does NOT appear; red-border validation shown on relevant field(s) |
| `close_modal` | Modal appears, then Close button dismisses it |
| `invalid_file` | Uploaded `.mp4` filename is recorded in the file input (DemoQA has no MIME restriction) |
| `autocomplete` | Autocomplete dropdown is visible after typing in Subjects field |
| `radio_exclusion` | Male then Female selected — only Female remains checked |
| `state_city` | NCR selected → City dropdown becomes enabled and shows city options |
| `city_only` | City dropdown remains disabled when no State is selected |

### 4.4 Adding a new test row

To add a new test case, append a row to the CSV:

```
TC_021,Jane,Doe,jane@example.com,Female,9876543210,,,,,,,,,, success,TC_021 - <description>
```

**Rules:**
- All 17 columns must be present (empty columns are fine — just leave them blank between commas).
- The `scenario_description` value becomes the test title in the HTML report — make it descriptive.
- Do not add empty lines or trailing spaces.
- Save the file in **UTF-8** encoding.

---

## Phase 5 — Register the Test in TestController

Open `apps/demoqa-e2e/utils/TestController.ts`.

The current registration entry covers all 20 test cases:

```ts
{
  file: 'apps/demoqa-e2e/tests/RegistrationForm/DemoQARegistrationFormTest.spec.ts',
  run: true,
  location: ['LOCAL', 'GITHUB'],
  sequenceOrder: 1,
  description: 'DemoQA Student Registration Form — TC_001 to TC_020',
},
```

### Adding a new spec file (rare)

If you ever add a second spec file, append a new entry:

```ts
{
  file: 'apps/demoqa-e2e/tests/<Feature>/<Feature>Test.spec.ts',
  run: true,
  location: ['LOCAL', 'GITHUB'],
  sequenceOrder: 2,
  description: '<description>',
},
```

Then recompile the utils:

```bash
npx tsc
```

### Temporarily skipping a test

Set `run: false` on the entry to skip it without deleting it. Set it back to `true` when ready.

---

## Phase 6 — Run the Tests

### 6.1 Full orchestrated run (recommended)

Runs every spec registered in `TestController` with `run: true`, in `sequenceOrder`, collects
all reports, and generates a master summary dashboard:

```bash
npx tsc
node ExecuteTest.js
```

A Chrome browser window opens during the run — this is expected (`--headed` mode).

Console output you will see:

```
Test files selected to run in sequence order: [
  'apps/demoqa-e2e/tests/RegistrationForm/DemoQARegistrationFormTest.spec.ts'
]
Results folder: AllTestResults/HTMLReports/Results_2025-07-15_10-30-00

Running: apps/demoqa-e2e/tests/RegistrationForm/DemoQARegistrationFormTest.spec.ts
  ...
Copied HTML report for DemoQARegistrationFormTest
============================================================
[Summary report generated]
============================================================
```

### 6.2 npm script shortcuts

```bash
npm run test:demoqa           # headless run
npm run test:demoqa:headed    # headed run (browser visible)
npm run test:demoqa:ui        # Playwright UI mode (interactive)
npm run report                # open last HTML report
```

### 6.3 Single spec run (faster iteration)

```bash
npx playwright test "apps/demoqa-e2e/tests/RegistrationForm/DemoQARegistrationFormTest.spec.ts" \
  --workers=1 \
  --headed
```

### 6.4 Run a single test case by title

```bash
npx playwright test --grep "TC_001" --headed
```

### 6.5 What you will see during the run

| Console message | Meaning |
|---|---|
| `Running: apps/demoqa-e2e/tests/…spec.ts` | Test file started |
| `✓ DemoQA Registration Form - TC_001…` | Individual test passed |
| `✗ DemoQA Registration Form - TC_002…` | Individual test failed — do not panic; see Phase 7 |
| `Copied HTML report for DemoQARegistrationFormTest` | Report saved successfully |
| `Results folder: AllTestResults/…` | Where to find your results |

---

## Phase 7 — Review the Results

### 7.1 Locate the results folder

After the run, open:

```
AllTestResults/HTMLReports/Results_<YYYY-MM-DD_HH-MM-SS>/
```

Inside you will find:

```
Results_2025-07-15_10-30-00/
├── 1-DemoQARegistrationFormTest/
│   ├── DemoQARegistrationFormTest.html     ← Playwright per-spec report
│   ├── data/                               ← Trace and attachment assets
│   └── test-results.json                  ← Raw JSON results
└── TestExecutionSummary.html               ← Master dashboard
```

### 7.2 Open the master summary

Open `TestExecutionSummary.html` in any browser. It shows:
- Total tests run, passed, failed, skipped
- Per-spec breakdown with durations
- Overall pass/fail status

### 7.3 Open the per-spec Playwright report

Open `1-DemoQARegistrationFormTest/DemoQARegistrationFormTest.html`. For each test you will see:
- Pass / Fail / Skip status with duration
- Full step-by-step console log
- Screenshots attached at each step (labelled `1-FormPageLoaded`, `2-PersonalInfoFilled`, etc.)
- On failure: error message, stack trace, and the Playwright trace viewer link

### 7.4 Screenshot labels reference

| Label | What it captures |
|---|---|
| `1-FormPageLoaded` | Form page after navigation and ad removal |
| `2-PersonalInfoFilled` | After name, email, gender, mobile are entered |
| `3-DateOfBirthSet` | After date picker interaction |
| `4-SubjectAdded` | After subject tag added via autocomplete |
| `5-HobbiesSelected` | After hobby checkboxes ticked |
| `6-FileUploaded` | After file upload |
| `7-StateSelected` | After state dropdown selection |
| `8-CitySelected` | After city dropdown selection |
| `9-AllFieldsFilled` | All fields complete, before submit |
| `10-AfterSubmit` | Immediately after clicking Submit |
| `11-SuccessModalVisible` | Confirmation modal visible |
| `12-ModalFieldsVerified` | After all modal field assertions |

### 7.5 Investigating a failure

1. Click the failing test name in the HTML report.
2. Read the **error message** — it names the failing assertion and the locator.
3. Check the **screenshot** taken just before the failure.
4. Determine the failure category:

| Category | Symptoms | Action |
|---|---|---|
| **Wrong test data** | Value mismatch in assertion | Fix the CSV row |
| **Missing env var** | `process.env.DEMOQA_URL is undefined` | Add the variable to `.env` |
| **UI change / selector broken** | `Locator not found` or `Element not visible` | Raise with the developer — do not modify selectors yourself |
| **App defect** | UI behaves correctly per test but result is wrong | Raise a bug with the screenshot from the report |
| **Flaky / timeout** | Passes on re-run | Test retries 3 times automatically; if it still fails, raise with the developer |
| **Known blocker** | TC_011 (future DoB), TC_016 (MP4 upload) | These are documented proxy assertions — check the `.md` plan for context |

---

## Phase 8 — Report & Hand Off

### 8.1 What to deliver

| Deliverable | Location | Notes |
|---|---|---|
| Master summary | `AllTestResults/HTMLReports/Results_<ts>/TestExecutionSummary.html` | Open in browser and screenshot, or share the file directly |
| Per-spec report | `AllTestResults/HTMLReports/Results_<ts>/1-DemoQARegistrationFormTest/DemoQARegistrationFormTest.html` | Share when there are failures |
| Bug reports | Your team's bug tracker | One ticket per failed test; attach the screenshot from the report |

### 8.2 Archiving results

The `AllTestResults/` folder accumulates run history. Each timestamped sub-folder is a
complete, self-contained run. Do not delete old runs until they have been reviewed and signed off.

### 8.3 CI run results (GitHub Actions)

If tests ran via GitHub Actions:
1. Go to the repository on GitHub.
2. Click **Actions** → select the workflow run.
3. Under **Artifacts**, download `html-reports.zip`.
4. Extract it and open `TestExecutionSummary.html` — same structure as a local run.
   Artifacts are retained for **60 days**.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────┐
│  DEMOQA TESTER QUICK REFERENCE                                      │
├──────┬──────────────────────────────────────────────────────────────┤
│  1   │  npm install  (repo root)                                    │
│  2   │  Create .env with DEMOQA_URL and TEST_EXECUTION_LOCATION     │
│  3   │  Review test plan .md in apps/demoqa-e2e/test-planner/       │
│  4   │  Confirm CSV row exists in DemoQARegistrationFormTest-data.csv│
│  5   │  Check TestController.ts — run: true for the spec            │
│  6   │  npx tsc && node ExecuteTest.js                              │
│  7   │  Open AllTestResults/HTMLReports/Results_.../                │
│  8   │  Open TestExecutionSummary.html — verify all green           │
│  9   │  Share summary + raise bugs for any failures                 │
└──────┴──────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `Cannot find module './apps/demoqa-e2e/utils/TestController.js'` | `TestController.js` is out of sync | Run `npx tsc` from the repo root |
| `Error reading test data file` | CSV path wrong or file missing | Confirm `apps/demoqa-e2e/test-data/RegistrationForm/DemoQARegistrationFormTest-data.csv` exists |
| `process.env.DEMOQA_URL is undefined` | `.env` file missing or wrong location | Confirm `.env` exists at repo root (same level as `package.json`) |
| `No test files found for execution` | All entries in `TestController` have `run: false` | Set `run: true` for the registration form entry |
| Browser opens but form is not interacted with | Wrong `DEMOQA_URL` in `.env` | Verify URL resolves to `https://demoqa.com/automation-practice-form` |
| `TypeScript error` on compile | Type mismatch after editing a file | Run `npx tsc --noEmit` to see all errors; share with the developer |
| Report is empty / placeholder HTML | Playwright crashed before generating a report | Check the terminal output for the error message; share it with the developer |
| Tests pass locally but fail on CI | Environment variable not set in GitHub workflow | Confirm `DEMOQA_URL` and `TEST_EXECUTION_LOCATION` are set as workflow env vars |
| TC_011 always fails | DemoQA allows future DoB — known app behaviour | This is a documented blocker in `TC_011_FutureDateOfBirth.md`; treat as a known issue |
| TC_016 always passes unexpectedly | DemoQA has no MIME restriction on file upload | This is a documented blocker in `TC_016_UploadMP4InvalidFormat.md`; proxy assertion only |

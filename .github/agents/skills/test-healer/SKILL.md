---
name: test-healer
description: Use when a Playwright test is failing, broken, flaky, or producing errors — to diagnose the root cause and apply a minimal, safe fix without changing test intent or hiding real product defects.
---

# Playwright Test Healer

Follow these steps in order to diagnose and repair a failing test.

## Step 0 — Load Framework Instructions

Read `agents/instructions/framework-overview.md` using `read_file` before touching any code.
Understand which app suite the failing test belongs to and how its page objects are structured.

## Step 1 — Gather Failure Information

Use `ask_followup_question` if the user has not provided:
- The failing test file path.
- The error message or stack trace.
- Whether the failure is consistent or flaky.
- Any recent changes to the application under test.

If the user provides a stack trace inline, proceed without asking.

## Step 2 — Read the Failing Test

Use `read_file` to read:
1. The failing `.spec.ts` file.
2. The referenced page object file(s) (`.page.ts`).
3. The CSV test-data file used by the spec.

Identify exactly which assertion or action is failing.

## Step 3 — Classify the Failure

Classify the root cause into **exactly one** category:

| # | Category | When to use |
|---|---|---|
| 1 | **Selector drift** | Element locator no longer matches the DOM |
| 2 | **Timing / async flake** | Race condition, element not yet visible/enabled |
| 3 | **Assertion mismatch** | Expected value differs from actual (e.g. text changed) |
| 4 | **Test data issue** | CSV or env var missing/wrong |
| 5 | **Environment / config issue** | Wrong baseURL, timeout too low, wrong env var |
| 6 | **Product behavior change** | App genuinely changed — test intent may be wrong |
| 7 | **Unknown / ambiguous** | Cannot determine from available info |

**Only categories 1, 2, 4, and 5 may proceed to auto-repair.**
Categories 3, 6, and 7 require human review. For those, explain the finding and stop.

## Step 4 — Propose a Minimal Repair

Design the smallest possible change that fixes the failure without altering test intent.

**Allowed repairs:**
1. Locator rewrite (prefer `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText` → `data-testid` → CSS).
2. Adjust `expect(...).toBeVisible({ timeout: N })` if timeout is genuinely too low.
3. Fix wrong env var name or CSV column name.
4. Fix `baseURL` in `playwright.config.ts` if it points to wrong environment.

**Disallowed repairs:**
- Changing test flow or step order.
- Removing or weakening assertions.
- Adding `page.waitForTimeout()` / `addTimeout()` sleeps.
- Increasing retry count beyond what's in the config.
- Masking failures with try/catch.

Explain the proposed change and why it preserves test intent before applying it.

## Step 5 — Apply the Fix

Use `apply_diff` (never `write_file` for existing files) to make the minimal change.
Only edit the files that require changes — page object OR spec file, not both unless necessary.

## Step 6 — Verify

Run the repaired test using `execute_command`:

```
npx playwright test "<spec-file>" --workers=1 --config=apps/<suite>/playwright.config.ts
```

If it passes, report success. If it still fails, re-classify and repeat from Step 3.

## Step 7 — Report

Provide a structured repair summary:

```
Failure classification: <category name>
Root cause: <1–2 sentences>
Files changed: <list>
Change summary: <what was changed and why>
Test intent preserved: YES / NO (explain if NO)
```

If the test cannot be safely repaired without human judgment, say so clearly and explain what
the human needs to investigate (e.g., check if the UI element was removed, verify the expected
business behavior, update test data).

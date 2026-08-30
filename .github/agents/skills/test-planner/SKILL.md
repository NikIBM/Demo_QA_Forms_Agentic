---
name: test-planner
description: Use when the user wants to create a test plan, plan test scenarios, or analyse a feature to determine what should be tested — producing a structured, automation-ready plan that can later be fed into the test-generator skill.
---

# Playwright Test Planner

Follow these steps to produce a structured, automation-ready test plan.

## Step 0 — Load Framework Instructions

Read `agents/instructions/framework-overview.md` using `read_file`.
Understand the app suite structure so the plan uses correct naming conventions.

## Step 1 — Gather Input

Use `ask_followup_question` to collect:
- **Feature / page name** — what UI area is being planned?
- **Application suite** — which `apps/<suite>/` does it belong to?
- **User stories or acceptance criteria** — what must the feature do?
- **Known edge cases** — error states, empty data, permission boundaries?
- **Existing tests** — read `apps/<suite>/utils/TestController.ts` to avoid duplication.

## Step 2 — Identify Test Scenarios

Produce a list of scenarios covering:
1. **Happy path** — standard successful flow.
2. **Negative paths** — invalid inputs, wrong credentials, unauthorized access.
3. **Boundary / edge cases** — empty fields, maximum length, special characters.
4. **State-dependent flows** — post-login, post-create, multi-step workflows.

Each scenario must have:
- A unique, human-readable `scenario_description` (this becomes the test title and CSV row).
- Preconditions (what must be true before the test starts).
- Numbered steps (UI-observable actions only).
- Expected result for each step (what the user sees).
- Postconditions if any.

## Step 3 — Identify Required Files

Map each scenario to the framework artifacts that will need to be created:

| Artifact | Path |
|---|---|
| Page Object | `apps/<suite>/pages/<Feature>/<Feature>.page.ts` |
| Test Data CSV | `apps/<suite>/test-data/<Feature>/<Feature>Test-data.csv` |
| Spec File | `apps/<suite>/tests/<Feature>/<Feature>Test.spec.ts` |
| TestController entry | `apps/<suite>/utils/TestController.ts` |
| New env vars | `.env` |

## Step 4 — Write the Test Plan

Output a structured Markdown test plan using this template for each scenario:

```markdown
### Scenario <N>: <scenario_description>

**Preconditions:**
- <list>

**Steps:**
1. <UI action> → Expected: <what user sees>
2. <UI action> → Expected: <what user sees>

**Postconditions:** <or "None">
```

Use `write_file` to save the plan to `apps/<suite>/test-planner/<Feature>/<NN>_<ScenarioName>.md`
where `NN` is a two-digit sequence number and `ScenarioName` is the snake-case scenario name.
The `test-planner/` folder lives inside the app suite and is gitignored — files are local only.
Read `apps/<suite>/test-planner/README.md` for the naming convention and full format.

## Step 5 — Automation Readiness Check

Review each scenario and flag any that have:
- Ambiguous steps (not clear which UI element to interact with).
- Missing expected results.
- Non-deterministic behavior (random IDs, time-dependent logic).
- Dependencies not stated in preconditions.

For flagged items, describe what information is needed before automation can proceed.

## Step 6 — Handoff Summary

Present a summary:
- Total scenarios planned.
- Scenarios ready for automation vs. needing clarification.
- Estimated new files needed.
- Next step: "Run the `test-generator` skill to implement these scenarios."

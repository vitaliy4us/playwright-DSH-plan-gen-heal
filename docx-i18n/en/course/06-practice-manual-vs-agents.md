# Lesson 6. Practice: the full loop and the "manual vs agents" comparison

> **Why this lesson.** Five lessons ago we started with theory, and now we have **two sets of artifacts** in hand, produced in two different ways on one and the same GreenKart application. This is a rare opportunity to compare the approaches not in words but in facts: how many scenarios, how many tests, which defects were found, and where each path is stronger.
>
> **Sources:** our own project `playwright-DSH-plan-gen-heal` — the files `specs/`, `tests/`, `Test Cases/`, `Bug Reports/`, `SESSION-NOTES.md`; lessons 1–5 of this course.

---

## 1. What we have in hand

Two paths, one application:

| | Path A: "by hand" | Path B: with agents |
|---|---|---|
| How it was run | a human drives every step, the assistant executes commands | the planner / generator / healer roles work to their own instructions; the human sets the goal and accepts the result |
| Plan | `specs/greenkart.plan.md` — **12 scenarios in 5 groups** | `specs/cart-edge-cases.plan.md` — **6 scenarios in 1 group** |
| Manual test cases | `Test Cases/` — 12 cases, 4-column tables | not produced (the agents do not create them) |
| Tests | `tests/{search,cart,promo,checkout,offers}/` — **13 tests** | `tests/cart-edge-cases/` — **7 tests** |
| Run result | 13/13 green | 18 passed + 2 skipped out of 20 |
| Defects | found through failures and fixed along the way | **two written-up defect reports** (`Bug Reports/`) |

Both paths went through the same **Plan → Generate → Heal** loop. The difference is who was driving.

---

## 2. What the manual path looked like

The pattern: the human decides what to test → asks for a plan → plans the tests by hand (including the manual test cases) → runs them → investigates and fixes on failure.

What the experience showed:

- **Plus:** full understanding of every step. Every decision is deliberate, nothing "arrived from a black box".
- **Plus:** manual test cases appeared (`Test Cases/`) — the agents do not produce them at all, yet they are needed for real work with a team.
- **Minus:** slow. The six failures in the first run were investigated one by one, by hand.
- **Minus:** coverage depends on the author's imagination. Whatever did not occur to them is not in the plan.

A telling example: three of the six failures were not bugs but **wrong assumptions about the application**:

| Failure | What it actually turned out to be |
|---|---|
| `toContainText('₹ 120')` does not pass | the `₹` symbol is inserted via CSS `::before` and is absent from the DOM text |
| `getByText(/No\. of Items : 1/)` not found | the totals are split across elements with multiple spaces |
| The test fails on the redirect after "Proceed" | the confirmation screen lives longer than 5 s, `timeout: 15000` is needed |

This is exactly how the manual path works: **the application teaches you through failures**.

---

## 3. What the agent path looked like

The pattern from lesson 2, step by step — with the real tool calls:

| Step | What it did | Tools |
|---|---|---|
| 1. Planning | researched the application and wrote the plan | `planner_setup_page` (brings up the seed), `browser_*` for research, `planner_save_plan` |
| 2. Generation | for each scenario: executed the steps live and wrote the test | `generator_setup_page`, `browser_click`/`browser_evaluate`, `generator_read_log`, `generator_write_test` |
| 3. Healing | ran, investigated the failures, patched | `test_run`, `test_debug` (pause + inspection), `edit` |

What the agents brought that the manual plan did not have:

- the `Items` counter in the header counts **unique products**, not the total quantity;
- adding a product again **increases the quantity in the existing row** rather than adding a second one;
- the cart lives in `localStorage` (`app_data_info`, `app_data_qty`, `app_data_tamt`);
- the cart markup is present in the DOM **even when the cart is closed** (`display: none`);
- with an empty cart there is no validation: the whole checkout path can be walked to the end.

And two genuine defects that turned up precisely in the edge cases:

1. **BUG-1** — the cart is lost on reload within ~1 s of a change (measured: the write to `localStorage` lags by ~1009 ms).
2. **BUG-2** — an order can be placed with an empty cart.

Note: **BUG-1 was not found "by lucky chance" but because the agent honestly executed the "reload the page" step.** The manual plan simply did not contain that step.

---

## 4. An honest comparison

| Criterion | By hand | With agents |
|---|---|---|
| Coverage completeness | depends on the author's imagination | the agent systematically adds negative and edge-case scenarios |
| Speed of the first pass | slow (every step by hand) | fast: 6 plan scenarios in a single pass |
| Understanding of the result | maximal | requires review: the plan and the tests have to be read |
| Test quality | consistent, but with wrong assumptions | consistent in format; the quality of the checks depends on the plan |
| Manual test cases | **done by a human** | the agents do not do them |
| Finding defects | through failures | through exploring edge cases + failures |
| Context cost | lower (no tool schemas) | higher (MCP schemas on every request) |
| Repeatability | depends on the human | high: the instructions and the format are fixed |

The main conclusion worth taking away from the course:

> **The agent is responsible for completeness and discipline, the human for meaning.** The agent will generate exactly what is written in the plan — including what is written wrongly. A green test suite does not mean a correct test suite.

This is not an abstraction. We have a concrete example: the scenario "zero totals on the cart page" was formulated as a **description of a state** ("`.totAmt` equals zero") rather than as a **requirement** ("an empty cart cannot be checked out"). The test came out green and almost useless. It took a separate exercise to notice this and add the requirement scenario 1.7.

---

## 5. What the agents do well and where they cannot be trusted

**Good:**

- they systematically add negative and edge-case scenarios;
- they follow the format (one test per file, `describe` = the group, step comments, the `// spec:` / `// seed:` header);
- they execute the steps live and take locators from the real page rather than inventing them;
- they patch failures carefully, and `test.fixme()` with a description is a legitimate outcome;
- they do not get tired: 87 tools and 20 tests are no problem for them.

**Cannot be trusted:**

- **the meaning of the wording** — "zero totals" instead of a requirement goes unnoticed;
- **completeness without review** — the agent will check what you wrote and will not think up the business requirements for you;
- **the decision "is this a bug or is the test wrong"** — formally it may pick the convenient option (we corrected exactly such a fork: a timeout instead of forcing a fit, `fixme` instead of green at any cost);
- **the absence of product requirements** — where a PRD is needed, no agent can replace it.

---

## 6. The recipe: the full loop in DSH

A practical runbook — what we actually did.

**Preparation (once):**

1. Playwright 1.56+: `npm install -D @playwright/test@latest`.
2. Seed and fixtures: `tests/seed.spec.ts` + `tests/fixtures.ts` — the entry point into the application.
3. The MCP server in the DSH profile: the `mcp-playwright-test` entry with a mandatory `cwd` pointing at the project.
4. The roles as skills: `.agents/skills/playwright-test-{planner,generator,healer}/SKILL.md`.

**The loop:**

1. **Plan.** Prompt: load the planner skill, research the application, save the plan to `specs/<name>.md`. Specify the seed.
2. **Plan review** (mandatory!). Check against the checklist in section 7. A weak spot is cheaper to fix in markdown than in code.
3. **Generation.** One scenario at a time: the generator skill + the plan file. Get the tests in `tests/<group>/`.
4. **Run.** `test_run`. The failures — one at a time.
5. **Healing.** The healer skill: `test_run` → `test_debug` (pause) → inspection (`browser_snapshot`, console, network, `browser_generate_locator`) → a minimal patch → a repeated run.
6. **The fork on a failure:** an application defect → `test.fixme()` + a defect report; a wrong assumption in the test → a test fix. A test must not be bent to fit the bug.
7. **Artifacts.** Commit the plan, the tests, the reports. Update the project notes.

**Context savings:** every step of the loop is a **separate session**. The plan leaves `specs/*.md` behind, the generator leaves `tests/*.spec.ts`; the handover happens through files, not through chat history.

---

## 7. Plan quality checklist

This is the most valuable thing worth taking away from the course. Check the agent's plan against these points **before** generation:

- [ ] **The expectations are formulated as requirements, not as a description of the current behaviour.** Bad: "the counter equals zero". Good: "an order cannot be placed with an empty cart".
- [ ] **There are negative scenarios** (invalid data, empty states, repeated actions).
- [ ] **There are edge cases** (value boundaries, repeated addition, deleting the last item).
- [ ] **Every step is unambiguous** — another person can execute it without asking the author.
- [ ] **A seed is specified** for every group.
- [ ] **The scenarios are independent** and run in any order.
- [ ] **The starting state is described** (usually — clean).
- [ ] **There are no "filler" scenarios** that check the fact of rendering instead of behaviour.
- [ ] **The names of the groups and scenarios** are suitable for `describe` and for file names.
- [ ] **It states what counts as success and what counts as a failure.**

---

## 8. Checklist for accepting tests from an agent

- [ ] `describe` matches the plan group, the title matches the scenario name.
- [ ] The file header contains `// spec:` and `// seed:`.
- [ ] One test per file; the file name is kebab-case.
- [ ] Before every step there is a comment with the text of the step (without duplicates).
- [ ] The locators are role-based or by proven classes; there are no fragile CSS chains or `nth-child`.
- [ ] There are no forbidden expectations: `waitForTimeout`, `waitForLoadState`, `waitForNavigation`, `page.evaluate` in the checks.
- [ ] The assertions check **user-facing** behaviour rather than internal state.
- [ ] The specifics of the application are taken into account (see section 9).
- [ ] The test is green, and if it is red there is an explanation of why that is correct.

---

## 9. Our pitfalls: what to check in this application

Compiled from the results of both paths — this is a ready-made list of "what to look at first".

| Symptom | Cause | The right way |
|---|---|---|
| `toContainText('₹ 120')` does not pass | the `₹` is inserted via CSS `::before` and is not in the DOM text | check the numeric parts or the classes `.quantity` / `.amount` |
| The text "No. of Items : 1" is not found | the totals are split across elements with multiple spaces | use the classes `.totAmt`, `.discountPerc`, `.discountAmt` |
| The cart assertion passes "blindly" | the cart markup is in the DOM even when the cart is closed (`display: none`) | click the "Cart" link first, then check visibility |
| The test fails on the redirect after the order | the confirmation screen lasts longer than 5 s | `toHaveURL(/#\/$/, { timeout: 15000 })` |
| The `Items` counter "does not add up" with the quantity | it counts **unique products**, not the sum of the quantities | assert `Price` for the total, `Items` for the number of line items |
| The cart-persistence test is flaky | the write to `localStorage` lags by ~1 s | an application defect: `test.fixme()` + a defect report (BUG-1) |
| Console errors at every step | `favicon.ico` produces `ERR_TOO_MANY_REDIRECTS` | this is noise, not an application error |

---

## 10. Capstone exercise

Walk the loop **entirely on your own** on a new area — without hints from the lessons:

1. **Choose an area** that is not in our plans. For example: the application's behaviour on reload during order placement, or the Top Deals tab when navigating back, or the behaviour of search when special characters are typed.
2. **Draw up a plan** with the planner (the `playwright-test-planner` skill), save it to `specs/`.
3. **Review it against the checklist** from section 7. Find at least one place where the plan describes a state instead of a requirement, and **reformulate it**.
4. **Generate the tests** one scenario at a time.
5. **Run them** and investigate the failures with the healer, one at a time.
6. **Write up the result:** if a defect turns up — a defect report in `Bug Reports/`; if it is a wrong assumption — a test fix with an explanation.
7. **Assess yourself:** how long each step took, how many of the failures were "genuine defects" and how many were your own wrong assumptions.

The criterion of success for the capstone is not "all the tests are green" but **the ability to explain every decision**: why this locator, why this timeout, why `fixme` here and a fix there.

---

## 11. Self-check questions

1. Why did the agent loop find defects that were not in the manual plan?
2. What from the manual path do the agents not do at all?
3. How do you tell an "application defect" from a "wrong assumption in the test"? Give an example from ours.
4. Why does a weak plan produce a green but useless test?
5. Why run every step of the loop in a separate session?
6. What has to go into a defect report so that it is not sent back for rework?

---

## 12. Course summary

| Lesson | Topic | Main idea |
|---|---|---|
| 1 | Introduction to Test Agents | three agents and the loop; `model:` is a platform attribute |
| 2 | Agents in DeepSeek Harness | an agent = a skill + an MCP server; DSH reads `.agents/skills` |
| 3 | Under the hood | three layers; the roles are delimited by the tools issued; best practices come from the log |
| 4 | Playwright CLI | the economics of context; snapshot → ref → command; test debugging via `--debug=cli` |
| 5 | Playwright MCP | core vs capabilities; why the three tools were "not found" |
| 6 | Practice | the agent is responsible for completeness, the human for meaning; review checklists |

**What to do next.** The course is over, but the material is alive: update the agent definitions when you update Playwright, keep `SESSION-NOTES.md`, and write up the defects you find as reports. And remember the main skill — **plan review**: it is cheaper than any code fix, and it is precisely what distinguishes a tester who uses agents from a tester who trusts them.

---

## Course sources

- [Agents | Playwright](https://playwright.dev/docs/test-agents) — Test Agents.
- [Playwright v1.56: From MCP to Playwright Agents](https://youtu.be/_AifxZGxwuk) — an overview video.
- [Playwright Testing Agents: under the hood](https://youtu.be/HLegcP8qxVY) — a deep dive.
- [Playwright CLI](https://playwright.dev/agent-cli/introduction) — working from the command line.
- [Playwright MCP](https://playwright.dev/mcp/introduction) — the base layer.
- The `playwright-DSH-plan-gen-heal` project: `specs/`, `tests/`, `Test Cases/`, `Bug Reports/`, `SESSION-NOTES.md`.

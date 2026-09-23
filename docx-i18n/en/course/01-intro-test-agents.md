# Lesson 1. Playwright Test Agents: from MCP to the agent loop

> **Lesson sources**
> - Video: [Playwright v1.56: From MCP to Playwright Agents](https://youtu.be/_AifxZGxwuk) — the official Playwright channel, 5:58, published 06.10.2025
> - Documentation: [playwright.dev/docs/test-agents](https://playwright.dev/docs/test-agents)
> - Additional: the documentation source `docs/src/test-agents-js.md` from the microsoft/playwright repository

**Environment requirements:** Playwright 1.56+, and for VS Code version 1.105 (released 09.10.2025) or newer. For Claude Code / Codex / OpenCode — the corresponding `init-agents` mode.

> 💡 **Important for this course.** Your working environment is **DeepSeek Harness (DSH)**, not Claude Code and not GitHub Copilot. Playwright agents do work in DSH, but they are connected **in a different way**: the instructions and the MCP server are configured using DSH's own facilities. That is why Lesson 1 presents the theory from the official sources (which mention Claude/Copilot), while the practical adaptation for DSH is placed in a separate [Lesson 2. Playwright Agents in DeepSeek Harness](02-agents-in-dsh.md).

---

## 0. What you will be able to do after this lesson

1. Explain the difference between "MCP automation" and the Playwright "agent loop".
2. Understand why three agents are needed and how they hand work to each other.
3. Know which artefacts remain in the repository after each step.
4. Understand why the seed test is the foundation of the whole cycle.
5. Run the whole cycle in your project deliberately, rather than "by luck".

---

## 1. The main idea: what changed in Playwright 1.56

Before 1.56 we had **Playwright MCP** — a server that gives an AI agent "hands" in the browser: open a page, click, type text, take a snapshot. That is powerful, but the MCP mode has a fundamental property: **the result of the work lives exactly as long as the conversation does**. The agent clicked, answered, and all of it vanished into the chat history. No durable artefact appeared in the repository.

Starting with 1.56, Playwright ships **three Test Agents out of the box** — and they work not "in the chat", but **in the repository**:

| | Playwright MCP | Playwright Test Agents |
|---|---|---|
| What it does | explores and clicks on your command | goes through the cycle and **creates files** |
| What remains afterwards | text in the chat | `specs/*.md` + `tests/*.spec.ts` |
| Can it be re-run | no, the prompt has to be repeated | yes, these are ordinary Playwright tests |
| Who drives the process | the human drives the agent | the human sets the goal, the agents drive the cycle |
| The role of the AI | "an assistant with a browser" | "an engineer who leaves artefacts behind" |

A key phrase from the documentation: the agents **can be used independently, sequentially, or as links in a single agent loop**. It is sequential use that gives the product test coverage.

### The agent loop

```
   ┌──────────────────────────────────────────────────────────────┐
   │                                                              │
   ▼                                                              │
🎭 planner ──► specs/*.md ──► 🎭 generator ──► tests/*.spec.ts ──► 🎭 healer
(explores       (a plan         (writes tests     (runs them
 the app)        for humans)     in the browser)  and heals)
```

Read it like this: **the planner explores** the application and writes a human-readable plan → **the generator** turns the plan into executable tests → **the healer** runs them and repairs the failures. The dashed arrow back is the heal iteration: until the test passes (or until the healer decides that the functionality itself is broken).

---

## 2. Three agents in one minute

| Agent | What it does | Input | Output |
|---|---|---|---|
| 🎭 **planner** | explores the application and draws up a test plan | a clear request (for example, "draw up a plan for guest checkout"), a **seed test**, optionally a PRD | a Markdown plan in `specs/basic-operations.md` |
| 🎭 **generator** | turns the plan into executable tests, **verifying selectors and assertions live** | the Markdown plan from `specs/` | a test suite in `tests/` |
| 🎭 **healer** | runs the suite and automatically repairs failing tests | the name of the failing test | a passing test **or** `test.fixme()` if, in the healer's judgement, the functionality itself is broken |

Note the asymmetry of the inputs: the planner needs the **environment context** (the seed), the generator needs the **plan**, and the healer needs the **fact of a failure**. That is the division of labour: exploration → production → repair.

---

## 3. Installation: `init-agents`

The agents are added to a project with a single command. It lays out the **agent definitions** in the repository:

```bash
# choose your loop
npx playwright init-agents --loop=vscode     # VS Code / GitHub Copilot
npx playwright init-agents --loop=claude     # Claude Code (subagents)
npx playwright init-agents --loop=codex      # Codex
npx playwright init-agents --loop=opencode   # OpenCode
```

Before that, it is worth updating Playwright itself:

```bash
npm install -D @playwright/test@latest
```

> ⚠️ **A rule that is easy to forget:** the agent definitions must be **regenerated after every Playwright update** — that is how new tools and new instructions are picked up. The definitions are supplied by Playwright, not by you.

### What an "agent definition" actually is

From the documentation: *"agent definitions are collections of instructions and MCP tools"* — that is, it is **a markdown file with instructions + a list of MCP tools** that the agent is allowed to use. Each agent is not "magic", but a prompt instruction plus a limited set of tools.

Look at the planner definition from your project (`.github/agents/playwright-test-planner.agent.md`):

```yaml
---
name: playwright-test-planner
description: Use this agent when you need to create comprehensive test plan for a web application or website
tools:
  - search
  - playwright-test/browser_navigate
  - playwright-test/browser_click
  - playwright-test/browser_snapshot
  # ... more browser tools ...
  - playwright-test/planner_setup_page
  - playwright-test/planner_save_plan
model: Claude Sonnet 4.6
mcp-servers:
  playwright-test:
    type: stdio
    command: npx
    args: [playwright, run-test-mcp-server]
---
```

Three conclusions from this file:

1. **MCP is still inside.** The agents do not abolish MCP — they use it. It is just that the MCP server is now started not "by hand", but as part of the agent definition: `npx playwright run-test-mcp-server`.
2. **The tools are limited by role.** The planner does not have `test_run` — it does not run tests, it explores. The healer does not have `planner_save_plan` — it does not write plans, it repairs. This is a protection against the roles "creeping".
3. **There are specialised tools.** `planner_setup_page` / `planner_save_plan` for the planner, `generator_setup_page` / `generator_read_log` / `generator_write_test` for the generator, `test_run` / `test_debug` for the healer. It is these that turn "chatter with the browser" into a pipeline with artefacts.

### About the line `model: Claude Sonnet 4.6` — an important clarification

You noticed `model: Claude Sonnet 4.6` in the agent definition and rightly asked what Claude has to do with it if you have no Claude Code subscription. Let us look at the Playwright sources (`lib/agents/generateAgents.js`) — and the picture is this:

| Loop (`--loop`) | What ends up in the definition file |
|---|---|
| `copilot` / `vscode` | `model: Claude Sonnet 4.6` — **hard-coded in the Playwright generator**, not taken from the agent specification |
| `claude` | `model:` is taken from the agent's internal specification (the same value) |
| `codex` | **there is no `model` field at all** — the host chooses the model |
| `opencode` | **there is no `model` field at all** — the host chooses the model |

The conclusion that settles the question: **`model:` is an attribute of a particular target platform, not part of the agent's logic.** It exists precisely for those tools that can choose a model "per agent" (GitHub Copilot / Claude Code). Codex and OpenCode do not write it, because with them the model is set by the host. The same is true in DSH: the model is set by **DSH settings**, not by the agent file, so the line `model: Claude Sonnet 4.6` in `.github/agents/*.agent.md` is **inert** for you — you can ignore it (but do not delete it by hand: the files are regenerated by the `init-agents` command).

What really carries over to any environment, including DSH:

1. the **text of the agent's instructions** (who it is and how it works);
2. the **list of MCP tools** it is allowed;
3. **the MCP server itself** — `npx playwright run-test-mcp-server`;
4. the artefact conventions: `specs/` + `tests/` + `seed.spec.ts`.

It is exactly these four things that need to be "transplanted" into DSH. How — in [Lesson 2](02-agents-in-dsh.md).

---

## 4. The seed test — the foundation of the whole cycle (video, 0:52)

The planner needs someone to **bring the application into a working state**: log in, raise the fixtures, set the project dependencies. That role is played by the **seed test** (`tests/seed.spec.ts`).

```ts
// tests/seed.spec.ts
import { test, expect } from './fixtures';

test('seed', async ({ page }) => {
  // this test uses custom fixtures from ./fixtures
});
```

What is important to understand here:

- **The seed is an ordinary Playwright test.** The planner *runs* it: that is how the global setup, the project dependencies, all the fixtures and hooks are executed. In other words, the seed brings the environment into the state from which all scenarios start.
- **The seed is also a template.** The planner uses it as an example of what the generated tests should look like (imports, fixtures, style).
- **The seed gets into the context through the prompt.** The documentation specifically emphasises: `seed.spec.ts` is pointed out in the prompt to the agent — either as a file in the context or by mentioning the file name.

In your project `tests/seed.spec.ts` already exists — and it was exactly the entry point when you went through the cycle by hand. And `tests/fixtures.ts` next to it is that same custom fixture that opens the application so that every scenario does not start with `page.goto`.

**Mnemonic:** seed = "the front door into the application". Everything that needs to be done before the first step of a scenario lives there, and not in every test.

---

## 5. 🎭 Planner — explores and writes the plan (video, 2:15)

### Input
- a clear request, for example: *"Generate a plan for guest checkout"*;
- the seed test (essential by its meaning — it sets the environment context);
- optionally: a product document (PRD) for context.

### What it does under the hood

According to the agent definition, its work is split into five phases:

1. **Navigate and Explore** — call `planner_setup_page` once, then explore the interface through `browser_*`. Take screenshots only when absolutely necessary (a snapshot is more informative and cheaper).
2. **Analyze User Flows** — build a map of the main user scenarios and critical paths.
3. **Design Comprehensive Scenarios** — cover the happy path, **edge cases** and **error handling**.
4. **Structure Test Plans** — every scenario must have: a title, step-by-step instructions, expected results, **an assumption about the initial state (always assume that the application is in a clean/initial state)**, success criteria.
5. **Create Documentation** — save the plan with the `planner_save_plan` tool.

Plus quality standards: the steps must be so specific that any tester could perform them; **negative** scenarios must be included; the scenarios must be independent and runnable in any order.

### Output: `specs/basic-operations.md`

The plan is **human-readable, yet precise enough for test generation**. An example from the documentation (TodoMVC):

```markdown
# TodoMVC Application - Basic Operations Test Plan

## Application Overview

The TodoMVC application is a React-based todo list manager ... Key features include:
- **Task Management**: Add, edit, complete, and delete individual todos
- **Bulk Operations**: Mark all todos as complete/incomplete and clear all completed todos
- **Filtering System**: View todos by All, Active, or Completed status with URL routing support
- **Real-time Counter**: Display of active (incomplete) todo count
...

## Test Scenarios

### 1. Adding New Todos

**Seed:** `tests/seed.spec.ts`

#### 1.1 Add Valid Todo

**Steps:**
1. Click in the "What needs to be done?" input field
2. Type "Buy groceries"
3. Press Enter key

**Expected Results:**
- Todo appears in the list with unchecked checkbox
- Counter shows "1 item left"
- Input field is cleared and ready for next entry
- Todo list controls become visible (Mark all as complete checkbox)
```

Notice the structure — it is exactly the same as the one you used in `specs/greenkart.plan.md`:

- a **group** (`### 1. Adding New Todos`) → will become `test.describe(...)`;
- a **scenario** (`#### 1.1 Add Valid Todo`) → will become `test(...)`;
- **Steps** → will become actions with comments in the code;
- **Expected Results** → will become `expect(...)`;
- **Seed** — a reference to the common entry point.

This is no coincidence: the plan format is designed so that the generator can mechanically follow "step → call → assertion".

---

## 6. 🎭 Generator — turns the plan into tests (video, 3:11)

### Input
The Markdown plan from `specs/` — the file is passed into the context (or mentioned by name in the prompt).

### How it works (this is the most interesting part)

The generator **does not write code "from memory"**. Its cycle for each step of a scenario is:

1. `generator_setup_page` — set up the page for the scenario.
2. For each step and verification: **perform the action live** through the browser tools, using **the step text as the intent** (`browser_click`, `browser_type`, `browser_verify_*`).
3. `generator_read_log` — retrieve the log of what actually worked.
4. `generator_write_test` — immediately write the test source **from that log**.

From this follow two things that explain the quality of the result:

- **Selectors are born from the live page, not from the model's imagination.** If an element was found live, it will be found in the test too.
- **The documentation warns outright:** generated tests may contain initial errors — the healer cures them. This is a normal, expected stage of the pipeline, not a sign of breakage.

The documentation also mentions that Playwright supports **generation hints** and provides a **catalogue of assertions** — so that structural and behavioural checks are effective. The tools `browser_verify_element_visible`, `browser_verify_list_visible`, `browser_verify_text_visible`, `browser_verify_value` in the generator definition come from exactly that set: the agent verifies a fact BEFORE turning it into an `expect`.

### Formatting rules (strict, from the agent definition)

- **one test per file**;
- the file name is an "fs-friendly" name of the scenario (kebab-case);
- the test must lie in a `describe` **matching the top-level element of the plan**;
- **the test title = the scenario name** from the plan;
- before each step — **a comment with the step text** from the plan (do not duplicate it if a step requires several actions);
- use the best practices from the log.

### Output: `tests/add-valid-todo.spec.ts`

```ts
// spec: specs/basic-operations.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';

test.describe('Adding New Todos', () => {
  test('Add Valid Todo', async ({ page }) => {
    // 1. Click in the "What needs to be done?" input field
    const todoInput = page.getByRole('textbox', { name: 'What needs to be done?' });
    await todoInput.click();

    // 2. Type "Buy groceries"
    await todoInput.fill('Buy groceries');

    // 3. Press Enter key
    await todoInput.press('Enter');

    // Expected Results:
    // - Todo appears in the list with unchecked checkbox
    await expect(page.getByText('Buy groceries')).toBeVisible();
    const todoCheckbox = page.getByRole('checkbox', { name: 'Toggle Todo' });
    await expect(todoCheckbox).toBeVisible();
    await expect(todoCheckbox).not.toBeChecked();

    // - Counter shows "1 item left"
    await expect(page.getByText('1 item left')).toBeVisible();

    // - Input field is cleared and ready for next entry
    await expect(todoInput).toHaveValue('');
    await expect(todoInput).toBeFocused();

    // - Todo list controls become visible (Mark all as complete checkbox)
    await expect(page.getByRole('checkbox', { name: '❯Mark all as complete' })).toBeVisible();
  });
});
```

**Go through this file line by line — it is the reference.** You can see: a header with the `// spec:` and `// seed:` references, one test, `describe` = the plan group, comments = the steps and expectations, locators — role-based (`getByRole`) rather than CSS hacks. It is exactly this skeleton that you reproduced by hand in `tests/search/`, `tests/cart/` and the other folders of your project.

---

## 7. 🎭 Healer — repairs failing tests (video, 4:16)

When a test fails, the healer performs four steps (from the documentation):

1. **Replays the failing steps** — reproduces the failing steps.
2. **Inspects the current UI** — inspects the current interface looking for equivalent elements or flows.
3. **Suggests a patch** — suggests a patch: updating a locator, adjusting a wait, correcting data.
4. **Re-runs the test** — re-runs the test until it passes **or until the loop is stopped by guardrails**.

### The workflow according to the agent definition

1. `test_run` — run the whole suite and find the failing tests;
2. `test_debug` — start debugging for each failure;
3. while paused on the error — study the details, take a page snapshot, analyse the selectors, timings, assertions;
4. **Root Cause Analysis** — determine the root cause: changed selectors, synchronisation problems, data/environment dependencies, changes in the application that broke the test's assumptions;
5. **Code Remediation** — fix the code: update the selectors, correct the assertions and expected values, improve reliability; for fundamentally dynamic data use regular expressions;
6. **Verification** — re-run the test after every fix;
7. **Iteration** — repeat until the test passes cleanly.

Principles: fix **one** failure at a time, document the line of reasoning, prefer a reliable solution to a "quick hack", and — importantly — if the error does not go away while confidence that the test is correct stays high, mark the test as `test.fixme()`.

### Input and output

- **Input:** the name of the failing test.
- **Output:** a passing test **or** a skipped test, if the healer believes that the functionality itself is broken.

That last one is the most valuable thing in the design. The healer has **the right to say "the application is broken"**, rather than to "bend the test to the bug". A healer that always achieves green is not a healer but a generator of false-positive results.

### How it looked in your case (a real case)

When you went through the cycle by hand on GreenKart, the failures were of exactly the "healer" kind:

| Failure | Root cause | Patch |
|---|---|---|
| `toContainText('₹ 120')` does not pass | the `₹` symbol is inserted by CSS (`::before`), it is not present in the DOM text | check the `.quantity` / `.amount` classes |
| `getByText(/No\. of Items : 1/)` not found | the totals are split across elements with multiple spaces | assertions on the `.totAmt`, `.discountAmt`, `.promoInfo` classes |
| After "Proceed" the test fails on the redirect | the confirmation screen lives >5 s, then auto-redirects to `#/` | an assertion on the confirmation text + `toHaveURL(/#\/$/, { timeout: 15000 })` |

Every time you did exactly what the healer does: reproduced, inspected the UI, found the root cause, patched, re-ran. The only difference is that now an agent can do it — **but the decisions still require your head at review time**.

---

## 8. Artefacts and conventions (video, 4:39)

The structure that the cycle creates and maintains (from the documentation):

```bash
repo/
  .github/                    # agent definitions
  specs/                      # human-readable test plans
    basic-operations.md
  tests/                      # generated Playwright tests
    seed.spec.ts              # seed test for environment
    tests/create/add-valid-todo.spec.ts
  playwright.config.ts
```

| Artefact | Who creates it | Why | Maintenance rule |
|---|---|---|---|
| `.github/agents/*.md` | `init-agents` | agent definitions = instructions + MCP tools | regenerate on a Playwright update |
| `specs/*.md` | planner | the plan: steps, expectations, data; starts from the seed | human-readable but precise; edited by a human |
| `tests/seed.spec.ts` | a human | a ready `page` context for loading the environment | the entry point for all scenarios |
| `tests/**/*.spec.ts` | generator (+ healer) | executable tests, one to one with the scenarios | one test per file, `describe` = the plan group |
| `playwright.config.ts` | a human | the run configuration | not touched by the agents |

A key thought from the documentation: the plans **can be started from scratch or extended from the seed test**, and the tests are aligned **one to one with the specs where possible**. This unambiguous "scenario ↔ file" binding later allows the healer to repair one test surgically, without touching the others.

---

## 9. The end-to-end scenario in full

This is what the correct sequence looks like (compare it with the chapters of the video):

```bash
# 1. Update Playwright and lay out the agent definitions
npm install -D @playwright/test@latest
npx playwright init-agents --loop=vscode        # or claude / codex / opencode
```

2. **Prepare the seed** — `tests/seed.spec.ts` + `tests/fixtures.ts` (0:52).
3. **Call the planner**: in the prompt — the goal + the seed file. Get `specs/*.md` (2:15).
4. **Call the generator**: in the prompt — the plan file. Get `tests/**/*.spec.ts` (3:11).
5. **Run the tests**, and hand the failed ones to the healer by name (4:16).
6. **Check and review** the result: the plan, the tests, the report (4:39).

Step 6 must not be skipped: the agents leave artefacts behind, but **responsibility for their quality is yours**. The plan may be shallow, the test may check the wrong thing, the healer may "repair" a test to match the changed (but incorrect) behaviour of the application.

> 🔧 **An option for DSH.** Steps 1, 3, 4 and 5 look different in DSH: the agent definitions are not taken from `.github/agents/`, but arranged as **DSH skills**; the `playwright-test` MCP server is connected by a line in the DSH profile config, rather than through `.vscode/mcp.json`. Detailed step-by-step setup — in [Lesson 2](02-agents-in-dsh.md).

---

## 10. Pitfalls

1. **Forgetting to regenerate the definitions.** Updated Playwright — re-run `init-agents`, otherwise the agents work with the old tools.
2. **No seed — no cycle.** Without the seed test the planner will not be able to bring the application into the required state and will explore the "wrong" application.
3. **One test per file is not bureaucracy.** It is a contract with the healer: one failure = one file = one fix.
4. **The group descriptions and scenario names must match the plan word for word.** It is by these strings that the generator links the plan and the code.
5. **Do not let the healer "bend" a test to a bug.** If the functionality is broken, the correct outcome is `test.fixme()` and a defect report, not a green test.
6. **An old VS Code version** — the agent experience will not work: 1.105+ is required (for VS Code).
7. **Plans must be read.** The Markdown plan is the only place where you can catch a mistake cheaply before it turns into code.

---

## 11. Practice on your project (`playwright-DSH-plan-gen-heal`)

You have already gone through the cycle by hand on GreenKart — now run it with the agents and compare the results.

**Exercise 1. Compare the plans.**
Open `specs/greenkart.plan.md` and run the planner on the same application
(https://rahulshettyacademy.com/seleniumPractise/#/). Compare: what did the agent find that is not in your plan? Which of your scenarios did it miss? Most likely it will add negative cases (empty search, invalid data) — check that.

**Exercise 2. Compare the tests.**
Take one group (for example, `Shopping Cart`) and generate tests with the agent. Compare with your files from `tests/cart/`: which locators did the generator choose, and did it add `expect` where you had forgotten them.

**Exercise 3. Break it and heal it.**
Deliberately corrupt a locator in one test (for example, replace `.totAmt` with `.totAmt-old`) and give the test to the healer. Record: did it find the cause, was the patch minimal, did it break the neighbouring tests.

---

## 12. Self-check questions

1. How does the result of an agent's work differ fundamentally from the result of an MCP server's work?
2. Why does the planner **run** the seed test rather than merely read it?
3. What exactly does the generator take from the live browser that it could not take "from its head"?
4. In which case is the healer's correct output a skipped test rather than a green one?
5. Why must the agent definitions be regenerated when Playwright is updated?
6. What will happen to the "plan ↔ test" binding if you rename a scenario in the plan and do not regenerate the test?

---

## 13. Cheat sheet

```bash
# Updating Playwright before regenerating the definitions
npm install -D @playwright/test@latest

# Initialising the agents — the full list of supported loops
npx playwright init-agents --loop=vscode          # = copilot: .github/agents/*.agent.md + .vscode/mcp.json
npx playwright init-agents --loop=vscode-legacy   # the old variant: .github/chatmodes/*.chatmode.md
npx playwright init-agents --loop=claude          # .claude/agents/*.md + .mcp.json
npx playwright init-agents --loop=codex           # .codex/agents/*.toml
npx playwright init-agents --loop=opencode        # .opencode/prompts/*.md + opencode.json
npx playwright init-agents --loop=copilot         # a synonym for vscode

# Installing the Playwright skills (playwright-cli, playwright-component-testing, playwright-trace)
npx playwright init-skills --loop=claude          # → .claude/skills/<skill>/
npx playwright init-skills --loop=agents          # → .agents/skills/<skill>/  ← DSH reads this path
```

| Role | Signature tool | Artefact |
|---|---|---|
| planner | `planner_setup_page`, `planner_save_plan` | `specs/*.md` |
| generator | `generator_setup_page`, `generator_read_log`, `generator_write_test` | `tests/**/*.spec.ts` |
| healer | `test_list`, `test_run`, `test_debug` | a test fix or `test.fixme()` |

---

## 14. What next

- **[Lesson 2. Playwright Agents in DeepSeek Harness](02-agents-in-dsh.md)** — a practical adaptation of the whole cycle to your environment: connecting the MCP server, arranging the three roles as skills, and what from `init-agents` does not work in DSH.
- **A deep dive** (promised in the video description): [How Playwright Agents work](https://youtu.be/HLegcP8qxVY) — material for lesson 3.
- **[Playwright Agent CLI](https://playwright.dev/agent-cli/introduction)** — working with the agents from the command line.
- **[Playwright MCP](https://playwright.dev/mcp/introduction)** — the base layer that the agents use inside.

---

## Sources

- Video: [Playwright v1.56: From MCP to Playwright Agents](https://youtu.be/_AifxZGxwuk) (the Playwright channel, 5:58, 06.10.2025). Chapters: 0:00 Intro to Playwright Agents · 0:52 Setting up with a seed file · 2:15 Planner Agent – generating a test plan · 3:11 Generator Agent – creating test files · 4:16 Healer Agent – fixing failing tests · 4:39 Running and reviewing everything.
- Documentation: [Agents | Playwright](https://playwright.dev/docs/test-agents).
- The documentation source: [`docs/src/test-agents-js.md`](https://github.com/microsoft/playwright/blob/main/docs/src/test-agents-js.md).
- The agent definitions in your project: `.github/agents/playwright-test-{planner,generator,healer}.agent.md`.

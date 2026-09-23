# Lesson 3. How the agents work inside (under the hood)

> **Why this lesson.** In lessons 1–2 we used the three agents as a black box: we asked — and got a plan, tests, a fix. Now let us take this box apart into three layers and look at what it is assembled from. This removes the main fear ("what is going on in there at all?") and explains why the agents behave exactly the way they do.
>
> **Sources**
> - Video: [Playwright Testing Agents: under the hood](https://youtu.be/HLegcP8qxVY) — the Playwright channel, 32:10, published 09.10.2025. Chapters: 0:00 updating VS Code and Playwright · 1:49 setting up and understanding the agents · 3:54 seed files · 7:49 plan generation · 13:47 test generation · 22:56 healing failing tests · 31:30 summary.
> - Documentation: [Agents | Playwright](https://playwright.dev/docs/test-agents).
> - **The Playwright sources in your project** — the main source of this lesson:
>   `node_modules/playwright/lib/agents/*.agent.md` (definitions), `*.prompt.md` (prompts), `lib/mcp/test/testContext.js` and `testBackend.js` (the test MCP server).
> - Live experience: the Cart Edge Cases cycle that we have just run.

---

## 1. Three layers: what lives where

An agent is not a single file, but **three independent layers** that meet at the moment of launch:

| Layer | File / process | What it contains | Who the author is | Does it live on after a Playwright update? |
|---|---|---|---|---|
| **1. Definition** | `.github/agents/playwright-test-*.agent.md` | frontmatter (the tool set, the model) + the role instructions | Playwright, installed by `init-agents` | ❌ regenerated, edits are lost |
| **2. Prompt** | `.github/prompts/*.prompt.md` | 6–9 lines: the task and pointers to files | Playwright, installed with the `--prompts` flag | ❌ regenerated |
| **3. MCP server** | the `playwright run-test-mcp-server` process | 87 tools and **the run log** | Playwright, started on the fly | ✅ versioned together with the package |

A simple analogy: the **definition** is an employee's job description, the **prompt** is a work order, and the **MCP server** is their working tool and the log of what has been done. The employee reads the instruction once, receives the order, and works with a tool that keeps a protocol.

---

## 2. Layer 1: the agent definitions

Each definition is a markdown file with YAML frontmatter. The frontmatter here is not decoration: **it is what sets the role's policy**.

### The planner

```yaml
tools:
  - search
  - playwright-test/browser_navigate
  - playwright-test/browser_click
  - playwright-test/browser_snapshot
  # ... more browser tools ...
  - playwright-test/planner_setup_page
  - playwright-test/planner_save_plan
```

The body is five phases of work (Navigate and Explore → Analyze User Flows → Design Comprehensive Scenarios → Structure Test Plans → Create Documentation) and quality standards: the steps are so specific that any tester could perform them; negative scenarios are mandatory; the scenarios are independent and runnable in any order; the initial state is always assumed to be clean.

**A key observation: the planner has neither `edit` nor `test_run`.** It physically cannot write a test or run a suite. Its only write channel is `planner_save_plan`. The role is limited not by a request in the prompt, but by the list of tools granted.

### The generator

```yaml
tools:
  - search
  - playwright-test/browser_click
  - playwright-test/browser_verify_element_visible
  - playwright-test/browser_verify_text_visible
  - playwright-test/browser_verify_value
  # ...
  - playwright-test/generator_setup_page
  - playwright-test/generator_read_log
  - playwright-test/generator_write_test
```

The core of the instructions (verbatim from the file):

> - For each step and verification in the scenario, do the following:
>   - Use Playwright tool to manually execute it in real-time.
>   - Use the step description as the intent for each Playwright tool call.
> - Retrieve generator log via `generator_read_log`
> - Immediately after reading the test log, invoke `generator_write_test` with the generated source code

And the formatting rules: **one test per file**, the file name is an fs-friendly name of the scenario, `describe` matches the top-level element of the plan, the test title matches the scenario name, before each step — a comment with its text (do not duplicate it for several actions), "always use best practices from the log".

The generator also has **no `edit`**: it can write code only through `generator_write_test`. But it does have `browser_verify_*` — the tools with which it confirms facts **before** turning them into an `expect`.

### The healer

```yaml
tools:
  - search
  - edit
  - playwright-test/browser_console_messages
  - playwright-test/browser_evaluate
  - playwright-test/browser_generate_locator
  - playwright-test/browser_network_request
  - playwright-test/browser_snapshot
  - playwright-test/test_debug
  - playwright-test/test_list
  - playwright-test/test_run
```

Note the asymmetry: **the healer has `edit`, but no `browser_click` or `browser_type`.** It does not "click around the application by hand" — it reproduces the scenario through `test_debug` (that is, by running the test itself) and inspects the state in parallel: snapshot, console, network, the current locator. And it edits the code — the only one of the three who is allowed to do so.

The last line of its instructions is about prohibitions: *"Never wait for networkidle or use other discouraged or deprecated apis"*.

### Conclusion on the layer

| Role | Reads the UI | Writes code | Runs tests | What it writes the result with |
|---|---|---|---|---|
| planner | ✅ actively explores | ❌ | ❌ | `planner_save_plan` |
| generator | ✅ performs the steps live | ❌ (only through its own tool) | ❌ | `generator_write_test` |
| healer | ✅ inspection only | ✅ `edit` | ✅ `test_run` / `test_debug` | `edit` (a test fix) |

**The roles are delimited by the granting of tools, not by persuasion in the prompt.** This is precisely "security by construction": the planner will not break the tests, because it cannot touch them.

---

## 3. Layer 2: the prompts — they are comically small

Here are **verbatim** all three prompts from `node_modules/playwright/lib/agents/`:

```markdown
<!-- playwright-test-plan.prompt.md -->
---
agent: playwright-test-planner
description: Create test plan
---

Create test plan for "add to cart" functionality of my app.

- Seed file: `${seedFile}`
- Test plan: `specs/coverage.plan.md`
```

```markdown
<!-- playwright-test-generate.prompt.md -->
---
agent: playwright-test-generator
description: Generate test plan
---

Generate tests for the test plan's bullet 1.1 Add item to card.

Test plan: `specs/coverage.plan.md`
```

```markdown
<!-- playwright-test-heal.prompt.md -->
---
agent: playwright-test-healer
description: Fix tests
---

Run all my tests and fix the failing ones.
```

Three or four lines per task. Why so few?

- **The instructions are already in the definition.** The prompt must not repeat the role — it passes only the **work order**: what to do and where the files lie.
- **The `agent:` frontmatter** binds the prompt to a specific agent — in essence, it is a call to the required role.
- **`${seedFile}` is a substitution.** During `init-agents`, Playwright replaces such placeholders with real paths (in the code — `loadPrompt`, which substitutes `${key}`). That is why the prompt always points at the project's current seed file.

### The orchestrator: a prompt that launches the whole loop

The most interesting one is the fourth file, `playwright-test-coverage.prompt.md`. It is **a ready-made agent loop in a single prompt**:

```markdown
1. Call #playwright-test-planner subagent with prompt:
   <plan>
     <task-text><!-- the task --></task-text>
     <seed-file><!-- path to seed file --></seed-file>
     <plan-file><!-- path to test plan file to generate --></plan-file>
   </plan>

2. For each test case from the test plan file (1.1, 1.2, ...), one after another,
   not in parallel, call #playwright-test-generator subagent with prompt:
   <generate>
     <test-suite><!-- Verbatim name of the test spec group w/o ordinal --></test-suite>
     <test-name><!-- Name of the test case without the ordinal --></test-name>
     <test-file><!-- Name of the file to save the test into --></test-file>
     <seed-file><!-- Seed file path from test plan --></seed-file>
     <body><!-- Test case content including steps and expectations --></body>
   </generate>

3. Call #playwright-test-healer subagent with prompt:
   <heal>Run all tests and fix the failing ones one after another.</heal>
```

Three things worth noticing here:

1. **The loop is simply a sequence of subagent calls.** No hidden magic: planner → generator for EACH item of the plan → healer.
2. **"one after another, not in parallel"** — generation is deliberately sequential. The reason is practical: each generator works with a live page, and parallel runs would get in each other's way.
3. **Names and paths are passed verbatim** (`Verbatim name of the test spec group w/o ordinal`) — that is exactly why the rules "`describe` = the plan group" and "title = the scenario name" are so important: it is by these strings that the loop links the plan items to the files.

---

## 4. Layer 3: the test MCP server

This is the `npx playwright run-test-mcp-server` process (a hidden CLI command, which Playwright writes into all its configs). In our installation it serves **87 tools**. They are conveniently divided into groups:

| Group | Examples | What for |
|---|---|---|
| General browser | `browser_click`, `browser_type`, `browser_navigate`, `browser_snapshot`, `browser_fill_form` | exploration and performing steps |
| Verifications | `browser_verify_element_visible`, `browser_verify_text_visible`, `browser_verify_list_visible`, `browser_verify_value` | confirm a fact before turning it into an `expect` |
| Locators | `browser_generate_locator` | pick the current locator for an element |
| Planner | `planner_setup_page`, `planner_save_plan`, `planner_submit_plan` | raise the seed environment and save the plan |
| Generator | `generator_setup_page`, `generator_read_log`, `generator_write_test` | perform the steps, retrieve the log, write the test |
| Tests | `test_list`, `test_run`, `test_debug` | find, run and debug tests |
| Observability | `browser_console_messages`, `browser_network_requests`, tracing, video | diagnostics |

Two subtleties that are visible only in the tools:

- **`planner_submit_plan` versus `planner_save_plan`.** The first accepts the plan **as a structure** (`overview` + `suites` with steps and expectations), the second writes a markdown file. That is, the plan first goes through a structured form, and only then becomes a document. That is exactly why the agents' plans are so even in format — they are assembled by a tool, not "written by the model as text".
- **`intent` on every call.** In the server code there is a list `typesWithIntent = ["action", "assertion", "input"]` — every tool call is marked with an intent (`action`, `assertion`, `input`), and this intent ends up in the log. Remember, our calls had an `intent` parameter? That is exactly the mechanism: the log stores not "a click on element e42" but "step 1: add the product to the cart".

---

## 5. The generator log — the main document of the cycle

`generator_read_log` returns not a "history of clicks" but **a ready-made outline for writing the test**:

1. **the plan** — the one passed to `generator_setup_page`;
2. **the seed file** — verbatim, as a model for imports and style;
3. **the steps** — every performed call with its code;
4. **best practices** — a fixed block of rules.

Here is that block **verbatim** (from `node_modules/playwright/lib/mcp/test/testContext.js`):

```
# Best practices
- Do not improvise, do not add directives that were not asked for
- Use clear, descriptive assertions to validate the expected behavior
- Use reliable locators from this log
- Use local variables for locators that are used multiple times
- Use Playwright waiting assertions and best practices from this log
- NEVER! use page.waitForLoadState()
- NEVER! use page.waitForNavigation()
- NEVER! use page.waitForTimeout()
- NEVER! use page.evaluate()
```

This is **not an agent instruction but part of the server's response** — that is, the rule arrives together with the data. A neat solution: even if the agent definition becomes outdated or is rewritten, the log will still bring the current restrictions.

Why the prohibitions are exactly these:

- `waitForLoadState` / `waitForNavigation` / `waitForTimeout` — "sleeping" waits: they make tests slow and flaky, whereas Playwright's auto-waiting waits for the required condition by itself;
- `page.evaluate` — the temptation to climb inside the page and check internal state, instead of checking what the user sees.

Our last cycle confirmed this from the other side: I used `browser_evaluate` for **exploration** (that is exactly what the planner does), but as soon as it came to generating a test, all the checks were rewritten as ordinary `expect(...)` — because `evaluate` is forbidden in a test.

---

## 6. Why the seed is about fixtures, not about `goto`

`planner_setup_page` **runs** the seed test. This means that for the planner (and the generator) the following are executed:

- `global setup`;
- the project dependencies (`dependencies` in the config);
- all fixtures and hooks.

In our project `tests/fixtures.ts` opens the application for every test — and that is exactly why the agents received a ready page rather than an empty one. If the seed were an empty `test('seed', async () => {})`, the planner would be exploring… nothing.

**A practical conclusion:** the seed is the environment contract. Everything that needs to be done before the first step of a scenario (login, data preparation, opening the page) lives there, and the agents get it for free.

---

## 7. Cross-check against what we have already seen live

| Mechanism from this lesson | Where we saw it in the Cart Edge Cases cycle |
|---|---|
| A 3-line prompt work order | our request: "load the planner skill, explore GreenKart, save the plan to specs/..." — the same structure: role + task + paths |
| `generator_setup_page` raises the seed | "Running 1 test using 1 worker → Paused at end of test" and a live page with an empty cart |
| `intent` on every call | the `intent` parameter in our calls: "Step 1: Click ADD TO CART…" |
| The log as the source of the code | `generator_read_log` returned the plan, the seed and our steps — and the test was born from it |
| The best practices block | the same list with four `NEVER`s at the end of the log |
| Only `generator_write_test` writes the test | the file appeared exactly after that call |
| The healer edits the code, not the test logic | `test_debug` paused → `edit` of one locator line |
| `test.fixme()` as an honest outcome | the persistence test: a defect of the application, not bending to a bug |

---

## 8. Boundaries: what the agents do not do

1. **They do not understand the product.** The plan contains only what the agent saw in the interface. Requirements that are not on the screen will not get into the plan.
2. **They do not guarantee meaning.** We saw this literally: the generated persistence test failed — and it turned out that it failed for a good reason (a real defect of the application). A green suite and a correct suite are different things.
3. **They do not survive regeneration.** Edits in `.agent.md` and `.prompt.md` will disappear at the next `init-agents`. If you want your own, keep it in skills (as we did in lesson 2) or in `AGENTS.md`.
4. **They do not work without an environment.** No seed — no exploration. No `cwd` on the MCP server — no project.
5. **They are limited by the tools granted.** The planner did not "forget" to write a test — it has nothing to write one with.

---

## 9. Practice

**Exercise 1. Read your own definition.**
Open `.github/agents/playwright-test-generator.agent.md` in the project and find: (a) which verification tools it has been granted; (b) what it has not been granted, and why. Cross-check with the table from section 2.

**Exercise 2. Assemble the log by hand.**
Run the cycle on one scenario and, after `generator_read_log`, answer: what four parts does the log consist of? Which part came not from the agent but from the server?

**Exercise 3. Check the prohibitions.**
Find your own list of rules in `.agents/skills/playwright-test-generator/SKILL.md` and compare it with the best practices block from the log. What is missing in your skill? Add the missing part — and explain why the generator will receive the rules from the log anyway, even if you do not.

**Exercise 4. Find the weak spot of the plan.**
Take `specs/cart-edge-cases.plan.md` and find a scenario that the agent described formally (for example, "zero totals"). Think of how to strengthen it so that the test catches not only the zeros but also the meaning: for example, that the cart page with an empty cart must not allow an order to be placed. Compare with what has already been done in `should-allow-completing-an-order-with-an-empty-cart.spec.ts`.

---

## 10. Self-check questions

1. What three layers does an "agent" consist of, and which of them survives a Playwright update?
2. Why does the planner have no `edit` tool, and why does the healer have no `browser_click`?
3. How does `planner_submit_plan` differ from `planner_save_plan`, and why is that important for the format of the plans?
4. How does the generator know what the style of a test should be?
5. Why does the best practices block arrive in the log rather than lying in the agent definition?
6. Why, in the orchestrator prompt, does generation go "one after another, not in parallel"?
7. What exactly does the `<plan>` fragment of the prompt do: pass instructions or pointers?

---

## 11. Cheat sheet: what lies where

| What to look for | Path |
|---|---|
| Agent definitions | `.github/agents/playwright-test-*.agent.md` (after `init-agents`) |
| Prompt work orders and the orchestrator | `.github/prompts/*.prompt.md` |
| The sources of the definitions and prompts | `node_modules/playwright/lib/agents/` |
| The log logic and best practices | `node_modules/playwright/lib/mcp/test/testContext.js` |
| The `intent` categories | `node_modules/playwright/lib/mcp/test/testBackend.js` |
| Who writes what | `node_modules/playwright/lib/agents/generateAgents.js` |
| Our roles for DSH | `.agents/skills/playwright-test-{planner,generator,healer}/SKILL.md` |

---

## 12. What next

- **Lesson 4** from the course plan: **Agent CLI** — working with the agents from the command line ([playwright.dev/agent-cli](https://playwright.dev/agent-cli/introduction)).
- As a supplement to this lesson it is useful to re-read [Lesson 2](02-agents-in-dsh.md): there we transplanted these same three layers into DSH — and now it is clear what exactly was transplanted (instructions + tools + MCP server) and what remained platform-specific.

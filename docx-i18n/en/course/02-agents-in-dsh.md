# Lesson 2. Playwright Agents in DeepSeek Harness

> **Why this lesson.** In [Lesson 1](01-intro-test-agents.md) everything is presented from the official Playwright materials — and there the target platforms are named as Claude Code, GitHub Copilot, Codex and OpenCode. None of them is yours: your environment is **DeepSeek Harness (DSH)**. The model `Claude Sonnet 4.6` from the agent definition is unavailable to you and unnecessary. This lesson shows how to obtain **the same cycle** planner → generator → healer using DSH's own facilities.
>
> Sources: the files and documentation of the DSH packages in `C:\Users\vital\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh\`, your profile `C:\Users\vital\.dsh\`, the Playwright sources in `node_modules/playwright/lib/`.

---

## 1. Why you cannot simply "drop the files in as they are"

The command `npx playwright init-agents --loop=vscode` (also known as `copilot`) creates four artefacts in the project. Let us check each one: does DSH read it?

| Artefact of `init-agents` | Created for whom | Does DSH read it |
|---|---|---|
| `.github/agents/playwright-test-*.agent.md` | GitHub Copilot / VS Code | ❌ no |
| `.github/prompts/*.prompt.md` | Copilot (the `--prompts` flag) | ❌ no |
| `.vscode/mcp.json` | VS Code | ❌ no |
| `.github/workflows/copilot-setup-steps.yml` | CI for the Copilot agent | ❌ no (for DSH it is just a file) |

DSH is a self-contained harness with its own configuration. It **does not read** either `.vscode/mcp.json` or `.github/agents/`. But that does not mean the work is lost: what carries over is the **content**, not the format. Of the four files we need:

1. the text of the three agents' instructions (what lies after the frontmatter in `.agent.md`);
2. the list of allowed MCP tools (the `tools:` field);
3. the MCP server itself — the command `npx playwright run-test-mcp-server`;
4. the artefact conventions: `specs/`, `tests/`, `seed.spec.ts` — they do not depend on the platform at all.

---

## 2. Three DSH mechanisms that replace "agents"

| What is needed | DSH mechanism | Where it lives | What it is |
|---|---|---|---|
| Browser and test tools | **MCP client** | profile: `~/.dsh/profiles/web/cordis.patch.yml` | the plugin-row `@deepseek-ai/dsh-mcp-client` |
| Role instructions ("you are a planner") | **Skill** | `<project>/.agents/skills/<name>/SKILL.md` or `~/.dsh/skills/<name>/SKILL.md` | markdown with frontmatter |
| Your own assembly of an agent as a whole (tools + prompt) | **Preset** | `~/.dsh/.agent-presets/<id>/agent.cordis.yml` | a list of plugin-row (a copy of the standard one) |

Separately there is also the **model and reasoning effort**: in DSH they are set by settings (`~/.dsh/settings.yaml`) and by a choice in the GUI, not by a `model:` field in the agent definition. Your current config:

```yaml
# ~/.dsh/settings.yaml
agent-default-model:
  provider: deepseek-official
  model: deepseek-v4-flash
  reasoningEffort: max
```

**What this means in practice:** a "Playwright agent" in DSH is **a skill with a role** plus **a connected MCP server**. There is no `model: Claude Sonnet 4.6` in this scheme, and there should not be.

---

## 3. Step 1. Connect the `playwright-test` MCP server

### What you already have

Your DSH profile already has the browser Playwright MCP connected — that is exactly why in this session I have tools of the form `mcp__playwright__browser_click` available:

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml  (current contents)
- insert:
    - id: mcp-playwright
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: playwright
        transport: stdio
        command: npx.cmd
        args: ['-y', '@playwright/mcp@latest']
```

This is the **general** browser MCP (`@playwright/mcp`). It can navigate, click and take snapshots — that is, it can do everything needed for *exploration*. But it does **not** have the agents' specialised tools: `planner_save_plan`, `generator_write_test`, `test_run`, `test_debug`.

### What is missing

Those very tools are provided by a **different** server — `playwright run-test-mcp-server` (in the Playwright CLI this is a *hidden* command: it is not visible in `--help`, but it exists). It is precisely this command that Playwright writes into all its agent configs.

Add a second row to the same file:

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml
- insert:
    - id: mcp-playwright
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: playwright
        transport: stdio
        command: npx.cmd
        args: ['-y', '@playwright/mcp@latest']

    - id: mcp-playwright-test
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: playwright-test
        transport: stdio
        command: npx.cmd
        args: ['playwright', 'run-test-mcp-server']
        cwd: 'C:\Users\vital\AI\playwright-DSH-plan-gen-heal'
```

Three details that matter precisely here:

- **`cwd` is essential by its meaning.** The test server works in the context of the project: it needs `playwright.config.ts`, `specs/`, `tests/`. Without `cwd` it will start in the directory of the DSH process and will not find the project.
- **`serverName` sets the tool names.** The DSH convention is `mcp__<serverName>__<rawName>`. So you will get `mcp__playwright-test__planner_save_plan`, `mcp__playwright-test__test_run` and so on. The name must be unique and fit `[A-Za-z0-9_-]{1,32}` — `playwright-test` fits.
- **`npx.cmd`, not `npx`** — on Windows it will not start otherwise (your existing row already does this). If `npx` is being difficult on your system, there is a fallback: `command: node`, `args: ['node_modules/playwright/cli.js', 'run-test-mcp-server']` together with the same `cwd`.

An edit to the profile file is applied **without a restart**: the DSH MCP client reconnects the server as soon as the change is made (hot-swap), and the tool set is replaced entirely — without duplicates.

### How to check the result

1. After the edit, start a new session in the required project.
2. Ask: *"Which tools start with `mcp__playwright-test__`?"* — or simply ask it to draw up a plan: the agent should see `planner_setup_page` and `planner_save_plan`.
3. If the tools are not there — look at the DSH logs: an MCP connection error is written to the log (`reconnecting` / `final failure` with the number of attempts).

> ⚠️ The MCP tools are visible to the model **permanently**, while the server is connected, and their schemas are consumed on every request. In the DSH token meter this is the "Tools" item. If the server is not always needed — keep it in a separate profile or disable the row when you are not working with tests.

---

## 4. Step 2. Arrange the three roles as DSH skills

### Where DSH looks for skills

The `dsh-skill-filesystem` provider scans the roots in this order of priority:

| Rank | Source | Path |
|---|---|---|
| 100 | project-dsh | `<project>/.dsh/skills` |
| 200 | project-agents | `<project>/.agents/skills` |
| 300 | custom | set by config |
| 400 | user-dsh | `~/.dsh/skills` |
| 500 | user-agents | `~/.agents/skills` |

Where `<project>` is the nearest ancestor with `.git`.

**A pleasant coincidence:** the Playwright skill installer can write exactly into `.agents/skills` — that is the `npx playwright init-skills --loop=agents` mode (verified against the source: the path is assembled as `.<target>/skills/<skill>`). That is, Playwright and DSH already agree on one convention, `.agents/skills` — and it is logical to put your three role skills there too, next to the already installed `playwright-cli`, `playwright-component-testing`, `playwright-trace` (you already have them — they are the ones listed in the skill catalogue of the current session).

### The skill format

A skill is either a folder `<name>/SKILL.md` or a flat file `<name>.md`. The frontmatter:

```yaml
---
name: kebab-case-name         # required
description: ...              # required — it goes into the catalogue, the model uses it to decide whether the skill is needed
whenToUse: ...                # optional
disable-model-invocation: false   # optional: true — the skill is unavailable to the model
user-invocable: true              # optional: false — the skill is unavailable to the human
---
```

### Ready-made templates for the three roles

Create three folders in `<project>/.agents/skills/`. The bodies are written after the manner of the real instructions from `.github/agents/*.agent.md`, but with the tool names in the DSH format.

**`.agents/skills/playwright-test-planner/SKILL.md`**

```markdown
---
name: playwright-test-planner
description: Draws up a Markdown test plan for a web application — explores the interface with browser tools and saves the plan to specs/. Use when a test plan or full scenario coverage is needed.
whenToUse: The user asks to explore an application and draw up a test plan.
---

You are an expert in planning the testing of web applications.

Order of work:
1. Identify the seed test (usually `tests/seed.spec.ts`) and run it — that is how the
   global setup, the project dependencies and all the fixtures are executed.
2. Call `mcp__playwright-test__planner_setup_page` once, then explore the interface with the
   `mcp__playwright-test__browser_*` tools. Take screenshots only when necessary;
   a snapshot is more informative.
3. Draw up a map of the user flows and critical paths.
4. Design the scenarios: happy path, edge cases, error handling.
5. Save the plan with the `mcp__playwright-test__planner_save_plan` tool to `specs/<name>.md`.

Requirements for the plan:
- groups (`###`) and scenarios (`####`) with numbering;
- for each scenario: Steps, Expected Results, a reference to the Seed;
- the initial state is always considered clean;
- the steps are specific enough for any tester to perform them;
- negative scenarios are mandatory;
- the scenarios are independent and run in any order.

Never write tests — your artefact is the plan alone.
```

**`.agents/skills/playwright-test-generator/SKILL.md`**

```markdown
---
name: playwright-test-generator
description: Turns a Markdown plan from specs/ into executable Playwright tests, verifying selectors and assertions live in the browser. Use when there is a plan and tests are needed.
whenToUse: There is a plan in specs/, and tests need to be generated from it.
---

You are a Playwright test generator. You do NOT write code from memory: each step is first
performed live, and only then does it become code.

Order of work for each scenario in the plan:
1. `mcp__playwright-test__generator_setup_page` — set up the scenario's page.
2. For each step: perform the action with the live tools
   (`browser_click`, `browser_type`, `browser_navigate`, ...), using the step text
   as the intent. Perform the checks with `browser_verify_*`.
3. `mcp__playwright-test__generator_read_log` — retrieve the log of what actually worked.
4. Immediately `mcp__playwright-test__generator_write_test` — write the source from the log.

Formatting rules:
- one test per file, the file name is the kebab-case name of the scenario;
- `test.describe(...)` matches the top-level group from the plan;
- the test title matches the scenario name from the plan;
- in the file header — `// spec: specs/<file>.md` and `// seed: tests/seed.spec.ts`;
- before each step — a comment with the step text (do not duplicate it when there are several actions);
- locators — role-based (`getByRole`, `getByLabel`), not CSS chains;
- check dynamic data with regular expressions.

Do not "improve" the plan: if a step is unclear — say so, do not invent behaviour.
```

**`.agents/skills/playwright-test-healer/SKILL.md`**

```markdown
---
name: playwright-test-healer
description: Runs a test suite and heals the failing tests — reproduces the steps, inspects the UI, finds the root cause and patches the test. Use when Playwright tests fail.
whenToUse: Tests are failing, and the cause needs to be found and eliminated.
---

You are a Playwright test debugging engineer. Work methodically, one failure at a time.

Order of work:
1. `mcp__playwright-test__test_run` — run the suite, find the failing tests.
2. `mcp__playwright-test__test_debug` — start debugging for each failure.
3. While paused on the error: study the details, take a snapshot (`browser_snapshot`), look at
   the console and the network, find the current locator (`browser_generate_locator`).
4. Determine the root cause: a changed selector, a synchronisation problem, a dependency
   on data, a change in the application that broke the test's assumption.
5. Fix the test code — with a minimal change.
6. Re-run the test and make sure it passes.
7. Repeat until it passes cleanly.

Rules:
- fix one failure at a time;
- explain what was broken and why the fix is exactly this;
- prefer a reliable solution to a quick hack;
- Do NOT bend the test to a bug. If the functionality really is broken — mark
  the test as `test.fixme()` and report it, rather than making it green.
```

> 💬 **About the language of a skill body.** A skill body is read by the model on every load, so it consumes tokens. If you want to save, keep the bodies in English: by our measurements Russian text costs roughly 1.5–2 times more (see the section on tokenisation in lesson 1). The frontmatter is better kept readable for yourself.

---

## 5. Step 3 (optional). A preset for the "Playwright agents mode"

A **preset** in DSH is a folder `~/.dsh/.agent-presets/<id>/agent.cordis.yml` with a list of plugin-row: a complete assembly of an agent (tools + system prompt sections). Mechanically this is closest to what agent definitions are in Copilot, but much heavier.

What is important to know before going down this path:

- **Authoring by copying only.** A new preset is created by copying an existing one (through the settings service/page), and after that the composition file is edited. Creating one "from scratch" as text is not provided for.
- **A preset is chosen per session**, and it can only be switched for a session that has not done anything yet (an empty one). Changing the composition in the middle of a conversation is forbidden: the history would still contain tool calls that do not exist in the new assembly.
- **Subagents inherit the parent's preset** (`composeFrom`) rather than choosing their own. So you **cannot** hand out the three roles as "subagent types" in DSH — the role is passed by a skill or by prompt text. This is the key difference from Claude Code, where a subagent is a separate definition with its own model.

**Conclusion:** for the three Playwright roles, skills are enough (step 2). A preset is worth making only if you want to switch the whole mode on with a single toggle — for example "Playwright tests only, without the other tools".

---

## 6. What the cycle looks like in DSH: ready-made prompts

The setup is done — now the cycle itself. In DSH a role is requested by **explicitly loading a skill** in the prompt.

**The planner:**

> Load the `playwright-test-planner` skill. Explore https://rahulshettyacademy.com/seleniumPractise/#/ and draw up a test plan in `specs/greenkart-agents.plan.md`. The seed test is `tests/seed.spec.ts`. Cover product search, the cart, promo codes, order placement and Top Deals, including negative scenarios.

**The generator:**

> Load the `playwright-test-generator` skill. Take the plan `specs/greenkart-agents.plan.md` and generate tests for the "Shopping Cart" group in `tests/cart-agents/`. One test per file, `describe` — as in the plan.

**The healer:**

> Load the `playwright-test-healer` skill. Run `tests/cart-agents/`, find the failing tests and repair them. If you believe that the application's functionality is broken — mark the test `test.fixme()` and explain why.

A technique that saves context: **each step of the cycle is a separate DSH session**. The planner leaves `specs/*.md`, the generator leaves `tests/*.spec.ts`; the artefacts on disk are the handover of work. Then the exploration history is not dragged into the generation session.

---

## 7. What carries over unchanged

Everything that relates to conventions does not depend on the platform — this is the most valuable part of the official scheme:

| Artefact | Role | Still valid in DSH |
|---|---|---|
| `tests/seed.spec.ts` + `tests/fixtures.ts` | the entry point of the environment | ✅ yes, unchanged |
| `specs/*.md` — groups, scenarios, Steps, Expected Results | a plan for humans | ✅ yes, the format is the same |
| one test per file | the contract with the healer | ✅ yes |
| `describe` = the plan group, title = the scenario name | the plan ↔ test link | ✅ yes |
| the `// spec:` and `// seed:` header | traceability | ✅ yes |
| a comment with the step text before the action | readability | ✅ yes |

---

## 8. Pitfalls specific to DSH

1. **DSH ignores `.vscode/mcp.json` and `.mcp.json`.** The only point for connecting MCP is the DSH profile (`cordis.patch.yml`), with a separate plugin-row per server.
2. **Forgetting `cwd` for `playwright-test`.** The server will silently come up in the wrong directory, and the plan/test tools will not find the project.
3. **`run-test-mcp-server` is not visible in `--help`.** It is a hidden command; its absence from the help does not mean that it does not exist.
4. **A role cannot be "granted" to a subagent.** A subagent in DSH inherits the parent's composition, so a role is passed by a skill in the prompt, not by an agent type.
5. **`model:` from `.agent.md` is a dead field.** The model and reasoning effort are set in DSH (`settings.yaml` and the choice in the GUI). Do not try to "tidy up the definitions" by editing this field — the files are regenerated anyway.
6. **MCP tools consume context constantly.** Every connected server hands over the tool schemas on every request — this is visible in the token meter. Keep connected only what you need right now.
7. **After installation, skills are visible not instantly "in the head" but in the catalogue.** The body is read at the moment the skill is loaded, so edits are picked up immediately; whereas the appearance/disappearance of the skills themselves is tracked by the directory watcher.
8. **The plan and the tests are files, not chat.** If the work was done only "in the conversation", the next step of the cycle will not be able to pick it up.

---

## 9. Setup checklist

- [ ] Playwright updated to 1.56+ (`npm install -D @playwright/test@latest`).
- [ ] The project has `seed.spec.ts` and `fixtures.ts`.
- [ ] A `mcp-playwright-test` row with a `cwd` pointing at the project has been added to `~/.dsh/profiles/web/cordis.patch.yml`.
- [ ] A new DSH session sees the `mcp__playwright-test__*` tools.
- [ ] `<project>/.agents/skills/` contains three skills: `playwright-test-planner`, `playwright-test-generator`, `playwright-test-healer`.
- [ ] The skills are visible in the session's skill catalogue.
- [ ] The full cycle has been run on one scenario: plan → test → run → healing.
- [ ] The artefacts are committed (`specs/*.md`, `tests/**`).

---

## 10. Exercise

Take **one** scenario from an already prepared plan — for example `TC-2.1 should add single product to cart` — and run it through the cycle in DSH:

1. **Plan:** ask the planner to draw up a plan for the "Shopping Cart" group only and save it to `specs/cart-agents.plan.md`. Compare with your `specs/greenkart.plan.md`: what did the agent add, what did it lose.
2. **Test:** ask the generator to make tests from this plan in `tests/cart-agents/`. Compare the locators with yours from `tests/cart/`.
3. **Healing:** in one generated test, replace a locator with a deliberately wrong one (for example `.totAmt` → `.totAmt-old`) and give it to the healer. Check: is the fix minimal, did it explain the root cause, did it leave the neighbouring tests untouched.
4. **Conclusion:** write down in the project's `SESSION-NOTES.md` how the cycle under agents differs from your manual pass.

---

## 11. Lesson sources

**Internal (files of your environment):**

- `~/.dsh/profiles/web/cordis.patch.yml` — connecting MCP servers in DSH.
- `~/.dsh/settings.yaml` — the default model and reasoning effort.
- `@deepseek-ai/dsh-mcp-client` (README) — MCP configuration: `serverName`, `transport`, `command`, `args`, `cwd`, reconnection, the naming convention `mcp__<serverName>__<rawName>`.
- `@deepseek-ai/dsh-skill-filesystem` (README) — the skill search roots and the `SKILL.md` format.
- `@deepseek-ai/dsh-agent-presets` (README) — presets, their authoring and inheritance by subagents.
- `node_modules/playwright/lib/agents/generateAgents.js` — what exactly `init-agents` writes in each loop.
- `node_modules/playwright/lib/program.js` — the list of `init-agents` loops, the hidden `run-test-mcp-server` command, the `init-skills` command.

**External:** [Agents | Playwright](https://playwright.dev/docs/test-agents) · [Playwright v1.56: From MCP to Playwright Agents](https://youtu.be/_AifxZGxwuk)

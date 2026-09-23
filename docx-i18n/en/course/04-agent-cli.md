# Lesson 4. Playwright CLI: automation from the command line

> **Why this lesson.** Until now we have worked through **MCP**: the model calls tools and the server holds the browser. There is a second, fundamentally different path — **Playwright CLI** (`playwright-cli`): the agent runs **commands in the shell**, while the browser lives in a background process. Let us work out why it was invented, how it is built, and when to choose CLI and when MCP.
>
> **Sources**
> - Documentation: [Agent CLI → Introduction](https://playwright.dev/agent-cli/introduction), plus the pages [Skills](https://playwright.dev/agent-cli/skills), [Snapshots](https://playwright.dev/agent-cli/snapshots), [Test Debugging](https://playwright.dev/agent-cli/commands/test-debugging). The section has 23 pages in total.
> - **Local primary source:** the README of the `@playwright/cli` package, which is already installed in your project — `node_modules/@playwright/cli/README.md` (the complete reference of commands and configuration).
> - Practice: the `@playwright/cli` package is already present in this project, and its skill sits in `.agents/skills/playwright-cli` — we used it in lessons 1–3.

---

## 1. Why the CLI was needed: the economics of context

The official wording: *«A command-line interface for browser automation designed for coding agents. Token-efficient commands and installable skills let agents balance browser automation with large codebases and reasoning within limited context windows»*.

The meaning in one word: **context**. Compare the two ways of giving a browser to an agent:

| | MCP | CLI |
|---|---|---|
| How it works | the LLM calls tools with structured parameters | the agent runs shell commands |
| Token cost | **higher**: tool schemas + snapshots in the context | **lower**: short command output, skills are loaded on demand |
| Better for | specialised agent loops, exploratory automation | coding agents working with a large codebase |
| Default mode | headed | headless |
| Configuration | a JSON config in the MCP client | `npm install -g @playwright/cli` |

This is not theory — it shows up in our own token meter. In the current session we have **two MCP servers** connected: the browser one, `playwright`, and the test one, `playwright-test` (87 tools). Their schemas land in **every** request to the model — in DSH this is the "Tools" entry in the counter, and it is not reset between steps. The CLI works differently: the agent calls a command, gets 3–5 lines of output and a reference to a snapshot file. The model pays only for what it has actually read.

> Do not conclude from this that "CLI is better than MCP". The documentation says plainly: MCP remains appropriate where you need **long-lived state, rich introspection and iterative reasoning over the page structure** — that is, exactly our planner → generator → healer loop. The CLI is for something else: to get the work done quickly without dragging schemas behind it.

---

## 2. Installation and skills

```bash
npm install -g @playwright/cli@latest
playwright-cli --help
```

Next comes the important step that distinguishes the CLI from "just a set of commands":

```bash
playwright-cli install --skills            # layout for Claude Code (default) → .claude/skills/playwright-cli
playwright-cli install --skills=agents     # layout for .agents/skills → .agents/skills/playwright-cli
playwright-cli install --skills -g         # into the home directory (~/.claude/skills or ~/.agents/skills)
```

**This is a direct hit on your environment.** The `--skills=agents` mode puts the skill into `.agents/skills/playwright-cli` — this is **precisely the root that DSH reads** (we covered this in lesson 2: DSH scans `<project>/.agents/skills` at rank 200). That is why in your project the `playwright-cli` skill is already visible in the session skill catalogue and the agent knows how to use it. No separate "CLI integration with DSH" is required — the `.agents/skills` convention is the junction point.

### What is inside the skill

`SKILL.md` describes the command surface (basic actions, snapshots and refs, sessions, raw output, the `open`/`attach` parameters) and refers to detailed reference guides:

| Reference guide | What it covers |
|---|---|
| Running and Debugging Playwright tests | running, debugging and managing test suites |
| **Test generation** | plan / generate / heal — the same loop we did with the agents |
| Request mocking | intercepting and mocking network requests |
| Running Playwright code | executing arbitrary Playwright scripts (`run-code`) |
| Browser session management | several sessions, `attach` / `detach` |
| Storage state | cookies and localStorage: saving and restoring |
| Tracing / Video recording | traces and video, including "hero video" scenarios |
| Inspecting element attributes | attributes that are not visible in the snapshot |

### Mode without skills

Skills are not mandatory — the agent can read the help itself:

> Test the "add todo" flow on https://demo.playwright.dev/todomvc using playwright-cli. Check playwright-cli --help for available commands.

This is a workable technique: start with `--help`, and having the skill stops being a hard requirement.

---

## 3. Architecture: the daemon and sessions

Two properties explain why the CLI is fast at all:

- **The daemon.** The browser lives in a background process, so there is **no startup cost per command**. In the MCP world the server also holds the browser, but you pay with tool schemas; with the CLI you pay only with the startup time of the command itself, and that is minimal.
- **Sessions.** Different projects — different browsers:

```bash
playwright-cli list                    # list all sessions
playwright-cli -s=example open https://example.com --persistent
playwright-cli close-all               # close all browsers
playwright-cli kill-all                # force-kill the processes
```

The default browser profile is held **in memory**: cookies and storage live between commands inside a session and are lost when the browser closes. If you need durability across restarts — `--persistent` (a profile on disk) or `--profile=<path>`.

A session can be set for the agent in advance through an environment variable:

```bash
PLAYWRIGHT_CLI_SESSION=todo-app claude .
```

Launch modes: **headless** by default; to watch with your own eyes — `playwright-cli open <url> --headed`. There is device emulation (`--device="iPhone 15"`, `--mobile`), browser selection (`--browser=chrome`) and attaching to an already running browser (`attach --cdp=chrome`, `attach --extension=chrome`).

---

## 4. The working model: snapshot → ref → command

This is the core of the CLI, and it is worth going through in detail.

### Automatic snapshots

After **every** command the CLI prints the page state:

```
### Page
- Page URL: https://demo.playwright.dev/todomvc/#/
- Page Title: React - TodoMVC
### Snapshot
- [Snapshot](.playwright-cli/page-2026-02-14T19-22-42-679Z.yml)
```

The snapshot itself is an **accessibility tree** with references to elements:

```
- heading "todos" [level=1]
- textbox "What needs to be done?" [ref=e5]
- listitem:
  - checkbox "Toggle Todo" [ref=e10]
  - text: "Buy groceries"
```

### The rules of refs — remember them, they are where mistakes happen

| Property | Value |
|---|---|
| Format | the letter `e` + a number (`e5`, `e10`, `e203`) |
| Scope | unique **within a single snapshot** |
| Lifetime | valid until the next change of the page |
| Who gets one | **interactive elements only** (buttons, links, fields) |

The practical takeaway: **after navigation or any change of the page you must take the ref again**. This is exactly the same discipline as with locators in tests, and it is also the reason why in our runs I took a fresh snapshot every time.

### Snapshot on demand and search

```bash
playwright-cli snapshot                  # the whole page, a file with a timestamp
playwright-cli snapshot --filename=after.yaml
playwright-cli snapshot "#main"          # limit by a CSS selector
playwright-cli snapshot e34              # limit to a specific element
playwright-cli snapshot --depth=4        # limit the depth of the tree
playwright-cli snapshot --boxes          # add [box=x,y,width,height]
```

A technique for large pages: first a shallow snapshot (`--depth=4`), then a partial one along the branch you care about (`snapshot e34`). And if you simply need to find an element — **`find` is cheaper than taking the whole tree**:

```bash
playwright-cli find "Add to cart"                 # substring, case-insensitive
playwright-cli find --regex "\$[0-9]+\.[0-9]{2}"  # regular expression
playwright-cli find --regex "/sign (in|up)/i"     # the slashes enable the flags
```

`find` returns the matched nodes with three lines of context — like `grep -C`.

### Interaction: ref or selector

```bash
playwright-cli click e10                                   # by ref (recommended)
playwright-cli fill e5 "Walk the dog"
playwright-cli click "#main > button.submit"               # CSS
playwright-cli click "getByRole('button', { name: 'Submit' })"  # Playwright locator
playwright-cli click "getByTestId('submit-button')"
```

The official recommendation is a **ref rather than CSS**: a ref points at a specific element from the current snapshot, whereas CSS breaks when the layout is redone.

### `--raw`: output suitable for comparison

```bash
playwright-cli --raw snapshot > before.yml
playwright-cli click e5
playwright-cli --raw snapshot > after.yml
diff before.yml after.yml
```

`--raw` removes the page status, the generated code and the snapshot, leaving only the value. This makes the output **pipeable** — and gives you by hand that very "before/after" technique that assertions perform in tests.

---

## 5. The most valuable part for a tester: debugging tests from the CLI

This is where the CLI truly opens up. The scheme: the test is launched **in the background** and stays paused, keeping the browser open.

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/checkout.spec.ts --debug=cli
```

The test prints the name of the session you need to attach to:

```
### The test is currently paused at the start
### Debugging Instructions
- Run "playwright-cli attach tw-a3f19c" to attach to this test
```

```bash
playwright-cli attach tw-a3f19c
```

Then come three groups of commands:

**Inspecting the page**

| Command | What it is for |
|---|---|
| `playwright-cli snapshot` | the current state |
| `playwright-cli find "Place order"` | find a single element on a large page |
| `playwright-cli console error` | errors in the console |
| `playwright-cli requests --filter="/api/"` | network requests |
| `playwright-cli eval "() => document.title"` | an arbitrary expression |
| `playwright-cli screenshot --filename=debug-state.png` | a screenshot |

**Controlling execution**

| Command | What it does |
|---|---|
| `resume` | continue execution |
| `step-over` | execute the next test call |
| `pause-at <file>:<line>` | run up to the given place and pause there |

Since the test is paused at the very beginning, **`pause-at` is the fastest way in**: you jump straight to the suspicious line:

```bash
playwright-cli pause-at checkout.spec.ts:42
playwright-cli step-over
playwright-cli resume
```

**Reading the generated code.** Officially: *«Every playwright-cli action prints the equivalent Playwright TypeScript. That is the fix you paste back into the test — most of the time a locator or an expectation needs updating, but it can also be a genuine bug in the app.»*

This is the key idea of the lesson. The CLI does not merely help you look — it **produces code** that you can paste into the test. And the same source says what we have already felt on our own loop: sometimes the correct conclusion is "this is a real bug in the application" rather than a test fix. That is exactly how it turned out for us with BUG-1.

### A ready-made workflow for investigating a flake

The official scenario (paraphrased):

1. launch the failing test in the background with `--debug=cli`;
2. attach via `attach`;
3. start recording a trace (`tracing-start`);
4. run up to the suspicious line (`pause-at`), take a snapshot, look at the console and the requests;
5. at the broken step — a screenshot and a targeted `eval`;
6. stop the trace, shut down the background run, restart the test and confirm the fix.

**How this relates to the healer.** In lesson 3 we saw that the healer has `test_debug` — it does the same thing (runs the test, pauses, inspects the state, patches the code). The CLI is **the same loop, but by hand**: not an agent, but you driving the execution. This is useful in two cases: (a) when you need to work it out yourself rather than watch an agent's report; (b) when MCP is unavailable but you need a browser.

---

## 6. A tour of the capabilities

The complete list is in `node_modules/@playwright/cli/README.md`; here is only the map:

| Group | What is inside |
|---|---|
| Core | `open`, `goto`, `click`, `dblclick`, `fill` (`--submit`), `type`, `drag`, `drop`, `hover`, `select`, `upload`, `check`/`uncheck`, `snapshot`, `find`, `eval`, `dialog-accept`/`dismiss`, `resize` |
| Navigation | `go-back`, `go-forward`, `reload` |
| Keyboard and mouse | `press`, `keydown`, `keyup`, `mousemove`, `mousedown`, `mouseup`, `mousewheel` |
| Saving | `screenshot` (`--hires`), `pdf` |
| Tabs | `tab-list`, `tab-new`, `tab-close`, `tab-select` |
| Storage | `state-save`/`state-load`, `cookie-*`, `localstorage-*`, `sessionstorage-*` |
| Network | `requests`, `request`/`request-headers`/`request-body`, `response-headers`/`response-body`, `route`, `route-list`, `unroute`, **`network-state-set`** (including offline) |
| DevTools | `console`, `run-code`, `recording-start/stop`, `tracing-start/stop`, `video-*`, `show`, `pause-at`, `resume`, `step-over`, `generate-locator`, `highlight` |
| Installation | `install`, `install-browser` |
| Sessions | `-s=<name>`, `list`, `close-all`, `kill-all`, `attach`, `detach` |
| Global options | `--help [command]`, `--json`, `--raw`, `--version` |

I will single out three things that are easy to miss:

- **`playwright-cli show`** — a visual dashboard: a grid of live sessions with screen streaming and the ability to **take over control** (click into the viewport, Escape releases it). Exactly what you need when the agent is working in the background and you want to watch or step in.
- **`network-state-set`** — switching the browser offline. Checking offline behaviour without proxies or workarounds.
- **`run-code`** — run an arbitrary Playwright script when the commands are not enough.

---

## 7. Configuration

The CLI reads a JSON config: `--config path/to/config.json`, and by default `.playwright/cli.config.json` (so the flag is not needed every time). The schema covers the browser (`browserName`, `isolated`, `userDataDir`, `launchOptions`, `contextOptions`, CDP connection, `initScript`/`initPage`), `outputDir`, `outputMode` (`file` or `stdout`), the console level, `allowedOrigins`/`blockedOrigins`, `testIdAttribute`, action and navigation timeouts, `codegen`.

Some settings are duplicated by environment variables — and here is an amusing detail: **their prefix is `PLAYWRIGHT_MCP_*`**, even though this is the CLI:

```bash
PLAYWRIGHT_MCP_BROWSER=chrome
PLAYWRIGHT_MCP_HEADLESS=false
PLAYWRIGHT_MCP_VIEWPORT_SIZE=1280x720
PLAYWRIGHT_MCP_OUTPUT_DIR=./out
PLAYWRIGHT_MCP_SAVE_VIDEO=800x600
PLAYWRIGHT_MCP_STORAGE_STATE=state.json
```

The historical reason is obvious: the CLI grew out of the same code as the MCP server, so it inherited the variable names. The practical takeaway: **do not be surprised by the prefix** — it works.

---

## 8. The CLI in your environment: the honest specifics

Three points that apply specifically to your combination (DSH + Windows + sandbox):

1. **Install skills into `.agents/skills`.** DSH does not read `.claude/skills`, but it does read `.agents/skills`. The command: `playwright-cli install --skills=agents`. If you install the skill globally (`-g`), it goes to `~/.agents/skills` — also a DSH-readable root (rank 500).
2. **The daemon requires access to named pipes.** In your project `playwright-DSH-mcp-cli` we already stumbled over this: `playwright-cli attach`/`snapshot` failed with EPERM on the daemon's files, and the cure was widening the sandbox access (`danger-full-access`). This is not a CLI bug but a property of an isolated environment: the daemon and the client communicate through OS named pipes.
3. **`npx` is broken for you in the sandbox** (bash CreateFileMapping) — for a local run, `node node_modules/@playwright/cli/cli.js` or a global install of `playwright-cli` is more reliable.

And the most important point about the CLI's place in the overall picture:

| Layer | Who is responsible | From the lessons |
|---|---|---|
| The process (plan → tests → healing) | the planner / generator / healer roles + the test server's MCP | 1–3 |
| The hands (browser, snapshots, traces, debugging) | the CLI **or** MCP | this lesson |
| The memory (what was done, where the defects are) | files: `specs/`, `tests/`, `Bug Reports/`, `SESSION-NOTES.md` | the whole course |

The CLI is the **layer of hands**. It does not replace the process and it keeps no records; it gives you a fast way to take one step and look at the result.

---

## 9. Practice

**Exercise 1. Put the skill in the right place.**
Check where `.agents/skills/playwright-cli` came from in the project: look at `SKILL.md` and make sure it is the same skill that `playwright-cli install --skills=agents` installs. Then install it globally (`-g`) and explain which root it will end up in and why DSH will see it.

**Exercise 2. A snapshot instead of a snapshot.**
Open GreenKart through the CLI and find the "Brocolli" card in two ways: `find "Brocolli"` and a full `snapshot` followed by a search. Compare the volume of output. Answer: why is `find` cheaper, and when is a full snapshot still needed?

**Exercise 3. `--raw` and a diff.**
Take `--raw snapshot` before and after clicking "ADD TO CART" and run `diff`. What exactly changed in the accessibility tree? Compare it with what we asserted in the tests (`.cart-count`, the `Items` counter).

**Exercise 4. Debugging a failing test by hand.**
Take the test `should-not-offer-order-placement-when-the-cart-is-empty` (it is marked `fixme` — remove the mark locally), launch it in the background via `--debug=cli`, attach with `attach`, use `pause-at` to reach the line with `toBeDisabled` and look at the state of the button. Then put `fixme` back. Compare this path with how the healer did the same thing through `test_debug`.

**Exercise 5. An offline check.**
Switch the session to offline (`network-state-set offline`) and watch how the application behaves. Think about which of this is worth turning into a test case.

---

## 10. Self-check questions

1. Why does the CLI have a lower token cost than MCP? Which entry in the token meter does this affect?
2. How does `--skills=agents` differ from `--skills`, and why is the first option the important one for DSH?
3. Why can a ref not be saved "for later", and what should you do after navigation?
4. What is the difference between `snapshot`, `snapshot e34`, `snapshot --depth=4` and `find`?
5. What does `--raw` do and what tasks does it open up?
6. How are `pause-at` / `step-over` / `resume` related to the healer's work from lesson 3?
7. Why are the CLI's environment variables named `PLAYWRIGHT_MCP_*`?

---

## 11. Cheat sheet

```bash
# Installation and skills
npm install -g @playwright/cli@latest
playwright-cli install --skills=agents        # into .agents/skills (a path DSH reads)
playwright-cli --help
playwright-cli --help <command>

# Basic loop
playwright-cli open https://example.com --headed
playwright-cli snapshot
playwright-cli click e15
playwright-cli find "Add to cart"
playwright-cli screenshot --filename=state.png

# Sessions
playwright-cli list
playwright-cli -s=proj open https://example.com --persistent
playwright-cli close-all
playwright-cli kill-all

# Test debugging
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/x.spec.ts --debug=cli
playwright-cli attach tw-XXXXXX
playwright-cli pause-at tests/x.spec.ts:42
playwright-cli step-over
playwright-cli resume
playwright-cli tracing-start / tracing-stop

# Comparing states
playwright-cli --raw snapshot > before.yml
# ... action ...
playwright-cli --raw snapshot > after.yml
diff before.yml after.yml
```

---

## 12. What next

- The next lessons in the course plan: **Playwright MCP as the base layer** (lesson 5) and **the "manual vs agents" comparison** (lesson 6, practice).
- It is worth re-reading [Lesson 3](03-under-the-hood.md): it explains which layers an agent consists of, and now it is clear that the CLI is an alternative implementation of the **tools layer**.
- If you want to practise seriously: bring up debugging of your test from `Bug Reports/BUG-1` via `--debug=cli` and watch the behaviour of localStorage in real time — this is exactly the tool with which such a defect is investigated.

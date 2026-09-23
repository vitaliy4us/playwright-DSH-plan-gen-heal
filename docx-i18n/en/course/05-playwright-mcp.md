# Lesson 5. Playwright MCP as the base layer

> **Why this lesson.** The CLI (lesson 4) and the agents (lessons 1–3) stand on one foundation — **Playwright MCP**. This is the server that gives the model a browser through structured snapshots. Let us go through its tools, the **capabilities** system and, above all, check what is actually enabled in your DSH — because this is precisely where those "tools not found" that we kept running into turned up.
>
> **Sources**
> - Documentation: [Playwright MCP → Introduction](https://playwright.dev/mcp/introduction), plus the pages [Capabilities](https://playwright.dev/mcp/capabilities) and [Testing & Assertions](https://playwright.dev/mcp/tools/assertions). The section has 26 pages.
> - The live server: the browser MCP connected in your DSH profile (we called its tools in lessons 1–4).
> - DSH configuration: `~/.dsh/profiles/web/cordis.patch.yml` and the documentation of the `@deepseek-ai/dsh-mcp-client` package.

---

## 1. What it is

The official definition: *«A Model Context Protocol server that provides browser automation capabilities using Playwright. Enables LLMs to interact with web pages through structured accessibility snapshots — no vision models required»*.

The key phrase is **no vision models required**. The model does not "look at screenshots" and does not guess coordinates: it reads the **accessibility tree** and receives references to elements.

Here is the official example dialogue:

```
You: Navigate to https://demo.playwright.dev/todomvc and add "Buy groceries".

→ browser_navigate { url: "https://demo.playwright.dev/todomvc" }
  - heading "todos" [level=1] [ref=e3]
  - textbox "What needs to be done?" [ref=e5]

→ browser_type { target: "e5", text: "Buy groceries", submit: true }
  - heading "todos" [level=1] [ref=e3]
  - textbox "What needs to be done?" [ref=e5]
  - list [ref=e8]:
    - listitem [ref=e9]:
      - checkbox "Toggle Todo" [ref=e10]
      - text: Buy groceries
  - contentinfo [ref=e12]
    - text: 1 item left
```

The mechanics are exactly the same as in the CLI: **snapshot → ref → tool**. The only difference is that in MCP the model passes the ref as a structured parameter (`target: "e5"`), while in the CLI it passes it as a shell command argument.

Declared properties: snapshot-based (an accessibility tree rather than pixels), LLM-friendly (structured text is **cheaper** than a DOM dump or screenshots), cross-browser, **70+ tools**, **persistent sessions** (login and cookies are preserved between sessions by default), works in any MCP client.

By default the server opens the browser **in headed mode** — so that a human can see what is happening (in the CLI it is the opposite, headless by default).

---

## 2. The key point: tools are enabled in groups

Here is what is usually missed. MCP tools are divided into **capabilities**, and by default only **core** is enabled.

| Capability | What it provides |
|---|---|
| **core** (always on, cannot be disabled) | navigation, snapshots, clicks, input, forms, tabs, dialogs, file upload, console, network requests, `browser_evaluate`, `browser_run_code_unsafe`, `browser_wait_for`, screenshots, resize |
| `network` | `browser_route`, `browser_route_list`, `browser_unroute`, `browser_network_state_set` (mocks and offline) |
| `storage` | cookies, localStorage, sessionStorage, `browser_storage_state`, `browser_set_storage_state` |
| `testing` | `browser_verify_element_visible`, `browser_verify_text_visible`, `browser_verify_list_visible`, `browser_verify_value`, `browser_generate_locator` |
| `devtools` | tracing, video, action recording, element highlighting, annotations, `browser_resume` |
| `pdf` | `browser_pdf_save` |
| `vision` | coordinate mouse tools (for vision-capable models) |
| `config` | `browser_get_config` (show the final configuration) |

It can be enabled in three ways — pick one:

```jsonc
// 1. as an argument when starting the server
{ "mcpServers": { "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--caps=vision,pdf,devtools"] } } }
```

```bash
# 2. as an environment variable
PLAYWRIGHT_MCP_CAPS=vision,pdf,devtools
```

```jsonc
// 3. in a config file
{ "capabilities": ["vision", "pdf", "devtools", "network", "storage", "testing"] }
```

**Practical takeaway:** if a tool "should be there" but is not, first check whether its capability is enabled.

---

## 3. Checking your server: what is actually enabled

Let us look at the facts. In your DSH profile the server is connected like this:

```yaml
- id: mcp-playwright
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: playwright
    transport: stdio
    command: npx.cmd
    args: ['-y', '@playwright/mcp@latest']     # ← not a single --caps
```

And the set of tools actually available in the session **corresponds exactly to core**:

```
browser_navigate, browser_navigate_back, browser_snapshot, browser_find, browser_click,
browser_hover, browser_drag, browser_drop, browser_type, browser_fill_form,
browser_select_option, browser_press_key, browser_take_screenshot, browser_tabs,
browser_handle_dialog, browser_file_upload, browser_console_messages,
browser_network_requests, browser_network_request, browser_evaluate,
browser_run_code_unsafe, browser_wait_for, browser_close, browser_resize
```

There are no `browser_verify_*`, no work with cookies/localStorage, no network mocks, no tracing — they are absent because there is no `--caps`.

### This explains our three "tools not found"

Remember, in the Cart Edge Cases loop three calls failed with `Tool "..." not found`? Now the picture comes together:

| Tool | Why it is absent |
|---|---|
| `browser_reload` | it is **not in core** at all — in the CLI this is the `reload` command, in MCP there is no such tool |
| `browser_check` | it is not in the MCP tool list; in the CLI this is the `check` command. Core has only `browser_fill_form`, and clicking a checkbox is done through `browser_click` |
| `browser_resume` | it belongs to the **`devtools`** capability, which is not enabled |

As you remember, we worked around this using the standard paths: `browser_navigate` instead of a reload, a click instead of `check`, a repeated run instead of `resume`. **These were not environment bugs but missing capabilities** — and now it is clear how to enable them.

### How to enable what you need

It is enough to add a flag to the profile entry:

```yaml
- id: mcp-playwright
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: playwright
    transport: stdio
    command: npx.cmd
    args: ['-y', '@playwright/mcp@latest', '--caps=testing,network,storage,devtools']
```

After the edit the DSH MCP client reconnects the server as soon as it changes (hot-swap), and the tools appear without a restart. The price is that their schemas start being charged in every request (that same "Tools" entry in the token meter), so enable only what you genuinely need.

> ⚠️ It is also worth knowing that **the test MCP server** (`playwright run-test-mcp-server`) has its own set — it already includes `browser_verify_*`, `browser_generate_locator`, and work with storage and tracing. That is exactly why in the agent loop we used the tools from there rather than from the browser server.

---

## 4. Snapshots and refs — the same language as in the CLI

The mechanics match lesson 4 almost word for word:

- **`browser_snapshot`** — take the accessibility tree with refs (`e3`, `e5`, `e10`).
- **ref** is unique within a snapshot and is **invalidated when the page changes** — after navigation you need a new snapshot.
- **`browser_find`** — search the snapshot by text or by a regular expression (`find --regex "/sign (in|up)/i"` in the CLI, similarly here). Cheaper than taking the whole tree.
- **Targets** can be given both as a ref and as a selector; in our runs I passed both, for example `role=link[name="Cart"]`.

The practical difference from the CLI: in MCP the snapshot is **returned straight into the context** as part of the tool response, while in the CLI it is **written to a file**, and the model reads it only if needed. Hence the difference in token cost.

---

## 5. Assertion tools: a bridge from research to test

This is the most underrated part of MCP — and it is precisely in the `testing` capability. Officially: *«Every verify tool returns Done on success and an error message on failure, and records the matching `expect(...)` line in the generated code so a passing sequence can be assembled into a test»*.

Look at what happens on a call:

```
→ browser_verify_element_visible { role: "heading", accessibleName: "Dashboard" }
  Done
  // Generated: await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
```

The same goes for locator generation:

```
→ browser_generate_locator { target: "e15" }
  getByRole('button', { name: 'Submit' })

→ browser_generate_locator { target: "e3" }
  getByLabel('Email')
```

**Why this matters.** In lesson 3 we covered that the generator writes tests from the log rather than "from its head". Here is the source of that log: the assertion tools return a **ready-made `expect(...)` line**, while the action tools return the Playwright equivalent. The check happens live, and its result is immediately turned into test code.

We saw this with our own hands: when the healer was looking for an up-to-date locator for the quantity in the cart, `browser_generate_locator` returned `getByRole('listitem').getByText('Nos.')` — a suggestion that I then deliberately rejected in favour of a proven class locator, `.quantity` (it was already used in the neighbouring green tests). The tool suggests — the engineer decides.

---

## 6. MCP in DSH: how it is set up

DSH reads neither `.vscode/mcp.json` nor `.mcp.json` — the connection lives in the profile, as a separate entry per server:

```yaml
- insert:
    - id: mcp-playwright
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: playwright            # ← sets the prefix of the tool names
        transport: stdio
        command: npx.cmd
        args: ['-y', '@playwright/mcp@latest']
```

What follows from this:

1. **`serverName` determines the names.** The DSH convention is `mcp__<serverName>__<rawName>`. That is why the session has `mcp__playwright__browser_click` and `mcp__playwright-test__test_run` — two different servers in one namespace.
2. **An edit is applied by hot-swap.** Changing the entry reconnects the server; the tool set is replaced entirely, without duplicates.
3. **Diagnostics are in the logs.** Connection problems show up as `reconnecting` / `final failure` with the number of attempts.
4. **The cost is constant.** The tool schemas of a connected server are paid for **in every request** while the server is registered. Two MCP servers are already a noticeable surcharge; a third is worth connecting deliberately.

---

## 7. MCP or CLI: how to choose

The official table (it is mirrored in both documentation sections):

| | MCP | Playwright CLI |
|---|---|---|
| Better for | specialised agent loops, exploratory automation | coding agents with a large codebase |
| How it works | the LLM calls tools with structured parameters | the agent runs shell commands |
| Token cost | higher: schemas + snapshots in the context | lower: short output, skills on demand |
| Default mode | headed | headless |
| Configuration | a JSON config in the MCP client | `npm install -g @playwright/cli` |

How this looks in our practice:

| Task | What is more convenient | Why |
|---|---|---|
| The planner → generator → healer loop | **MCP** | you need the specialised tools (`planner_save_plan`, `test_run`, `test_debug`) and retaining the page context between steps |
| Researching an unfamiliar application | **MCP** | snapshots and interactivity on demand |
| Debugging a failing test by hand | **CLI** | `pause-at` / `step-over` / `resume` + context savings |
| Mass repetitive operations in a large repository | **CLI** | tool schemas do not occupy the context |

And one more thing: **they do not compete.** The CLI and MCP are two façades over the same Playwright library. Snapshots, refs, locators are a shared language; you can switch even in the middle of a task.

---

## 8. Practice

**Exercise 1. Enable a capability and check the difference.**
Add `--caps=testing` to the DSH profile and check whether `browser_verify_*` and `browser_generate_locator` have appeared **on the browser server** (`mcp__playwright__*`). Then answer: why are they needed if the test server already has the same tools?

**Exercise 2. Assemble a test without agents.**
Walk the scenario "add a product to the cart → open the cart" using MCP tools, and at every step write down the `// Generated: ...` line from the `browser_verify_*` responses. Assemble a ready-made test from them. Compare it with `tests/cart/should-add-single-product-to-cart.spec.ts` — what matched, and what would you have written differently?

**Exercise 3. Check your ref discipline.**
Take a snapshot, note down the ref of a button, reload the page and try to click using the old ref. What happened and why? Formulate the rule in one line.

**Exercise 4. Mocks and offline (the `network` capability).**
Enable `--caps=network`, switch the page to offline (`browser_network_state_set`) and watch the behaviour of GreenKart. Then substitute a request via `browser_route` and check what the application sees.

**Exercise 5. The cost of context.**
Look at the DSH token meter immediately after enabling `--caps=testing,network,storage,devtools` and compare it with the value before. Estimate how many tokens the schemas of the four groups add, and decide which ones to leave enabled.

---

## 9. Self-check questions

1. Why does MCP work by snapshots rather than by screenshots, and what is the benefit?
2. What is a capability, and what does the core set consist of?
3. Why were `browser_check` and `browser_reload` not found, even though they "should have been there"?
4. How does `mcp__playwright__browser_click` differ from `mcp__playwright-test__browser_click`?
5. What do `browser_verify_*` return besides "Done", and why is that needed?
6. Where in DSH is the MCP server configured, and why is `.vscode/mcp.json` not suitable?
7. Name two tasks for which the CLI is clearly better than MCP, and two where the opposite is true.

---

## 10. Cheat sheet

```yaml
# DSH: profile ~/.dsh/profiles/web/cordis.patch.yml
- insert:
    - id: mcp-playwright
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: playwright
        transport: stdio
        command: npx.cmd
        args: ['-y', '@playwright/mcp@latest', '--caps=testing,network,storage,devtools']
```

| What you need | Tools / how to enable |
|---|---|
| Basic interaction | core: `browser_navigate`, `browser_click`, `browser_type`, `browser_fill_form`, `browser_snapshot`, `browser_find` |
| Checks and locators | `--caps=testing` → `browser_verify_*`, `browser_generate_locator` |
| Mocks and offline | `--caps=network` → `browser_route`, `browser_network_state_set` |
| Cookies and storage | `--caps=storage` → `browser_cookie_*`, `browser_localstorage_*`, `browser_storage_state` |
| Traces and video | `--caps=devtools` → `browser_start_tracing`, `browser_start_video`, `browser_highlight` |
| Configuration diagnostics | `--caps=config` → `browser_get_config` |

---

## 11. What next

The next lesson is **practical**: the full loop on a learning application and an honest comparison of two paths — "by hand" and "with agents" — on our own material (plans, tests, defects found).

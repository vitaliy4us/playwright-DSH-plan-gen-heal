# SESSION-NOTES — playwright-DSH-plan-gen-heal

Updated: 2026-08-22. A memory file for continuing work in any session (it survives /compact).

## What this project is
A learning project: the manual **Plan → Generate → Heal** cycle in Playwright.
Application under test: GreenKart https://rahulshettyacademy.com/seleniumPractise/#/

## Current status (everything is done, everything is green)
- `specs/greenkart.plan.md` — plan: 12 scenarios in 5 groups
  (Product Search, Shopping Cart, Promo Code, Checkout and Order Placement, Top Deals (Offers)).
- `Test Cases/` — greenkart-test-plan.md + TC-1.1 … TC-5.3 (12 manual test cases, 4-column tables).
- `tests/` — 12 automated tests (1 spec per scenario) + `tests/seed.spec.ts` + `tests/fixtures.ts`
  (the fixture opens the main page itself; the tests do not prepare it).
- **13/13 tests pass** (12 scenarios + seed). Run:
  `node node_modules/@playwright/test/cli.js test`
- git: branch master, commit 31539ff, pushed to https://github.com/vitaliy4us/playwright-DSH-plan-gen-heal (public, clean tree).

## Playwright agents in DSH: configured and verified (2026-09-23)
The three Playwright Test Agents roles (planner / generator / healer) run in DSH as normal.

**Configuration:**
- MCP server: the second `mcp-playwright-test` line in `~/.dsh/profiles/web/cordis.patch.yml`
  (`npx.cmd playwright run-test-mcp-server`, `serverName: playwright-test`, a mandatory `cwd` pointing at this project).
  It gives 87 tools: `planner_setup_page`, `planner_save_plan`, `generator_setup_page/read_log/write_test`,
  `test_list`, `test_run`, `test_debug`, `browser_generate_locator`, `browser_verify_*`.
  The names in DSH are `mcp__playwright-test__*`; an edit to the profile is applied by hot-swap, without a restart.
- Role skills: `.agents/skills/playwright-test-{planner,generator,healer}/SKILL.md` — DSH picked them up
  into the skill catalogue immediately, without a restart.

**What this environment does not have:**
- DSH ignores the `model:` field in `.github/agents/*.agent.md` (the model comes from `~/.dsh/settings.yaml`);
- DSH does not read the files `.vscode/mcp.json`, `.github/agents/`, `.github/prompts/` — only the role contents;
- some test-server tools are not callable although they are in the list: `browser_reload`, `browser_check`,
  `browser_resume` (workaround: `browser_navigate`, click on the checkbox, a repeat run).

**Proof of the cycle:**
- `specs/cart-edge-cases.plan.md` — a new Cart Edge Cases group, 6 scenarios (planner).
- `tests/cart-edge-cases/` — **6 tests, one per scenario of the plan** (generator).
- The healer was verified on three real failures (see below), each time: run → `test_debug` on pause →
  root cause → minimal fix → repeat run.
- Result: **18 passed + 2 skipped out of 20** (13 previous + 7 new; the skipped ones are two tests documenting defects).

**Application defects found by the cycle:**
1. **The cart is lost on a reload immediately after adding.**
   Report: `Bug Reports/BUG-1-cart-is-lost-on-immediate-reload.md`.
   The application writes the cart to localStorage roughly **1 s** after a change (measured: ~1009 ms).
   A `page.reload()` immediately after "ADD TO CART" overtakes the write, and application start-up overwrites all
   `app_data_*` keys with the string `"null"`. The test `should-persist-cart-after-app-reload` is marked `test.fixme()`
   (we did not bend it to the bug).
2. **An empty cart can be ordered (no validation).**
   Report: `Bug Reports/BUG-2-empty-cart-can-be-ordered.md`.
   The expectation was moved into a separate test `should-not-offer-order-placement-when-the-cart-is-empty` → `test.fixme()`;
   it was verified that it fails **for the right reason** (the locator is found, the "Place Order" button is `enabled`).
   The observed behaviour stays documented by the green tests 1.5 and 1.6 — in the plan they are marked
   as "observed behaviour" so that they do not look like a requirement.

**Explored in the cycle but not defects:**
- the order confirmation screen stays for longer than 5 s — the URL assertion needs `{ timeout: 15000 }`
  (the same practice as in `tests/checkout/should-place-order-successfully.spec.ts`);
- `specs/cart-edge-cases.plan.md` was strengthened: a section "Expected behaviour vs observed behaviour
  (known deviations)" was added with links to the reports and the requirement scenario 1.7.

**Observations about the application (important for new tests):**
- the `Items` counter in the header counts UNIQUE products, not the total quantity (2 pcs of Brocolli → "Items: 1", "Price: 240");
- adding a product again increases the quantity in the existing row, a second row does not appear;
- the cart lives in localStorage (`app_data_info`, `app_data_qty`, `app_data_tqty`, `app_data_tamt`) and survives a reload — but with the caveat from defect No. 1;
- the `.cart-count` badge disappears when the cart is empty; an empty cart is `.empty-cart h2` with the text "You cart is empty!" (a typo in the application);
- the cart markup is present in the DOM even when the cart is closed (`display: none`) → an assertion on the content may pass "blindly"; a click on the "Cart" link and a visibility check are needed;
- there is no validation of an empty cart: PROCEED TO CHECKOUT → `#/cart` (zero totals `.totAmt`/`.discountPerc`/`.discountAmt`,
  there is no `#productCartTables` table), Place Order → `#/country`, completion returns to `#/`;
- with an empty cart the screen "Thank you, your order has been placed…" is not shown (unlike an order with products);
- the only console errors are `favicon.ico` (ERR_TOO_MANY_REDIRECTS); they are unrelated to the application.

## Capstone: the cycle on a new "Search and Cart" area (2026-09-23)
A check of the skill after the course — the cycle was completed by the agents on an area that was in none of the plans.

- `specs/search-and-cart.plan.md` — a new Search and Cart group, **3 scenarios** (planner).
- `tests/search-and-cart/` — **2 tests were generated and passed on the first run** (no healer was needed):
  adding a product from a filtered search and keeping the cart when the search is cleared.
- The third scenario (`should-search-case-insensitively`) is also covered by a test — the plan and the tests are now 1:1.

**New facts about the application (verified live):**
- the search filters by substring **case-insensitively**: "ca" and "CA" give the same set —
  Cauliflower, Carrot, Capsicum, Cashews (exactly 4, in the same order);
- the application **REMOVES** the non-matching cards from the DOM (only matches in `.products`: 4 for "ca", 30 for an empty query);
- **locator trap**: a bare `.product` additionally matches a stray hidden node with the classes
  `showPriceWrapper product` outside `.products` → use `.products > .product`;
- the cart **does not depend** on the filter: clearing the search brings back all 30 products, the cart is preserved;
- **trap**: navigating to the same URL with the same hash **does not reload the SPA** (the search value remained) —
  a real `page.reload()` is needed for a clean state;
- clearing the field works through a normal `input` event (`fill('')`), not only through `keyup`.

**DSH configuration change:** the browser MCP was given the `testing` capability
(`args: ['-y', '@playwright/mcp@latest', '--caps=testing']`). Verified: `browser_verify_text_visible` and
`browser_generate_locator` appeared by hot-swap, without a restart. This explains the three "missing tools":
`browser_check` and `browser_reload` are absent from the core MCP, and `browser_resume` requires the `devtools` capability.

**Result:** 23 tests — **21 passed + 2 skipped**, no regressions.

**Packaging the project (the "show the result" step):**
- `README.md` — the entry point of the repository: what lies in each folder, a coverage table by group,
  how the tests were obtained (planner → generator → healer), how to run them, the defects found, the limitations.
- `.github/workflows/playwright.yml` — CI: `npm ci` → install Chromium → `npm test` → the HTML report as an artefact;
  triggers: push to master, pull request, manual run.
- `package.json` — the missing scripts `test`, `test:headed`, `test:ui`, `report`, `trace` were added
  along with a package description. The consistency of `package-lock.json` was checked (for `npm ci` in CI).
- **Important about CI:** the suite goes to a live external site, so a red run may mean that the third party
  is unavailable rather than a regression. `playwright.config.ts` already has `retries: 2` and `workers: 1` for CI.

## Second project (next to this one, outside this workspace)
- Folder: `C:\Users\vital\AI\playwright-DSH-mcp-cli` (renamed from playwright-DSH1).
- git: master @ 9c49f46, remote https://github.com/vitaliy4us/playwright-DSH-mcp-cli.git (the repo was renamed on GitHub, the old URL 301-redirects).
- 2 commits: 6be26e3 (the create-new-article project: MCP+CLI, seed, notes), 9c49f46 (planner/generator/healer agents + MCP config).
- Inside: SESSION-NOTES.md, prompts.txt, specs/, tests/, .playwright-cli/, .playwright-mcp/ (gitignored).
- Status: only 2 commits — an obvious candidate for continuation.

## Environment: hard sandbox facts
- **`npx` is broken** (bash CreateFileMapping fatal) → all Playwright commands go through
  `node node_modules/@playwright/test/cli.js …`
- **The Playwright runner and playwright-cli require `danger-full-access`** (EPERM on fork workers,
  the daemon's named pipe, TLS SEC_E_NO_CREDENTIALS). The rule: started it → got a denial →
  repeated the same command with sandbox_permissions + justification. No speculative escalations.
- **GitHub**: the GCM token is invalid for the REST API (401); push works through browser-auth.
  The user creates repositories manually at github.com/new (empty — without README/license).
  Verification: `git ls-remote --heads origin` (full access) and the public API `GET /users/vitaliy4us`.
- choco / winget / gh CLI — unavailable (do not waste time).
- Python 3.14 is present, tiktoken is NOT installed (to count tokens use the online tiktokenizer.vercel.app).

## Stable GreenKart locators (verified in the tests)
- Product card: `page.locator('.product').filter({ hasText: 'Brocolli' })`
- +/- buttons: `getByRole('link', { name: '+' })` / `{ name: '–' }` (inside the card)
- Add: `getByRole('button', { name: 'ADD TO CART' })`
- Cart: the Items row `page.locator('table tbody tr').filter({ hasText: 'Items' }).locator('strong')`;
  in the cart (drawer): `.quantity`, `.amount`
- Checkout: `.totAmt`, `.discountPerc`, `.discountAmt`, `.promoInfo`,
  the product rows `#productCartTables tbody tr`
- Country: `getByRole('combobox')`, checkbox `getByRole('checkbox')`
- The Offers popup window: `Promise.all([page.waitForEvent('popup'), click])`

## Pitfalls (remember them so as not to step on them)
1. The ₹ symbol is inserted by CSS (`::before`) and is absent from textContent → do not use
   `toContainText('₹ …')`, take the classes `.quantity`/`.amount`.
2. The totals in the checkout are split across elements with multiple spaces → use the classes,
   not `getByText(/No\. of Items : 1/)`.
3. Clearing the search in Offers returns the table to page 1 (Wheat…), not to Pineapple.
4. After placing an order (TC-4.2): the screen "Thank you, your order has been placed
   successfully…", then an auto-redirect to `#/` (>5 s) → assert the text + `toHaveURL(/#\/$/, { timeout: 15000 })`.

## DSH: context-saving practice (discussed with the user)
- `/compact` is **per-session** (it compresses only the current session); in the GUI it is triggered
  by typing `/compact` + Enter; the marker in the feed is a collapsed block with the summary.
- Run it at ~40–50% (we had 205K Messages = 27% → after /compact 7%).
- Russian text is more expensive than English: a measurement on o200k — a RU paragraph 63 tokens vs EN 43 (~×1.5),
  long words exactly ×2; DeepSeek has its own tokenizer, but the direction is the same.
- Keep details in files (this file, the plans, the second project's SESSION-NOTES.md)
  rather than in the context; delegate large tasks to subagents.

## Ideas for tomorrow (by priority)
1. Continue `playwright-DSH-mcp-cli` (it has only 2 commits):
   fill the project out according to the create-new-article plan.
2. Work through the `playwright-component-testing` skill (story gallery) — a new topic, the skill exists.
3. The `playwright-trace` skill — analysing trace files from the CLI.
4. If git practice is wanted: merge/clean up the history, add a CI workflow
   (copilot-setup-steps.yml already lives in .github/workflows).

## Done today (2026-08-22)
- A demonstration of `/compact` in the GUI (without executing it): the hint "compact — Compact older
  conversation history", Escape closes it, the field is cleared.
- A tokenisation experiment (tiktokenizer.vercel.app, gpt-4o/o200k): a RU/EN/ZH comparison —
  see the DSH section above. Screenshot: `.playwright-mcp/tiktokenizer-ru.png`.
- A discussion: why English is ≈ twice as cheap, and the practical conclusions.

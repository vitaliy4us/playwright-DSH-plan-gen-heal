# Session 2026-08-21 — results, findings, plan for tomorrow

## Project goal
Automation of test cases on https://conduit.bondaracademy.com/ (Conduit / RealWorld) in two
ways: **Playwright MCP** (`browser_*` tools) and **playwright-cli** (skill), with
a subsequent comparison of the approaches and of token consumption.

## What was done today
1. Test Case 1 "Create a new article" — a manual walkthrough via Playwright MCP →
   `tests/create-new-article.spec.ts` (run: 1 passed).
2. The same case via playwright-cli following the skill workflow →
   `tests/create-new-article-cli.spec.ts` (run: 1 passed, on the first attempt).
3. `tests/seed.spec.ts` — now navigates to https://conduit.bondaracademy.com/
   (a requirement of the generation workflow: scenarios start from the seed).
4. `prompts.txt` — both prompts (MCP and CLI) are already saved.

## Key findings (critical for tomorrow)
1. **MCP vs CLI is not about snapshots but about context.**
   Both tools produce an IDENTICAL accessibility snapshot (this is not the DOM!): refs `e1..`
   (CLI, files in `.playwright-cli/`) and `f1e..` (MCP, files in `.playwright-mcp/`), about ~360 lines /
   ~15 KB on the home page for both. The difference is how much content reaches the context:
   MCP `browser_snapshot` returns the full tree inline; the CLI workflow uses targeted
   `find` (~13 lines), `snapshot --depth` (~30 lines), `eval`. Only the context is billed;
   files on disk are free until they are read.
2. **Lifecycle of the debug session (`--debug=cli`).**
   `playwright-cli resume` runs the seed to the end — the runner closes the browser and the `tw-XXXX`
   session dies. The working technique: **`step-over`** — it performs `page.goto` and leaves the test
   paused at "Close context": the browser is alive, the page is in the required state → you can
   interactively walk through the scenario steps.
3. **Sandbox (important!).** `playwright test` (the runner forks workers with piped stdio → EPERM) and
   `playwright-cli` (the daemon writes to `%LocalAppData%\ms-playwright\daemon` → EPERM) require
   `danger-full-access`; escalation is per command (confirmed by the user).
4. **The CLI generates `.first()` itself** where there are several locators (Delete Article occurs ×2).
   Font Awesome icons in names (for example " New Article") are better replaced with a regex name — this is
   part of the healing.
5. **A minimal CLI generation prompt (~10 lines):** mention "using the playwright-cli skill" +
   "Do not use MCP browser tools" + the target file + do not overwrite the reference. Everything else
   the agent takes from the skill and the live application.
6. **The assertions in both tests are equivalent:** the URL `/login` and `/editor`, `.navbar` contains `pwtest`,
   the URL `/article/...`, Edit/Delete `.first()` visible, the comments block ("Write a comment..." +
   "Post Comment"), the Global Feed tab is active (the `hasText` filter, because `.nav-link.active`
   matches 2 elements), the first `.article-preview` = the created article, after deletion
   `heading` count 0. The article description is NOT shown on the detail page — assert the body.

## Plan for tomorrow: a universal planner-generator-healer workflow
Skill documentation: `C:\Users\vital\.dsh\skills\playwright-cli\references\test-generation.md`
1. **Planner** — `specs/<feature>.plan.md`: scenarios (for conduit: sign in, article CRUD,
   comments), each with the structure Seed / steps / `- expect:`.
2. **Generator** — for each scenario: `PLAYWRIGHT_HTML_OPEN=never npx playwright test
   tests/seed.spec.ts --debug=cli` (background) → `playwright-cli attach tw-XXXX` → `step-over` →
   walking through the steps (`find`/`fill`/`click`) → assembling the "Ran Playwright code" blocks →
   `tests/<scenario>.spec.ts`.
3. **Healer** — a run of all tests, healing failures one by one (debug + attach), checking against the spec.
4. **A control measurement** of token consumption for MCP vs CLI on the same scenario.

## Project files
- `tests/create-new-article.spec.ts` — the reference, created via MCP
- `tests/create-new-article-cli.spec.ts` — created via playwright-cli
- `tests/seed.spec.ts` — the seed for the generation workflow
- `specs/README.md` — the folder for plan specifications
- `prompts.txt` — the MCP and CLI prompts
- `SESSION-NOTES.md` — this file

## Useful commands
- Starting a CLI session: `playwright-cli open <url>` (full access is required)
- Snapshot/search: `playwright-cli snapshot --depth=4`, `playwright-cli find "text"`
- Locator generation: `playwright-cli generate-locator e5`
- Close everything: `playwright-cli close-all`

---

# Session 2026-09-23 — the state of the suite, a race in parallel runs, the plan and the README

## The main point: the suite was red, and it turned out to be a test design defect

The first run after a month-long break: **2 passed, 1 failed**. `create-new-article-cli.spec.ts` failed at step 6:
"the first article in the feed is the one I created" → `element(s) not found`.

**Diagnosis.** Both scenarios run **in parallel on one shared account**: while one publishes its article,
the other publishes its own, so "the first in the feed" may turn out to belong to someone else. Checking the
hypothesis: the same test on its own — **1 passed in 5.8 s**. So the problem is neither the locator nor the application.

**The fix (in both files).** We assert not the position but the fact itself: we look for the preview with the title
of the created article (`.article-preview` + `filter({ hasText: articleTitle })`) and open it. Two runs in a row —
**3 passed** each time. The general conclusion: a test that shares remote state with another test cannot rely on
global ordering.

## The plan is done: `specs/conduit.plan.md`

The planner step from the "tomorrow" plan has finally been written: an overview of the application, test data rules,
two automated scenarios (MCP and CLI) with steps and expectations, and a **backlog** of non-automated scenarios
(sign-in validation, article editing, comments) so that the gap between the plan and the suite is visible.

## README.md — the essence of the project, not a retelling of the notes

`README.md` has been added: the purpose of the project (a comparison of MCP and CLI on one case), findings and
**measured** artefacts:

| | Playwright MCP | playwright-cli |
|---|---|---|
| artefacts on disk | 21 `.yml` + 3 `.log`, 121.9 KB (on average 5.1 KB) | 15 `.yml` + 2 `.log`, 78.7 KB (on average 4.6 KB) |

The full snapshot of the home page — ~360 lines in both tools (that is, the difference is not in the snapshots, as
also stated in the previous notes), but in how much content reaches **the context**: the CLI reads in a targeted way
(`find`, `--depth`, `eval`), while MCP returns the tree inline plus pays with tool schemas on every request.
Files on disk are free — only the context is billed.

## Other

- `package.json`: the name has been tidied up (it was `playwright-dsh1` — the old folder name), scripts have been
  added: `test` / `test:headed` / `test:ui` / `report`, plus a description.
- Credentials have been moved out of the code: `CONDUIT_EMAIL` / `CONDUIT_PASSWORD` (by default — the previous
  demo account).
- **We deliberately do not add CI:** the suite mutates shared public data (it creates and deletes articles on the
  live demo site) — a run on every push would be harmful and flaky. This is recorded in the README as a limitation.
- **A known limitation:** if a scenario fails before its deletion step, the article remains on the site.
  One such "orphaned" article is left over from the 2026-09-23 run (`PW CLI Article 1790170389542`).

## What remains

The scenarios from the backlog in `specs/conduit.plan.md` (sign in / invalid sign in, article editing, comments) —
each requires live exploration before generation, just as it was with the first case.

# Learning materials on Playwright agents

A folder for self-study of **Playwright Test Agents** — the three built-in Playwright agents
(`🎭 planner`, `🎭 generator`, `🎭 healer`) that form the agent loop
"research → generation → healing".

> The course targets the **DeepSeek Harness (DSH)** working environment rather than Claude Code
> or GitHub Copilot: the official materials are studied as theory and then adapted
> to DSH — with the MCP server connected in the DSH profile and the roles packaged as skills.

## How to study here

The materials follow the order of their numbers. Every lesson is built on the same pattern:

1. **Theory** — what it is and why, grounded in official sources.
2. **Walkthrough of real files** — agent definitions, example plans and tests.
3. **Pitfalls** — what usually breaks in practice.
4. **Practice** — exercises on your own project.
5. **Self-check** — questions you should answer to yourself before moving on.

## Lessons

| № | Topic | Sources | Status |
|---|---|---|---|
| 01 | [Introduction to Playwright Test Agents](01-intro-test-agents.md) — from MCP to the agent loop, three agents, the seed test, artifacts and conventions; a walkthrough of the `model: Claude Sonnet 4.6` field | video + docs + Playwright sources | ✅ ready |
| 02 | [Playwright agents in DeepSeek Harness](02-agents-in-dsh.md) — DSH adaptation: connecting the `playwright-test` MCP server, three roles as skills, presets, ready-made loop prompts | DSH packages and configs | ✅ ready |
| 03 | [How the agents work inside (under the hood)](03-under-the-hood.md) — the three layers of an agent (definition, prompt, MCP server), the loop orchestrator prompt, the generator log and the best practices block, role boundaries by the tools issued | video + Playwright sources | ✅ ready |
| 04 | [Playwright CLI: automation from the command line](04-agent-cli.md) — the context economics of CLI versus MCP, skills and `--skills=agents`, the daemon and sessions, the "snapshot → ref → command" model, test debugging via `--debug=cli` + `attach`/`pause-at`/`step-over`, configuration | playwright.dev/agent-cli + README of the `@playwright/cli` package | ✅ ready |
| 05 | [Playwright MCP as the base layer](05-playwright-mcp.md) — core versus capabilities (`--caps=...`), solving the mystery of the three "tools not found", assertion tools and locator generation, MCP in the DSH profile and the cost of its schemas | playwright.dev/mcp + the live server | ✅ ready |
| 06 | [Practice: the full loop and the "manual vs agents" comparison](06-practice-manual-vs-agents.md) — two paths on one application, an honest fact-based comparison, the loop runbook, checklists for plan review and test acceptance, our own pitfalls | own project | ✅ ready |

## Environment requirements

- **Playwright 1.56+** (the agents appeared in this version).
- For VS Code — **version 1.105+** (otherwise the agent experience does not work).
- Any supported `init-agents` loop: `vscode` (= `copilot`) / `vscode-legacy` / `claude` / `codex` / `opencode`.

```bash
npm install -D @playwright/test@latest
npx playwright init-agents --loop=vscode
```

### For DeepSeek Harness (your environment)

DSH **does not read** the files that `init-agents` creates (`.github/agents/*.agent.md`,
`.vscode/mcp.json`): it has its own configuration. Playwright agents in DSH are assembled differently:

- the **MCP server** `playwright-test` (`npx playwright run-test-mcp-server`) is connected
  by a plugin-row in `~/.dsh/profiles/web/cordis.patch.yml` — with a mandatory `cwd` pointing at the project;
- the **roles** planner / generator / healer are packaged as **skills** in
  `<project>/.agents/skills/` (the same root that `npx playwright init-skills --loop=agents` writes to);
- the **model** is selected by DSH settings (`~/.dsh/settings.yaml`, `deepseek-v4-flash`),
  while the `model:` field in the agent files is inert.

Step-by-step setup with ready-made templates is in [Lesson 2](02-agents-in-dsh.md).

## Main sources

- [Agents | Playwright](https://playwright.dev/docs/test-agents) — official documentation.
- [Playwright CLI (Agent CLI)](https://playwright.dev/agent-cli/introduction) — the documentation section on working from the command line (23 pages: skills, snapshots, sessions, test debugging, configuration).
- [Playwright MCP](https://playwright.dev/mcp/introduction) — the section on the base layer (26 pages: capabilities, snapshots, tools, configuration).
- [Playwright v1.56: From MCP to Playwright Agents](https://youtu.be/_AifxZGxwuk) — an overview video (5:58).
- [Playwright Testing Agents: under the hood](https://youtu.be/HLegcP8qxVY) — a deep dive, 32:10.
- [microsoft/playwright](https://github.com/microsoft/playwright) — sources and documentation in markdown.

## Related projects

- `C:\Users\vital\AI\playwright-DSH-plan-gen-heal` — a practical project (GreenKart): a plan,
  manual test cases and automated tests that have been through the plan → generate → heal loop.
- `C:\Users\vital\AI\playwright-DSH-mcp-cli` — a learning project on MCP and agent automation.

> Worth remembering: to work with this folder in DSH, add it as a workspace via
> **Add workspace** and specify the real path. Renaming the folder after registration
> leaves the old path in the registry and "throws" sessions into Ungrouped.

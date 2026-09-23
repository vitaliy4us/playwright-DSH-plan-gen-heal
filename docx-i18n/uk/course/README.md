# Навчальні матеріали з агентів Playwright

Папка для самостійного вивчення **Playwright Test Agents** — трьох вбудованих агентів
Playwright (`🎭 planner`, `🎭 generator`, `🎭 healer`), які утворюють агентну петлю
«дослідження → генерація → лікування».

> Курс орієнтований на робоче середовище **DeepSeek Harness (DSH)**, а не на Claude Code
> або GitHub Copilot: офіційні матеріали розбираються як теорія, а потім адаптуються
> під DSH — з підключенням MCP-сервера в профіль DSH і оформленням ролей скілами.

## Як тут навчатися

Матеріали йдуть за порядком номерів. Кожен урок побудований за однією схемою:

1. **Теорія** — що це і навіщо, з опорою на офіційні джерела.
2. **Розбір реальних файлів** — визначення агентів, приклади планів і тестів.
3. **Підводні камені** — що зазвичай ламається на практиці.
4. **Практика** — вправи на твоєму власному проєкті.
5. **Самоперевірка** — питання, на які варто відповісти собі до переходу далі.

## Уроки

| № | Тема | Джерела | Статус |
|---|---|---|---|
| 01 | [Вступ до Playwright Test Agents](01-intro-test-agents.md) — від MCP до агентної петлі, три агенти, seed-тест, артефакти й конвенції; розбір поля `model: Claude Sonnet 4.6` | відео + docs + вихідні коди Playwright | ✅ готово |
| 02 | [Агенти Playwright у DeepSeek Harness](02-agents-in-dsh.md) — адаптація під DSH: підключення MCP-сервера `playwright-test`, три ролі як скіли, пресети, готові промпти циклу | пакети й конфіги DSH | ✅ готово |
| 03 | [Як влаштовані агенти всередині (under the hood)](03-under-the-hood.md) — три шари агента (визначення, промпт, MCP-сервер), промпт-оркестратор петлі, лог генератора й блок best practices, межі ролей за виданими інструментами | відео + вихідні коди Playwright | ✅ готово |
| 04 | [Playwright CLI: автоматизація з командного рядка](04-agent-cli.md) — економіка контексту CLI проти MCP, скіли та `--skills=agents`, демон і сесії, модель «снапшот → ref → команда», відладка тестів через `--debug=cli` + `attach`/`pause-at`/`step-over`, конфігурація | playwright.dev/agent-cli + README пакета `@playwright/cli` | ✅ готово |
| 05 | [Playwright MCP як базовий шар](05-playwright-mcp.md) — core проти capabilities (`--caps=...`), розгадка трьох «не знайдених інструментів», інструменти асертів і генерація локаторів, MCP у профілі DSH і ціна його схем | playwright.dev/mcp + живий сервер | ✅ готово |
| 06 | [Практика: повний цикл і порівняння «вручну vs агентами»](06-practice-manual-vs-agents.md) — два шляхи на одному застосунку, чесне порівняння за фактами, runbook циклу, чек-лісти рев'ю плану й приймання тестів, наші граблі | власний проєкт | ✅ готово |

## Вимоги до середовища

- **Playwright 1.56+** (агенти з'явилися в цій версії).
- Для VS Code — **версія 1.105+** (інакше агентний досвід не працює).
- Будь-який підтримуваний цикл `init-agents`: `vscode` (= `copilot`) / `vscode-legacy` / `claude` / `codex` / `opencode`.

```bash
npm install -D @playwright/test@latest
npx playwright init-agents --loop=vscode
```

### Для DeepSeek Harness (твоє середовище)

DSH **не читає** файли, які створює `init-agents` (`.github/agents/*.agent.md`,
`.vscode/mcp.json`): у нього своя конфігурація. Агенти Playwright у DSH збираються інакше:

- **MCP-сервер** `playwright-test` (`npx playwright run-test-mcp-server`) підключається
  plugin-row у `~/.dsh/profiles/web/cordis.patch.yml` — з обов'язковим `cwd` на проєкт;
- **ролі** planner / generator / healer оформлюються як **скіли** в
  `<проєкт>/.agents/skills/` (той самий корінь, куди пише `npx playwright init-skills --loop=agents`);
- **модель** обирається налаштуваннями DSH (`~/.dsh/settings.yaml`, `deepseek-v4-flash`),
  а поле `model:` у файлах агентів інертне.

Покрокове налаштування з готовими шаблонами — в [Уроці 2](02-agents-in-dsh.md).

## Основні джерела

- [Agents | Playwright](https://playwright.dev/docs/test-agents) — офіційна документація.
- [Playwright CLI (Agent CLI)](https://playwright.dev/agent-cli/introduction) — розділ документації про роботу з командного рядка (23 сторінки: скіли, снапшоти, сесії, відладка тестів, конфігурація).
- [Playwright MCP](https://playwright.dev/mcp/introduction) — розділ про базовий шар (26 сторінок: capabilities, снапшоти, інструменти, конфігурація).
- [Playwright v1.56: From MCP to Playwright Agents](https://youtu.be/_AifxZGxwuk) — оглядове відео (5:58).
- [Playwright Testing Agents: under the hood](https://youtu.be/HLegcP8qxVY) — глибоке занурення, 32:10.
- [microsoft/playwright](https://github.com/microsoft/playwright) — вихідні коди й документація в markdown.

## Пов'язані проєкти

- `C:\Users\vital\AI\playwright-DSH-plan-gen-heal` — практичний проєкт (GreenKart): план,
  ручні тест-кейси й автотести, що пройшли цикл plan → generate → heal.
- `C:\Users\vital\AI\playwright-DSH-mcp-cli` — навчальний проєкт з MCP і агентної автоматизації.

> Корисно пам'ятати: щоб працювати з цією папкою в DSH, додай її як workspace через
> **Add workspace** і вказуй реальний шлях. Перейменування папки після реєстрації
> залишає в реєстрі старий шлях і «викидає» сесії в Ungrouped.

# Урок 3. Як улаштовані агенти всередині (under the hood)

> **Навіщо цей урок.** В уроках 1–2 ми користувалися трьома агентами як чорною скринькою: попросили — отримали план, тести, лікування. Тепер розберемо цю скриньку на три шари й подивимося, з чого вона зібрана. Це знімає головний страх («що там узагалі відбувається?») і пояснює, чому агенти поводяться саме так.
>
> **Джерела**
> - Відео: [Playwright Testing Agents: under the hood](https://youtu.be/HLegcP8qxVY) — канал Playwright, 32:10, опубліковано 09.10.2025. Глави: 0:00 оновлення VS Code і Playwright · 1:49 налаштування та розуміння агентів · 3:54 seed-файли · 7:49 генерація плану · 13:47 генерація тестів · 22:56 лікування тестів, що падають · 31:30 підсумки.
> - Документація: [Agents | Playwright](https://playwright.dev/docs/test-agents).
> - **Вихідники Playwright у твоєму проєкті** — головне джерело цього уроку:
>   `node_modules/playwright/lib/agents/*.agent.md` (визначення), `*.prompt.md` (промпти), `lib/mcp/test/testContext.js` і `testBackend.js` (MCP-сервер тестів).
> - Живий досвід: цикл Cart Edge Cases, який ми щойно запустили.

---

## 1. Три шари: де що живе

Агент — це не один файл, а **три незалежні шари**, які зустрічаються в момент запуску:

| Шар | Файл / процес | Що містить | Хто автор | Живе після оновлення Playwright? |
|---|---|---|---|---|
| **1. Визначення** | `.github/agents/playwright-test-*.agent.md` | frontmatter (набір інструментів, модель) + інструкції ролі | Playwright, ставиться `init-agents` | ❌ перегенеровується, правки губляться |
| **2. Промпт** | `.github/prompts/*.prompt.md` | 6–9 рядків: задача та вказівники на файли | Playwright, ставиться з флагом `--prompts` | ❌ перегенеровується |
| **3. MCP-сервер** | процес `playwright run-test-mcp-server` | 87 інструментів і **лог запуску** | Playwright, запускається на льоту | ✅ версіонується разом із пакетом |

Проста аналогія: **визначення** — це посадова інструкція співробітника, **промпт** — наряд на роботу, **MCP-сервер** — його робочий інструмент і журнал зробленого. Співробітник читає інструкцію один раз, отримує наряд і працює інструментом, який веде протокол.

---

## 2. Шар 1: визначення агентів

Кожне визначення — markdown-файл із YAML-frontmatter. Frontmatter тут не прикраса: **саме він задає політику ролі**.

### Планувальник

```yaml
tools:
  - search
  - playwright-test/browser_navigate
  - playwright-test/browser_click
  - playwright-test/browser_snapshot
  # ... ще інструменти браузера ...
  - playwright-test/planner_setup_page
  - playwright-test/planner_save_plan
```

Тіло — п'ять фаз роботи (Navigate and Explore → Analyze User Flows → Design Comprehensive Scenarios → Structure Test Plans → Create Documentation) і стандарти якості: кроки конкретні настільки, щоб їх виконав будь-який тестувальник; обов'язкові негативні сценарії; сценарії незалежні та запускаються в будь-якому порядку; стартовий стан завжди вважається чистим.

**Ключове спостереження: у планувальника немає ні `edit`, ні `test_run`.** Він фізично не може написати тест або запустити набір. Його єдиний канал запису — `planner_save_plan`. Роль обмежена не проханням у промпті, а списком виданих інструментів.

### Генератор

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

Ядро інструкцій (дослівно з файлу):

> - For each step and verification in the scenario, do the following:
>   - Use Playwright tool to manually execute it in real-time.
>   - Use the step description as the intent for each Playwright tool call.
> - Retrieve generator log via `generator_read_log`
> - Immediately after reading the test log, invoke `generator_write_test` with the generated source code

І правила оформлення: **один тест на файл**, ім'я файлу — fs-friendly ім'я сценарію, `describe` збігається з елементом верхнього рівня плану, заголовок тесту збігається з іменем сценарію, перед кожним кроком — коментар із його текстом (не дублювати при кількох діях), «always use best practices from the log».

У генератора теж **немає `edit`**: писати код він може лише через `generator_write_test`. Натомість є `browser_verify_*` — інструменти, якими він підтверджує факти **до** того, як перетворить їх на `expect`.

### Хілер

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

Зверни увагу на асиметрію: **у хілера є `edit`, але немає `browser_click` і `browser_type`.** Він не «клікає по застосунку руками» — він відтворює сценарій через `test_debug` (тобто запускаючи сам тест) і паралельно оглядає стан: снапшот, консоль, мережу, актуальний локатор. І править код — єдиний із трьох, кому це дозволено.

Останній рядок його інструкцій — про заборони: *«Never wait for networkidle or use other discouraged or deprecated apis»*.

### Висновок за шаром

| Роль | Читати UI | Писати код | Ганяти тести | Чим пише результат |
|---|---|---|---|---|
| planner | ✅ активно досліджує | ❌ | ❌ | `planner_save_plan` |
| generator | ✅ виконує кроки наживо | ❌ (лише через свій інструмент) | ❌ | `generator_write_test` |
| healer | ✅ лише огляд | ✅ `edit` | ✅ `test_run` / `test_debug` | `edit` (правка тесту) |

**Ролі розмежовані видачею інструментів, а не умовляннями в промпті.** Це і є «безпека за конструкцією»: планувальник не зламає тести, бо не вміє їх чіпати.

---

## 3. Шар 2: промпти — вони смішно маленькі

Ось **дослівно** всі три промпти з `node_modules/playwright/lib/agents/`:

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

Три-чотири рядки на задачу. Чому так мало?

- **Інструкції вже у визначенні.** Промпт не повинен повторювати роль — він передає лише **наряд**: що зробити й де лежать файли.
- **Frontmatter `agent:`** прив'язує промпт до конкретного агента — по суті це виклик потрібної ролі.
- **`${seedFile}` — підстановка.** При `init-agents` Playwright замінює такі плейсхолдери реальними шляхами (у коді — `loadPrompt`, який підставляє `${key}`). Тому промпт завжди вказує на актуальний seed-файл проєкту.

### Оркестратор: промпт, який запускає всю петлю

Найцікавіше — четвертий файл, `playwright-test-coverage.prompt.md`. Це **готова агентна петля одним промптом**:

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

Три речі, які тут варто помітити:

1. **Петля — це просто послідовність викликів субагентів.** Жодної прихованої магії: planner → генератор за КОЖНИМ пунктом плану → хілер.
2. **«one after another, not in parallel»** — генерація свідомо послідовна. Причина практична: кожен генератор працює з живою сторінкою, і паралельні запуски заважали б один одному.
3. **Імена та шляхи передаються дослівно** (`Verbatim name of the test spec group w/o ordinal`) — саме тому правила «`describe` = група плану» і «заголовок = ім'я сценарію» так важливі: за цими рядками петля пов'язує пункти плану з файлами.

---

## 4. Шар 3: MCP-сервер тестів

Це процес `npx playwright run-test-mcp-server` (прихована команда CLI, її Playwright прописує в усі свої конфіги). У нашій установці він віддає **87 інструментів**. Їх зручно розбити на групи:

| Група | Приклади | Навіщо |
|---|---|---|
| Загальні браузерні | `browser_click`, `browser_type`, `browser_navigate`, `browser_snapshot`, `browser_fill_form` | дослідження та виконання кроків |
| Перевірки | `browser_verify_element_visible`, `browser_verify_text_visible`, `browser_verify_list_visible`, `browser_verify_value` | підтвердити факт до перетворення на `expect` |
| Локатори | `browser_generate_locator` | підібрати актуальний локатор для елемента |
| Планувальник | `planner_setup_page`, `planner_save_plan`, `planner_submit_plan` | підняти seed-середовище і зберегти план |
| Генератор | `generator_setup_page`, `generator_read_log`, `generator_write_test` | виконати кроки, забрати лог, записати тест |
| Тести | `test_list`, `test_run`, `test_debug` | знайти, запустити й налагодити тести |
| Спостережуваність | `browser_console_messages`, `browser_network_requests`, трасування, відео | діагностика |

Дві тонкощі, які видно лише в інструментах:

- **`planner_submit_plan` проти `planner_save_plan`.** Перший приймає план **структурою** (`overview` + `suites` з кроками й очікуваннями), другий записує markdown-файл. Тобто спочатку план проходить структуровану форму, і лише потім стає документом. Саме тому плани агентів такі рівні за форматом — їх збирає інструмент, а не «пише модель текстом».
- **`intent` у кожного виклику.** У коді сервера є список `typesWithIntent = ["action", "assertion", "input"]` — кожен виклик інструмента позначається наміром (`action`, `assertion`, `input`), і цей намір потрапляє в лог. Пам'ятаєш, у наших викликах був параметр `intent`? Це і є той самий механізм: лог зберігає не «клік по елементу e42», а «крок 1: додати товар у кошик».

---

## 5. Лог генератора — головний документ циклу

`generator_read_log` повертає не «історію кліків», а **готовий конспект для написання тесту**:

1. **план** — той, який передано в `generator_setup_page`;
2. **seed-файл** — дослівно, як зразок імпортів і стилю;
3. **кроки** — кожен виконаний виклик із кодом;
4. **best practices** — фіксований блок правил.

Ось цей блок **дослівно** (з `node_modules/playwright/lib/mcp/test/testContext.js`):

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

Це **не інструкція агента, а частина відповіді сервера** — тобто правило приходить разом із даними. Гарне рішення: навіть якщо визначення агента застаріє або буде переписане, лог усе одно принесе актуальні обмеження.

Чому заборони саме такі:

- `waitForLoadState` / `waitForNavigation` / `waitForTimeout` — «сплячі» очікування: вони роблять тести повільними й нестабільними, тоді як авто-очікування Playwright самі чекають потрібної умови;
- `page.evaluate` — спокуса залізти всередину сторінки й перевірити внутрішній стан замість того, щоб перевіряти те, що бачить користувач.

Наш останній цикл це підтвердив з іншого боку: я користувався `browser_evaluate` для **дослідження** (планувальник так і робить), але щойно дійшло до генерації тесту, всі перевірки були переписані на звичайні `expect(...)` — бо в тесті `evaluate` заборонений.

---

## 6. Чому seed — це про фікстури, а не про `goto`

`planner_setup_page` **запускає** seed-тест. Це означає, що для планувальника (і генератора) виконуються:

- `global setup`;
- залежності проєкту (`dependencies` у конфізі);
- усі фікстури та хуки.

У нашому проєкті `tests/fixtures.ts` відкриває застосунок для кожного тесту — і саме тому агенти отримували готову сторінку, а не порожню. Якби seed був порожнім `test('seed', async () => {})`, планувальник досліджував би… нічого.

**Практичний висновок:** seed — це контракт середовища. Усе, що потрібно зробити до першого кроку сценарію (логін, підготовка даних, відкриття сторінки), живе там, і агенти отримують це безкоштовно.

---

## 7. Звірка з тим, що ми вже бачили наживо

| Механізм із цього уроку | Де ми це бачили в циклі Cart Edge Cases |
|---|---|
| Промпт-наряд із 3 рядків | наш запит: «завантаж скіл planner, досліди GreenKart, збережи план у specs/...» — та сама структура: роль + задача + шляхи |
| `generator_setup_page` піднімає seed | «Running 1 test using 1 worker → Paused at end of test» і жива сторінка з порожнім кошиком |
| `intent` у кожного виклику | параметр `intent` у наших викликах: «Step 1: Click ADD TO CART…» |
| Лог як джерело коду | `generator_read_log` повернув план, seed і наші кроки — з нього й народився тест |
| Блок best practices | той самий список із чотирма `NEVER` у кінці лога |
| Лише `generator_write_test` пише тест | файл з'явився рівно після цього виклику |
| Хілер править код, а не тест-логіку | `test_debug` на паузі → `edit` одного рядка локатора |
| `test.fixme()` як чесний результат | тест на persistence: дефект застосунку, а не підгонка під баг |

---

## 8. Межі: чого агенти не роблять

1. **Не розуміють продукт.** План містить лише те, що агент побачив в інтерфейсі. Вимоги, яких немає на екрані, у план не потраплять.
2. **Не гарантують сенс.** Ми це побачили буквально: згенерований тест на persistence упав — і з'ясувалося, що впав по суті (реальний дефект застосунку). Зелений набір і правильний набір — різні речі.
3. **Не переживають регенерацію.** Правки в `.agent.md` і `.prompt.md` зникнуть при наступному `init-agents`. Хочеш своє — тримай у скілах (як ми зробили в уроці 2) або в `AGENTS.md`.
4. **Не працюють без середовища.** Немає seed — немає дослідження. Немає `cwd` у MCP-сервера — немає проєкту.
5. **Обмежені виданими інструментами.** Планувальник не «забув» написати тест — йому нічим.

---

## 9. Практика

**Вправа 1. Прочитай своє визначення.**
Відкрий `.github/agents/playwright-test-generator.agent.md` у проєкті та знайди: (а) які перевірочні інструменти йому видані; (б) чого йому не видали й чому. Звірся з таблицею з розділу 2.

**Вправа 2. Збери лог руками.**
Запусти цикл на одному сценарії та після `generator_read_log` дай відповідь: з яких чотирьох частин складається лог? Яка частина прийшла не від агента, а від сервера?

**Вправа 3. Перевір заборони.**
Знайди в `.agents/skills/playwright-test-generator/SKILL.md` свій список правил і порівняй із блоком best practices із лога. Чого в твоєму скілі немає? Додай те, чого бракує — і поясни, чому генератор усе одно отримає правила з лога, навіть якщо ти цього не зробиш.

**Вправа 4. Знайди слабке місце плану.**
Візьми `specs/cart-edge-cases.plan.md` і знайди сценарій, який агент описав формально (наприклад, «нульові підсумки»). Придумай, як його підсилити так, щоб тест ловив не лише нулі, а й сенс: наприклад, що сторінка кошика з порожнім кошиком не повинна дозволяти оформити замовлення. Порівняй із тим, що вже зроблено в `should-allow-completing-an-order-with-an-empty-cart.spec.ts`.

---

## 10. Питання для самоперевірки

1. З яких трьох шарів складається «агент» і який із них переживає оновлення Playwright?
2. Чому в планувальника немає інструмента `edit`, а в хілера немає `browser_click`?
3. Чим `planner_submit_plan` відрізняється від `planner_save_plan` і чому це важливо для формату планів?
4. Звідки генератор знає, яким має бути стиль тесту?
5. Чому блок best practices приходить у лозі, а не лежить у визначенні агента?
6. Чому в промпті-оркестраторі генерація йде «one after another, not in parallel»?
7. Що саме робить `<plan>`-фрагмент промпта: передає інструкції чи вказівники?

---

## 11. Шпаргалка: де що лежить

| Що шукати | Шлях |
|---|---|
| Визначення агентів | `.github/agents/playwright-test-*.agent.md` (після `init-agents`) |
| Промпти-наряди та оркестратор | `.github/prompts/*.prompt.md` |
| Вихідники визначень і промптів | `node_modules/playwright/lib/agents/` |
| Логіка лога та best practices | `node_modules/playwright/lib/mcp/test/testContext.js` |
| Категорії `intent` | `node_modules/playwright/lib/mcp/test/testBackend.js` |
| Хто що пише | `node_modules/playwright/lib/agents/generateAgents.js` |
| Наші ролі для DSH | `.agents/skills/playwright-test-{planner,generator,healer}/SKILL.md` |

---

## 12. Що далі

- **Урок 4** із плану курсу: **Agent CLI** — робота з агентами з командного рядка ([playwright.dev/agent-cli](https://playwright.dev/agent-cli/introduction)).
- Додатково до цього уроку корисно перечитати [Урок 2](02-agents-in-dsh.md): там ми пересаджували ці самі три шари в DSH — і тепер видно, що саме переносили (інструкції + інструменти + MCP-сервер), а що залишалося платформним.

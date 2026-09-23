# Урок 5. Playwright MCP як базовий шар

> **Навіщо цей урок.** CLI (урок 4) і агенти (уроки 1–3) стоять на одному фундаменті — **Playwright MCP**. Це сервер, який дає моделі браузер через структуровані снапшоти. Розберемо його інструменти, систему **capabilities** і, головне, перевіримо, що реально ввімкнено в твоєму DSH — бо саме тут виявилися ті «не знайдені інструменти», на які ми натрапляли.
>
> **Джерела**
> - Документація: [Playwright MCP → Introduction](https://playwright.dev/mcp/introduction), а також сторінки [Capabilities](https://playwright.dev/mcp/capabilities) і [Testing & Assertions](https://playwright.dev/mcp/tools/assertions). У розділі 26 сторінок.
> - Живий сервер: браузерний MCP, підключений у твоєму профілі DSH (ми викликали його інструменти в уроках 1–4).
> - Конфігурація DSH: `~/.dsh/profiles/web/cordis.patch.yml` і документація пакета `@deepseek-ai/dsh-mcp-client`.

---

## 1. Що це таке

Офіційне визначення: *«A Model Context Protocol server that provides browser automation capabilities using Playwright. Enables LLMs to interact with web pages through structured accessibility snapshots — no vision models required»*.

Ключова фраза — **no vision models required**. Модель не «дивиться на скриншоти» і не вгадує координати: вона читає **дерево доступності** й отримує посилання на елементи.

Ось офіційний приклад діалогу:

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

Механіка рівно та сама, що в CLI: **снапшот → ref → інструмент**. Лише в MCP модель передає ref як структурований параметр (`target: "e5"`), а в CLI — як аргумент shell-команди.

Заявлені властивості: снапшотний (дерево доступності, а не пікселі), LLM-friendly (структурований текст **дешевший**, ніж дамп DOM або скриншоти), кросбраузерний, **70+ інструментів**, **persistent sessions** (логін і cookies зберігаються між сесіями за замовчуванням), працює в будь-якому MCP-клієнті.

За замовчуванням сервер відкриває браузер **у headed-режимі** — щоб людина бачила, що відбувається (у CLI, навпаки, headless за замовчуванням).

---

## 2. Головне: інструменти включаються групами

Ось те, що зазвичай упускають. Інструменти MCP розділені на **capabilities**, і за замовчуванням увімкнений лише **core**.

| Capability | Що дає |
|---|---|
| **core** (завжди, вимкнути не можна) | навігація, снапшоти, кліки, введення, форми, вкладки, діалоги, завантаження файлів, консоль, мережеві запити, `browser_evaluate`, `browser_run_code_unsafe`, `browser_wait_for`, скриншоти, resize |
| `network` | `browser_route`, `browser_route_list`, `browser_unroute`, `browser_network_state_set` (моки й офлайн) |
| `storage` | cookies, localStorage, sessionStorage, `browser_storage_state`, `browser_set_storage_state` |
| `testing` | `browser_verify_element_visible`, `browser_verify_text_visible`, `browser_verify_list_visible`, `browser_verify_value`, `browser_generate_locator` |
| `devtools` | трасування, відео, запис дій, підсвічування елемента, анотації, `browser_resume` |
| `pdf` | `browser_pdf_save` |
| `vision` | координатні інструменти миші (для моделей із зором) |
| `config` | `browser_get_config` (показати підсумкову конфігурацію) |

Вмикається трьома способами — на вибір:

```jsonc
// 1. аргументом при запуску сервера
{ "mcpServers": { "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--caps=vision,pdf,devtools"] } } }
```

```bash
# 2. змінною середовища
PLAYWRIGHT_MCP_CAPS=vision,pdf,devtools
```

```jsonc
// 3. у конфіг-файлі
{ "capabilities": ["vision", "pdf", "devtools", "network", "storage", "testing"] }
```

**Практичний висновок:** якщо інструмент «має бути», але його немає — спочатку перевір, чи ввімкнена його capability.

---

## 3. Перевірка на твоєму сервері: що реально ввімкнено

Дивимося на факти. У твоєму профілі DSH сервер підключений так:

```yaml
- id: mcp-playwright
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: playwright
    transport: stdio
    command: npx.cmd
    args: ['-y', '@playwright/mcp@latest']     # ← жодного --caps
```

І набір інструментів, який реально доступний у сесії, **точно відповідає core**:

```
browser_navigate, browser_navigate_back, browser_snapshot, browser_find, browser_click,
browser_hover, browser_drag, browser_drop, browser_type, browser_fill_form,
browser_select_option, browser_press_key, browser_take_screenshot, browser_tabs,
browser_handle_dialog, browser_file_upload, browser_console_messages,
browser_network_requests, browser_network_request, browser_evaluate,
browser_run_code_unsafe, browser_wait_for, browser_close, browser_resize
```

Ані `browser_verify_*`, ані роботи з cookies/localStorage, ані моків мережі, ані трасування — їх немає, бо немає `--caps`.

### Це пояснює три наші «не знайдені інструменти»

Пам'ятаєш, у циклі Cart Edge Cases три виклики падали з `Tool "..." not found`? Тепер картина складається:

| Інструмент | Чому його немає |
|---|---|
| `browser_reload` | його **немає в core** взагалі — у CLI це команда `reload`, у MCP такого інструмента немає |
| `browser_check` | немає у списку MCP-інструментів; у CLI це команда `check`. У core є лише `browser_fill_form`, а клік по чекбоксу робиться через `browser_click` |
| `browser_resume` | належить до capability **`devtools`**, яка не ввімкнена |

Обходилися ми, як ти пам'ятаєш, штатними шляхами: `browser_navigate` замість перезавантаження, клік замість `check`, повторний запуск замість `resume`. **Це були не баги середовища, а відсутні capability** — і тепер зрозуміло, як їх увімкнути.

### Як увімкнути потрібне

Достатньо додати прапорець у рядок профілю:

```yaml
- id: mcp-playwright
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: playwright
    transport: stdio
    command: npx.cmd
    args: ['-y', '@playwright/mcp@latest', '--caps=testing,network,storage,devtools']
```

Після правки MCP-клієнт DSH перепідключить сервер за фактом зміни (hot-swap), і інструменти з'являться без перезапуску. Ціна — їхні схеми почнуть витрачатися в кожному запиті (та сама стаття «Tools» у токен-метрі), тому вмикай те, що реально потрібно.

> ⚠️ Окремо варто знати: **у тестового MCP-сервера** (`playwright run-test-mcp-server`) свій набір — у ньому вже є `browser_verify_*`, `browser_generate_locator`, робота зі сховищем і трасуванням. Саме тому в циклі агентів ми користувалися інструментами звідти, а не з браузерного сервера.

---

## 4. Снапшоти й ref — та сама мова, що в CLI

Механіка збігається з уроком 4 майже дослівно:

- **`browser_snapshot`** — зняти дерево доступності з ref (`e3`, `e5`, `e10`).
- **ref** унікальний усередині снапшота і **інвалідується при зміні сторінки** — після навігації потрібен новий снапшот.
- **`browser_find`** — пошук по снапшоту текстом або регуляркою (`find --regex "/sign (in|up)/i"` у CLI, аналогічно тут). Дешевший, ніж знімати все дерево.
- **Цілі** можна задавати і ref'ом, і селектором; у наших запусках я передавав і те й те, наприклад `role=link[name="Cart"]`.

Практична різниця з CLI: у MCP снапшот **повертається прямо в контекст** як частина відповіді інструмента, а в CLI — **пишеться у файл**, і модель читає його лише якщо потрібно. Звідси й різниця у вартості токенів.

---

## 5. Інструменти асертів: місток від дослідження до тесту

Це найнедооціненіша частина MCP — і вона саме в capability `testing`. Офіційно: *«Every verify tool returns Done on success and an error message on failure, and records the matching `expect(...)` line in the generated code so a passing sequence can be assembled into a test»*.

Дивись, що відбувається при виклику:

```
→ browser_verify_element_visible { role: "heading", accessibleName: "Dashboard" }
  Done
  // Generated: await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
```

Те саме — генерація локаторів:

```
→ browser_generate_locator { target: "e15" }
  getByRole('button', { name: 'Submit' })

→ browser_generate_locator { target: "e3" }
  getByLabel('Email')
```

**Чому це важливо.** В уроці 3 ми розбирали, що генератор пише тести з логу, а не «з голови». Ось джерело того логу: інструменти асертів повертають **готовий рядок `expect(...)`**, а інструменти дій — еквівалент на Playwright. Перевірка йде наживо, а її результат одразу перетворюється на код тесту.

Ми це бачили своїми руками: коли хилер шукав актуальний локатор для кількості в кошику, `browser_generate_locator` повернув `getByRole('listitem').getByText('Nos.')` — пропозицію, яку я потім свідомо відхилив на користь перевіреного класового локатора `.quantity` (він уже використовувався в сусідніх зелених тестах). Інструмент пропонує — інженер вирішує.

---

## 6. MCP у DSH: як це влаштовано

DSH не читає ані `.vscode/mcp.json`, ані `.mcp.json` — підключення живе в профілі, окремим рядком на сервер:

```yaml
- insert:
    - id: mcp-playwright
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: playwright            # ← задає префікс імен інструментів
        transport: stdio
        command: npx.cmd
        args: ['-y', '@playwright/mcp@latest']
```

Що з цього випливає:

1. **`serverName` визначає імена.** Конвенція DSH — `mcp__<serverName>__<rawName>`. Тому в сесії є `mcp__playwright__browser_click` і `mcp__playwright-test__test_run` — два різні сервери в одному просторі імен.
2. **Правка застосовується hot-swap.** Зміна рядка перепідключає сервер; набір інструментів замінюється цілком, без дублів.
3. **Діагностика — у логах.** Проблеми підключення видно як `reconnecting` / `final failure` з числом спроб.
4. **Вартість постійна.** Схеми інструментів підключеного сервера оплачуються **в кожному запиті**, поки сервер зареєстрований. Два MCP-сервери — це вже помітна надбавка; третій варто підключати усвідомлено.

---

## 7. MCP чи CLI: як обирати

Офіційна таблиця (вона дублюється в обох розділах документації):

| | MCP | Playwright CLI |
|---|---|---|
| Краще для | спеціалізованих агентних петель, дослідницької автоматизації | coding-агентів із великою кодовою базою |
| Як працює | LLM викликає інструменти зі структурованими параметрами | агент запускає shell-команди |
| Вартість токенів | вища: схеми + снапшоти в контексті | нижча: короткий вивід, скіли на вимогу |
| Режим за замовчуванням | headed | headless |
| Налаштування | JSON-конфіг у MCP-клієнті | `npm install -g @playwright/cli` |

Як це виглядає на нашій практиці:

| Задача | Що зручніше | Чому |
|---|---|---|
| Цикл planner → generator → healer | **MCP** | потрібні спеціалізовані інструменти (`planner_save_plan`, `test_run`, `test_debug`) і утримання контексту сторінки між кроками |
| Дослідження незнайомого застосунку | **MCP** | снапшоти й інтерактивність на вимогу |
| Відладка тесту, що падає, руками | **CLI** | `pause-at` / `step-over` / `resume` + економія контексту |
| Масові однотипні операції у великому репозиторії | **CLI** | схеми інструментів не займають контекст |

І ще одне: **вони не конкурують.** CLI і MCP — два фасади над однією бібліотекою Playwright. Снапшоти, ref, локатори — спільна мова; перемикатися можна хоч посеред задачі.

---

## 8. Практика

**Вправа 1. Увімкни capability і перевір різницю.**
Додай у профіль DSH `--caps=testing` і перевір, чи з'явилися `browser_verify_*` і `browser_generate_locator` **у браузерного сервера** (`mcp__playwright__*`). Потім дай відповідь: навіщо вони, якщо ті самі інструменти вже є в тестового сервера?

**Вправа 2. Збери тест без агентів.**
Пройди сценарій «додати товар у кошик → відкрити кошик» інструментами MCP, і на кожному кроці виписуй рядок `// Generated: ...` з відповідей `browser_verify_*`. Збери з них готовий тест. Порівняй з `tests/cart/should-add-single-product-to-cart.spec.ts` — що збіглося, а що ти написав би інакше?

**Вправа 3. Перевір ref-дисципліну.**
Зніми снапшот, запам'ятай ref кнопки, перезавантаж сторінку і спробуй натиснути за старим ref. Що сталося і чому? Сформулюй правило одним рядком.

**Вправа 4. Моки й офлайн (capability `network`).**
Увімкни `--caps=network`, переведи сторінку в офлайн (`browser_network_state_set`) і подивись поведінку GreenKart. Потім підміни запит через `browser_route` і перевір, що бачить застосунок.

**Вправа 5. Ціна контексту.**
Подивись у токен-метр DSH одразу після ввімкнення `--caps=testing,network,storage,devtools` і порівняй зі значенням до. Оціни, скільки токенів додають схеми чотирьох груп, і виріши, які залишити ввімкненими.

---

## 9. Питання для самоперевірки

1. Чому MCP працює за снапшотами, а не за скриншотами, і в чому вигода?
2. Що таке capability і з чого складається набір core?
3. Чому `browser_check` і `browser_reload` не знайшлися, хоча «мали бути»?
4. Чим `mcp__playwright__browser_click` відрізняється від `mcp__playwright-test__browser_click`?
5. Що повертають `browser_verify_*` крім «Done» і навіщо це потрібно?
6. Де в DSH налаштовується MCP-сервер і чому `.vscode/mcp.json` не підходить?
7. Назви дві задачі, для яких CLI однозначно кращий за MCP, і дві — навпаки.

---

## 10. Шпаргалка

```yaml
# DSH: профіль ~/.dsh/profiles/web/cordis.patch.yml
- insert:
    - id: mcp-playwright
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: playwright
        transport: stdio
        command: npx.cmd
        args: ['-y', '@playwright/mcp@latest', '--caps=testing,network,storage,devtools']
```

| Потрібно | Інструменти / як увімкнути |
|---|---|
| Базовий інтерактив | core: `browser_navigate`, `browser_click`, `browser_type`, `browser_fill_form`, `browser_snapshot`, `browser_find` |
| Перевірки й локатори | `--caps=testing` → `browser_verify_*`, `browser_generate_locator` |
| Моки й офлайн | `--caps=network` → `browser_route`, `browser_network_state_set` |
| Cookies і storage | `--caps=storage` → `browser_cookie_*`, `browser_localstorage_*`, `browser_storage_state` |
| Траси й відео | `--caps=devtools` → `browser_start_tracing`, `browser_start_video`, `browser_highlight` |
| Діагностика конфігурації | `--caps=config` → `browser_get_config` |

---

## 11. Що далі

Наступний урок — **практичний**: повний цикл на навчальному застосунку й чесне порівняння двох шляхів — «вручну» і «агентами» — на нашому ж матеріалі (плани, тести, знайдені дефекти).

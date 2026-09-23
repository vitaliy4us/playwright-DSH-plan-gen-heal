# Урок 4. Playwright CLI: автоматизація з командного рядка

> **Навіщо цей урок.** Досі ми працювали через **MCP**: модель викликає інструменти, а сервер тримає браузер. Є другий, принципово інший шлях — **Playwright CLI** (`playwright-cli`): агент запускає **команди в шелі**, а браузер живе у фоновому процесі. Розберемо, навіщо це придумали, як воно влаштоване і коли обирати CLI, а коли MCP.
>
> **Джерела**
> - Документація: [Agent CLI → Introduction](https://playwright.dev/agent-cli/introduction), а також сторінки [Skills](https://playwright.dev/agent-cli/skills), [Snapshots](https://playwright.dev/agent-cli/snapshots), [Test Debugging](https://playwright.dev/agent-cli/commands/test-debugging). Усього в розділі 23 сторінки.
> - **Локальне першоджерело:** README пакета `@playwright/cli`, який уже встановлений у твоєму проєкті — `node_modules/@playwright/cli/README.md` (повний довідник команд і конфігурації).
> - Практика: пакет `@playwright/cli` уже стоїть у цьому проєкті, а його скіл лежить у `.agents/skills/playwright-cli` — ми ним користувалися в уроках 1–3.

---

## 1. Навіщо знадобився CLI: економіка контексту

Офіційне формулювання: *«A command-line interface for browser automation designed for coding agents. Token-efficient commands and installable skills let agents balance browser automation with large codebases and reasoning within limited context windows»*.

Сенс в одному слові: **контекст**. Порівняй два способи дати агенту браузер:

| | MCP | CLI |
|---|---|---|
| Як працює | LLM викликає інструменти зі структурованими параметрами | агент запускає shell-команди |
| Вартість токенів | **вища**: схеми інструментів + снапшоти в контексті | **нижча**: короткий вивід команд, скіли підвантажуються за потреби |
| Краще для | спеціалізованих агентних петель, дослідницької автоматизації | coding-агентів, що працюють з великою кодовою базою |
| Режим за замовчуванням | headed | headless |
| Налаштування | JSON-конфіг у MCP-клієнті | `npm install -g @playwright/cli` |

Це не теорія — це видно в нашому власному токен-метрі. У поточній сесії в нас підключені **два MCP-сервери**: браузерний `playwright` і тестовий `playwright-test` (87 інструментів). Їхні схеми потрапляють у **кожен** запит до моделі — у DSH це стаття «Tools» у лічильнику, і вона не обнуляється між кроками. CLI влаштований інакше: агент викликає команду, отримує 3–5 рядків виводу й посилання на файл снапшота. Модель платить лише за те, що реально прочитала.

> Не роби з цього висновок «CLI кращий за MCP». Документація прямо каже: MCP залишається доречним там, де потрібні **довгоживучий стан, багата інтроспекція та ітеративні міркування за структурою сторінки** — тобто рівно наш цикл planner → generator → healer. CLI — для іншого: швидко зробити роботу і не тягнути за собою схеми.

---

## 2. Встановлення та скіли

```bash
npm install -g @playwright/cli@latest
playwright-cli --help
```

Далі — важливий крок, який відрізняє CLI від «просто набору команд»:

```bash
playwright-cli install --skills            # розкладка Claude Code (за замовчуванням) → .claude/skills/playwright-cli
playwright-cli install --skills=agents     # розкладка .agents/skills → .agents/skills/playwright-cli
playwright-cli install --skills -g         # у домашній каталог (~/.claude/skills або ~/.agents/skills)
```

**Ось тут пряме влучання в твоє середовище.** Режим `--skills=agents` кладе скіл у `.agents/skills/playwright-cli` — це **той самий корінь, який читає DSH** (ми розбирали це в уроці 2: DSH сканує `<проєкт>/.agents/skills` на ранзі 200). Тому в твоєму проєкті скіл `playwright-cli` уже видно в каталозі скілів сесії, і агент уміє ним користуватися. Жодної окремої «інтеграції CLI з DSH» не потрібно — конвенція `.agents/skills` і є точкою стикування.

### Що всередині скіла

`SKILL.md` описує поверхню команд (базові дії, снапшоти й ref, сесії, raw-вивід, параметри `open`/`attach`) і посилається на докладні посібники:

| Reference guide | Про що |
|---|---|
| Running and Debugging Playwright tests | запуск, відладка й керування наборами тестів |
| **Test generation** | plan / generate / heal — той самий цикл, що ми робили агентами |
| Request mocking | перехоплення й мок мережевих запитів |
| Running Playwright code | виконання довільних Playwright-скриптів (`run-code`) |
| Browser session management | кілька сесій, `attach` / `detach` |
| Storage state | cookies і localStorage: збереження й відновлення |
| Tracing / Video recording | траси й відео, включно зі сценаріями «hero video» |
| Inspecting element attributes | атрибути, яких не видно у снапшоті |

### Режим без скілів

Скіли не обов'язкові — агент може сам прочитати довідку:

> Test the "add todo" flow on https://demo.playwright.dev/todomvc using playwright-cli. Check playwright-cli --help for available commands.

Це робочий прийом: почни з `--help`, і наявність скіла перестає бути жорсткою вимогою.

---

## 3. Архітектура: демон і сесії

Дві властивості, які пояснюють, чому CLI взагалі швидкий:

- **Демон.** Браузер живе у фоновому процесі, тому **немає стартової ціни на кожну команду**. У MCP-світі сервер теж тримає браузер, але ти платиш схемами інструментів; у CLI ти платиш лише часом запуску самої команди, а він мінімальний.
- **Сесії.** Різні проєкти — різні браузери:

```bash
playwright-cli list                    # список усіх сесій
playwright-cli -s=example open https://example.com --persistent
playwright-cli close-all               # закрити всі браузери
playwright-cli kill-all                # примусово вбити процеси
```

Профіль браузера за замовчуванням тримається **в пам'яті**: cookies і storage живуть між командами всередині сесії й губляться при закритті браузера. Потрібна стійкість між перезапусками — `--persistent` (профіль на диску) або `--profile=<path>`.

Агенту сесію можна задати заздалегідь через змінну середовища:

```bash
PLAYWRIGHT_CLI_SESSION=todo-app claude .
```

Режими запуску: за замовчуванням **headless**, для спостереження очима — `playwright-cli open <url> --headed`. Є емуляція пристроїв (`--device="iPhone 15"`, `--mobile`), вибір браузера (`--browser=chrome`) і підключення до вже запущеного браузера (`attach --cdp=chrome`, `attach --extension=chrome`).

---

## 4. Модель роботи: снапшот → ref → команда

Це ядро CLI, і воно варте того, щоб розібрати його докладно.

### Автоматичні снапшоти

Після **кожної** команди CLI друкує стан сторінки:

```
### Page
- Page URL: https://demo.playwright.dev/todomvc/#/
- Page Title: React - TodoMVC
### Snapshot
- [Snapshot](.playwright-cli/page-2026-02-14T19-22-42-679Z.yml)
```

Сам снапшот — це **дерево доступності** з посиланнями на елементи:

```
- heading "todos" [level=1]
- textbox "What needs to be done?" [ref=e5]
- listitem:
  - checkbox "Toggle Todo" [ref=e10]
  - text: "Buy groceries"
```

### Правила ref — запам'ятай їх, на них ловляться помилки

| Властивість | Значення |
|---|---|
| Формат | літера `e` + число (`e5`, `e10`, `e203`) |
| Область дії | унікальний **усередині одного снапшота** |
| Час життя | дійсний до наступної зміни сторінки |
| Кому видається | **лише інтерактивним елементам** (кнопки, посилання, поля) |

Практичний висновок: **після навігації або зміни сторінки ref потрібно брати заново**. Це та сама дисципліна, що й з локаторами в тестах, і вона ж — причина, через яку в наших запусках я щоразу знімав свіжий снапшот.

### Снапшот на вимогу і пошук

```bash
playwright-cli snapshot                  # вся сторінка, файл з міткою часу
playwright-cli snapshot --filename=after.yaml
playwright-cli snapshot "#main"          # обмежити CSS-селектором
playwright-cli snapshot e34              # обмежити конкретним елементом
playwright-cli snapshot --depth=4        # обмежити глибину дерева
playwright-cli snapshot --boxes          # додати [box=x,y,width,height]
```

Прийом для великих сторінок: спочатку неглибокий снапшот (`--depth=4`), потім частковий за потрібною гілкою (`snapshot e34`). А якщо потрібно просто знайти елемент — **`find` дешевший, ніж знімати все дерево**:

```bash
playwright-cli find "Add to cart"                 # підрядок, без урахування регістру
playwright-cli find --regex "\$[0-9]+\.[0-9]{2}"  # регулярка
playwright-cli find --regex "/sign (in|up)/i"     # слеші вмикають прапорці
```

`find` повертає знайдені вузли з трьома рядками контексту — як `grep -C`.

### Взаємодія: ref чи селектор

```bash
playwright-cli click e10                                   # за ref (рекомендується)
playwright-cli fill e5 "Walk the dog"
playwright-cli click "#main > button.submit"               # CSS
playwright-cli click "getByRole('button', { name: 'Submit' })"  # Playwright-локатор
playwright-cli click "getByTestId('submit-button')"
```

Офіційна рекомендація — **ref, а не CSS**: ref вказує на конкретний елемент з актуального снапшота, тоді як CSS ламається при переверстці.

### `--raw`: вивід, придатний для порівняння

```bash
playwright-cli --raw snapshot > before.yml
playwright-cli click e5
playwright-cli --raw snapshot > after.yml
diff before.yml after.yml
```

`--raw` прибирає статус сторінки, згенерований код і снапшот, залишаючи лише значення. Це робить вивід **pipeable** — і дає руками той самий прийом «до/після», яким у тестах займаються асерти.

---

## 5. Найцінніше для тестувальника: відладка тестів з CLI

Ось де CLI розкривається по-справжньому. Схема: тест запускається **у фоні** і залишається на паузі, утримуючи браузер відкритим.

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/checkout.spec.ts --debug=cli
```

Тест друкує ім'я сесії, до якої потрібно підключитися:

```
### The test is currently paused at the start
### Debugging Instructions
- Run "playwright-cli attach tw-a3f19c" to attach to this test
```

```bash
playwright-cli attach tw-a3f19c
```

Далі — три групи команд:

**Огляд сторінки**

| Команда | Навіщо |
|---|---|
| `playwright-cli snapshot` | поточний стан |
| `playwright-cli find "Place order"` | знайти один елемент на великій сторінці |
| `playwright-cli console error` | помилки в консолі |
| `playwright-cli requests --filter="/api/"` | мережеві запити |
| `playwright-cli eval "() => document.title"` | довільний вираз |
| `playwright-cli screenshot --filename=debug-state.png` | знімок |

**Керування виконанням**

| Команда | Що робить |
|---|---|
| `resume` | продовжити виконання |
| `step-over` | виконати наступний виклик тесту |
| `pause-at <file>:<line>` | дійти до вказаного місця і стати на паузу |

Оскільки тест стоїть на паузі на самому початку, **`pause-at` — найшвидший вхід**: стрибаєш одразу до підозрілого рядка:

```bash
playwright-cli pause-at checkout.spec.ts:42
playwright-cli step-over
playwright-cli resume
```

**Читання згенерованого коду.** Офіційно: *«Every playwright-cli action prints the equivalent Playwright TypeScript. That is the fix you paste back into the test — most of the time a locator or an expectation needs updating, but it can also be a genuine bug in the app.»*

Це ключова думка уроку. CLI не просто допомагає дивитися — він **видає код**, який можна вставити в тест. І там же сказано те, що ми вже відчули на своєму циклі: іноді правильний висновок — «це справжній баг у застосунку», а не правка тесту. Саме так у нас вийшло з BUG-1.

### Готовий воркфлоу розслідування флейка

Офіційний сценарій (переказ):

1. запустити тест, що падає, у фоні з `--debug=cli`;
2. підключитися через `attach`;
3. почати запис траси (`tracing-start`);
4. дійти до підозрілого рядка (`pause-at`), зняти снапшот, подивитися консоль і запити;
5. на зламаному кроці — скриншот і точковий `eval`;
6. зупинити трасу, загасити фоновий запуск, перезапустити тест і підтвердити фікс.

**Як це пов'язано з хилером.** В уроці 3 ми бачили: у хилера є `test_debug` — він робить те саме (проганяє тест, стає на паузу, оглядає стан, править код). CLI — **той самий цикл, але руками**: не агент, а ти ведеш виконання. Це корисно у двох випадках: (а) коли треба розібратися самому, а не дивитися на звіт агента; (б) коли MCP недоступний, а браузер потрібен.

---

## 6. Огляд можливостей

Повний список — у `node_modules/@playwright/cli/README.md`, тут лише карта:

| Група | Що всередині |
|---|---|
| Core | `open`, `goto`, `click`, `dblclick`, `fill` (`--submit`), `type`, `drag`, `drop`, `hover`, `select`, `upload`, `check`/`uncheck`, `snapshot`, `find`, `eval`, `dialog-accept`/`dismiss`, `resize` |
| Навігація | `go-back`, `go-forward`, `reload` |
| Клавіатура й миша | `press`, `keydown`, `keyup`, `mousemove`, `mousedown`, `mouseup`, `mousewheel` |
| Збереження | `screenshot` (`--hires`), `pdf` |
| Вкладки | `tab-list`, `tab-new`, `tab-close`, `tab-select` |
| Сховище | `state-save`/`state-load`, `cookie-*`, `localstorage-*`, `sessionstorage-*` |
| Мережа | `requests`, `request`/`request-headers`/`request-body`, `response-headers`/`response-body`, `route`, `route-list`, `unroute`, **`network-state-set`** (у т. ч. офлайн) |
| DevTools | `console`, `run-code`, `recording-start/stop`, `tracing-start/stop`, `video-*`, `show`, `pause-at`, `resume`, `step-over`, `generate-locator`, `highlight` |
| Встановлення | `install`, `install-browser` |
| Сесії | `-s=<name>`, `list`, `close-all`, `kill-all`, `attach`, `detach` |
| Глобальні опції | `--help [command]`, `--json`, `--raw`, `--version` |

Окремо зазначу три речі, які легко пропустити:

- **`playwright-cli show`** — візуальний дашборд: сітка живих сесій з трансляцією екрана й можливістю **перехопити керування** (клікнути у в'юпорт, Escape — відпустити). Саме те, що потрібно, коли агент працює у фоні, а ти хочеш подивитися або втрутитися.
- **`network-state-set`** — перемикання браузера в офлайн. Перевірка офлайн-поведінки без проксі й костилів.
- **`run-code`** — виконати довільний Playwright-скрипт, коли команд не вистачає.

---

## 7. Конфігурація

CLI читає JSON-конфіг: `--config path/to/config.json`, а за замовчуванням — `.playwright/cli.config.json` (тоді прапорець не потрібен щоразу). Схема покриває браузер (`browserName`, `isolated`, `userDataDir`, `launchOptions`, `contextOptions`, CDP-підключення, `initScript`/`initPage`), `outputDir`, `outputMode` (`file` або `stdout`), рівень консолі, `allowedOrigins`/`blockedOrigins`, `testIdAttribute`, таймаути дій і навігації, `codegen`.

Частина налаштувань дублюється змінними середовища — і тут кумедна деталь: **префікс у них `PLAYWRIGHT_MCP_*`**, хоча це CLI:

```bash
PLAYWRIGHT_MCP_BROWSER=chrome
PLAYWRIGHT_MCP_HEADLESS=false
PLAYWRIGHT_MCP_VIEWPORT_SIZE=1280x720
PLAYWRIGHT_MCP_OUTPUT_DIR=./out
PLAYWRIGHT_MCP_SAVE_VIDEO=800x600
PLAYWRIGHT_MCP_STORAGE_STATE=state.json
```

Історична причина очевидна: CLI виріс з того самого коду, що й MCP-сервер, тому успадкував імена змінних. Практичний висновок: **не дивуйся префіксу** — він робочий.

---

## 8. CLI у твоєму середовищі: чесна специфіка

Три моменти, які стосуються саме твоєї зв'язки (DSH + Windows + пісочниця):

1. **Став скіли в `.agents/skills`.** DSH не читає `.claude/skills`, зате читає `.agents/skills`. Команда: `playwright-cli install --skills=agents`. Якщо ставити скіл глобально (`-g`), він піде в `~/.agents/skills` — теж читаний DSH корінь (ранг 500).
2. **Демон вимагає доступу до іменованих каналів.** У твоєму проєкті `playwright-DSH-mcp-cli` ми на цьому вже спотикалися: `playwright-cli attach`/`snapshot` падали з EPERM на файлах демона, і лікувалося це розширенням доступу пісочниці (`danger-full-access`). Це не баг CLI, а властивість ізольованого середовища: демон і клієнт спілкуються через іменовані канали ОС.
3. **`npx` у пісочниці в тебе зламаний** (bash CreateFileMapping) — для локального запуску надійніше `node node_modules/@playwright/cli/cli.js` або глобальне встановлення `playwright-cli`.

І головне про місце CLI у загальній картині:

| Шар | Хто відповідає | З уроків |
|---|---|---|
| Процес (план → тести → лікування) | ролі planner / generator / healer + MCP тест-сервера | 1–3 |
| Руки (браузер, снапшоти, траси, відладка) | CLI **або** MCP | цей урок |
| Пам'ять (що зроблено, де дефекти) | файли: `specs/`, `tests/`, `Bug Reports/`, `SESSION-NOTES.md` | весь курс |

CLI — це **шар рук**. Він не замінює процес і не веде записи; він дає швидкий спосіб зробити крок і подивитися результат.

---

## 9. Практика

**Вправа 1. Скіл у потрібне місце.**
Перевір, звідки в проєкті взявся `.agents/skills/playwright-cli`: подивись `SKILL.md` і переконайся, що це той самий скіл, який ставить `playwright-cli install --skills=agents`. Потім постав його глобально (`-g`) і поясни, у якому корені він опиниться і чому DSH його побачить.

**Вправа 2. Снапшот замість снапшота.**
Відкрий GreenKart через CLI і знайди картку «Brocolli» двома способами: `find "Brocolli"` і повним `snapshot` з подальшим пошуком. Порівняй обсяг виводу. Дай відповідь: чому `find` дешевший і коли повний снапшот усе-таки потрібен?

**Вправа 3. `--raw` і дифф.**
Зніми `--raw snapshot` до і після натискання «ADD TO CART» і зроби `diff`. Що саме змінилося в дереві доступності? Зістав з тим, що ми асертили в тестах (`.cart-count`, лічильник `Items`).

**Вправа 4. Відладка тесту, що падає, руками.**
Візьми тест `should-not-offer-order-placement-when-the-cart-is-empty` (він позначений `fixme` — зніми позначку локально), запусти через `--debug=cli` у фоні, підключись `attach`, дійди `pause-at` до рядка з `toBeDisabled` і подивись стан кнопки. Потім поверни `fixme`. Порівняй цей шлях з тим, як те саме робив хилер через `test_debug`.

**Вправа 5. Офлайн-перевірка.**
Переведи сесію в офлайн (`network-state-set offline`) і подивись, як поводиться застосунок. Придумай, що з цього варто перетворити на тест-кейс.

---

## 10. Питання для самоперевірки

1. Чому в CLI нижча вартість токенів, ніж у MCP? На яку статтю в токен-метрі це впливає?
2. Чим `--skills=agents` відрізняється від `--skills` і чому для DSH важливий саме перший варіант?
3. Чому ref не можна зберегти «на потім» і що робити після навігації?
4. У чому різниця між `snapshot`, `snapshot e34`, `snapshot --depth=4` і `find`?
5. Що робить `--raw` і які задачі він відкриває?
6. Як пов'язані `pause-at` / `step-over` / `resume` з роботою хилера з уроку 3?
7. Чому змінні середовища CLI називаються `PLAYWRIGHT_MCP_*`?

---

## 11. Шпаргалка

```bash
# Встановлення та скіли
npm install -g @playwright/cli@latest
playwright-cli install --skills=agents        # у .agents/skills (шлях, читаний DSH)
playwright-cli --help
playwright-cli --help <command>

# Базовий цикл
playwright-cli open https://example.com --headed
playwright-cli snapshot
playwright-cli click e15
playwright-cli find "Add to cart"
playwright-cli screenshot --filename=state.png

# Сесії
playwright-cli list
playwright-cli -s=proj open https://example.com --persistent
playwright-cli close-all
playwright-cli kill-all

# Відладка тесту
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/x.spec.ts --debug=cli
playwright-cli attach tw-XXXXXX
playwright-cli pause-at tests/x.spec.ts:42
playwright-cli step-over
playwright-cli resume
playwright-cli tracing-start / tracing-stop

# Порівняння станів
playwright-cli --raw snapshot > before.yml
# ... дія ...
playwright-cli --raw snapshot > after.yml
diff before.yml after.yml
```

---

## 12. Що далі

- Наступні уроки за планом курсу: **Playwright MCP як базовий шар** (урок 5) і **порівняння «вручну vs агентами»** (урок 6, практика).
- Корисно перечитати [Урок 3](03-under-the-hood.md): там розібрано, з яких шарів складається агент, і тепер видно, що CLI — це альтернативна реалізація **шару інструментів**.
- Якщо захочеться попрактикуватися всерйоз: підніми відладку свого тесту з `Bug Reports/BUG-1` через `--debug=cli` і подивись на поведінку localStorage у реальному часі — це саме той інструмент, яким такий дефект і розслідують.

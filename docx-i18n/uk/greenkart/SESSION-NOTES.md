# SESSION-NOTES — playwright-DSH-plan-gen-heal

Оновлено: 2026-08-22. Файл-пам'ять для продовження роботи в будь-якій сесії (переживає /compact).

## Що це за проєкт
Навчальний проєкт: ручний цикл **Plan → Generate → Heal** у Playwright.
Застосунок під тестом: GreenKart https://rahulshettyacademy.com/seleniumPractise/#/

## Поточний статус (усе зроблено, усе зелене)
- `specs/greenkart.plan.md` — план: 12 сценаріїв у 5 групах
  (Пошук товарів, Кошик, Промокод, Оформлення замовлення, Top Deals (Offers)).
- `Test Cases/` — greenkart-test-plan.md + TC-1.1 … TC-5.3 (12 ручних тест-кейсів, 4-колонкові таблиці).
- `tests/` — 12 автотестів (1 спека на сценарій) + `tests/seed.spec.ts` + `tests/fixtures.ts`
  (фікстура сама відкриває головну сторінку; тести її не готують).
- **13/13 тестів проходять** (12 сценаріїв + seed). Запуск:
  `node node_modules/@playwright/test/cli.js test`
- git: гілка master, коміт 31539ff, запушено в https://github.com/vitaliy4us/playwright-DSH-plan-gen-heal (публічний, чисте дерево).

## Агенти Playwright у DSH: налаштовано й перевірено (2026-09-23)
Три ролі Playwright Test Agents (planner / generator / healer) запускаються в DSH штатно.

**Конфігурація:**
- MCP-сервер: другий рядок `mcp-playwright-test` у `~/.dsh/profiles/web/cordis.patch.yml`
  (`npx.cmd playwright run-test-mcp-server`, `serverName: playwright-test`, обов'язковий `cwd` на цей проєкт).
  Дає 87 інструментів: `planner_setup_page`, `planner_save_plan`, `generator_setup_page/read_log/write_test`,
  `test_list`, `test_run`, `test_debug`, `browser_generate_locator`, `browser_verify_*`.
  Імена в DSH — `mcp__playwright-test__*`; правка профілю застосовується hot-swap, без перезапуску.
- Скіли ролей: `.agents/skills/playwright-test-{planner,generator,healer}/SKILL.md` — DSH підхопив їх
  у каталог скілів одразу, без перезапуску.

**Чого в цьому середовищі немає:**
- поле `model:` у `.github/agents/*.agent.md` DSH ігнорує (модель береться з `~/.dsh/settings.yaml`);
- файли `.vscode/mcp.json`, `.github/agents/`, `.github/prompts/` DSH не читає — лише вміст ролей;
- частина інструментів тест-сервера не викликається, хоча вони є у списку: `browser_reload`, `browser_check`,
  `browser_resume` (обхід: `browser_navigate`, клік по чекбоксу, повторний запуск).

**Доказ циклу:**
- `specs/cart-edge-cases.plan.md` — нова група Cart Edge Cases, 6 сценаріїв (планувальник).
- `tests/cart-edge-cases/` — **6 тестів, по одному на кожен сценарій плану** (генератор).
- Хілер перевірено на трьох реальних падіннях (див. нижче), щоразу: запуск → `test_debug` на паузі →
  першопричина → мінімальна правка → повторний запуск.
- Підсумок: **18 passed + 2 skipped з 20** (13 попередніх + 7 нових; skipped — два тести, що документують дефекти).

**Знайдені циклом дефекти застосунку:**
1. **Кошик губиться при перезавантаженні одразу після додавання.**
   Звіт: `Bug Reports/BUG-1-cart-is-lost-on-immediate-reload.md`.
   Застосунок скидає кошик у localStorage приблизно через **1 с** після зміни (заміряно: ~1009 мс).
   `page.reload()` одразу після «ADD TO CART» обганяє запис, і старт застосунку перезаписує всі ключі
   `app_data_*` рядком `"null"`. Тест `should-persist-cart-after-app-reload` позначено `test.fixme()`
   (не підганяли під баг).
2. **Порожній кошик можна оформити (немає валідації).**
   Звіт: `Bug Reports/BUG-2-empty-cart-can-be-ordered.md`.
   Очікування винесено в окремий тест `should-not-offer-order-placement-when-the-cart-is-empty` → `test.fixme()`;
   перевірено, що він падає **з правильної причини** (локатор знайдено, кнопка «Place Order» — `enabled`).
   Спостережувана поведінка залишається задокументованою зеленими тестами 1.5 і 1.6 — у плані вони позначені
   як «observed behaviour», щоб не виглядати вимогою.

**Розібрано в циклі, але дефектами не є:**
- екран підтвердження замовлення тримається довше 5 с — асерт URL вимагає `{ timeout: 15000 }`
  (та сама практика, що в `tests/checkout/should-place-order-successfully.spec.ts`);
- `specs/cart-edge-cases.plan.md` посилено: додано розділ «Expected behaviour vs observed behaviour
  (known deviations)» з посиланнями на звіти та сценарій-вимогу 1.7.

**Спостереження щодо застосунку (важливо для нових тестів):**
- лічильник `Items` у шапці рахує УНІКАЛЬНІ товари, а не загальну кількість (2 шт. Brocolli → «Items: 1», «Price: 240»);
- повторне додавання товару збільшує кількість у наявному рядку, другого рядка не з'являється;
- кошик живе в localStorage (`app_data_info`, `app_data_qty`, `app_data_tqty`, `app_data_tamt`) і переживає перезавантаження — але із застереженням з дефекту №1;
- бейдж `.cart-count` зникає при порожньому кошику; порожній кошик — це `.empty-cart h2` з текстом «You cart is empty!» (одрук у застосунку);
- розмітка кошика є в DOM і коли він закритий (`display: none`) → асерт за вмістом може пройти «наосліп»; потрібен клік по посиланню «Cart» і перевірка видимості;
- валідації порожнього кошика немає: PROCEED TO CHECKOUT → `#/cart` (нульові підсумки `.totAmt`/`.discountPerc`/`.discountAmt`,
  таблиці `#productCartTables` немає), Place Order → `#/country`, завершення повертає на `#/`;
- при порожньому кошику екран «Thank you, your order has been placed…» не показується (на відміну від замовлення з товарами);
- помилки в консолі — лише `favicon.ico` (ERR_TOO_MANY_REDIRECTS), до застосунку не стосуються.

## Капстоун: цикл на новій ділянці «Search and Cart» (2026-09-23)
Перевірка скіла після курсу — цикл пройдено агентами на ділянці, якої не було в жодному з планів.

- `specs/search-and-cart.plan.md` — нова група Search and Cart, **3 сценарії** (планувальник).
- `tests/search-and-cart/` — **2 тести згенеровано, і вони пройшли з першого запуску** (хілер не знадобився):
  додавання товару з відфільтрованого пошуку та збереження кошика при очищенні пошуку.
- Третій сценарій (`should-search-case-insensitively`) теж закрито тестом — план і тести тепер 1:1.

**Нові факти про застосунок (перевірено наживо):**
- пошук фільтрує за підрядком **без урахування регістру**: «ca» і «CA» дають той самий набір —
  Cauliflower, Carrot, Capsicum, Cashews (рівно 4, порядок однаковий);
- застосунок **ВИДАЛЯЄ** картки, що не збіглися, з DOM (у `.products` лише збіги: 4 при «ca», 30 при порожньому запиті);
- **пастка локатора**: голий `.product` додатково матчить сторонній прихований вузол з класами
  `showPriceWrapper product` поза `.products` → використовувати `.products > .product`;
- кошик **не залежить** від фільтра: очищення пошуку повертає всі 30 товарів, кошик зберігається;
- **пастка**: перехід на той самий URL з тим самим хешем **не перезавантажує SPA** (значення пошуку залишилося) —
  для чистого стану потрібен справжній `page.reload()`;
- очищення поля працює через звичайний `input`-евент (`fill('')`), а не лише через `keyup`.

**Зміна конфігурації DSH:** браузерному MCP додано capability `testing`
(`args: ['-y', '@playwright/mcp@latest', '--caps=testing']`). Перевірено: `browser_verify_text_visible` і
`browser_generate_locator` з'явилися hot-swap, без перезапуску. Це розгадка трьох «не знайдених інструментів»:
`browser_check` і `browser_reload` відсутні в core MCP, а `browser_resume` вимагає capability `devtools`.

**Підсумок:** 23 тести — **21 passed + 2 skipped**, регресій немає.

**Пакування проєкту (крок «показати результат»):**
- `README.md` — вхідна точка репозиторію: що лежить у кожній теці, таблиця покриття за групами,
  як отримано тести (planner → generator → healer), як запустити, знайдені дефекти, обмеження.
- `.github/workflows/playwright.yml` — CI: `npm ci` → встановлення Chromium → `npm test` → HTML-звіт артефактом;
  тригери: push у master, pull request, ручний запуск.
- `package.json` — додано відсутні скрипти `test`, `test:headed`, `test:ui`, `report`, `trace`
  і опис пакета. Узгодженість `package-lock.json` перевірено (для `npm ci` у CI).
- **Важливо про CI:** suite ходить на живий зовнішній сайт, тому червоний запуск може означати недоступність
  третьої сторони, а не регресію. У `playwright.config.ts` уже є `retries: 2` і `workers: 1` для CI.

## Другий проєкт (поруч, поза цим воркспейсом)
- Тека: `C:\Users\vital\AI\playwright-DSH-mcp-cli` (перейменовано з playwright-DSH1).
- git: master @ 9c49f46, remote https://github.com/vitaliy4us/playwright-DSH-mcp-cli.git (репо перейменовано на GitHub, старий URL 301-редиректить).
- 2 коміти: 6be26e3 (проєкт create-new-article: MCP+CLI, seed, нотатки), 9c49f46 (агенти planner/generator/healer + MCP-конфіг).
- Усередині: SESSION-NOTES.md, prompts.txt, specs/, tests/, .playwright-cli/, .playwright-mcp/ (gitignored).
- Статус: лише 2 коміти — очевидний кандидат на продовження.

## Середовище: жорсткі факти пісочниці
- **`npx` зламано** (bash CreateFileMapping fatal) → усі Playwright-команди через
  `node node_modules/@playwright/test/cli.js …`
- **Playwright runner і playwright-cli вимагають `danger-full-access`** (EPERM на fork-воркерах,
  named-pipe демона, TLS SEC_E_NO_CREDENTIALS). Правило: запустив → отримав denial →
  повторив ту саму команду з sandbox_permissions + justification. Без спекулятивних ескалацій.
- **GitHub**: GCM-токен невалідний для REST API (401); push працює через browser-auth.
  Репозиторії створює користувач вручну на github.com/new (порожні — без README/license).
  Перевірка: `git ls-remote --heads origin` (повний доступ) і публічний API `GET /users/vitaliy4us`.
- choco / winget / gh CLI — недоступні (не витрачати час).
- Python 3.14 є, tiktoken НЕ встановлено (для підрахунку токенів — онлайн tiktokenizer.vercel.app).

## Стабільні локатори GreenKart (перевірені в тестах)
- Картка товару: `page.locator('.product').filter({ hasText: 'Brocolli' })`
- Кнопки +/-: `getByRole('link', { name: '+' })` / `{ name: '–' }` (усередині картки)
- Додати: `getByRole('button', { name: 'ADD TO CART' })`
- Кошик: рядок Items `page.locator('table tbody tr').filter({ hasText: 'Items' }).locator('strong')`;
  у кошику (drawer): `.quantity`, `.amount`
- Чек-аут: `.totAmt`, `.discountPerc`, `.discountAmt`, `.promoInfo`,
  рядки товарів `#productCartTables tbody tr`
- Країна: `getByRole('combobox')`, чекбокс `getByRole('checkbox')`
- Спливне вікно Offers: `Promise.all([page.waitForEvent('popup'), click])`

## Граблі (запам'ятати, щоб не наступати)
1. Символ ₹ вставляється CSS'ом (`::before`), у textContent відсутній → не використовувати
   `toContainText('₹ …')`, брати класи `.quantity`/`.amount`.
2. Підсумки в чек-ауті розбиті по елементах з множинними пробілами → використовувати класи,
   а не `getByText(/No\. of Items : 1/)`.
3. Очищення пошуку в Offers повертає таблицю на сторінку 1 (Wheat…), а не Pineapple.
4. Після оформлення замовлення (TC-4.2): екран «Thank you, your order has been placed
   successfully…», потім авто-редирект на `#/` (>5 с) → assert текст + `toHaveURL(/#\/$/, { timeout: 15000 })`.

## DSH: практика економії контексту (проговорено з користувачем)
- `/compact` — **посесійний** (стискає лише поточну сесію), у GUI тригериться
  введенням `/compact` + Enter; маркер у стрічці — згорнутий блок з вижимкою.
- Запускати при ~40–50% (у нас було 205K Messages = 27% → після /compact 7%).
- Російський текст дорожчий за англійський: замір на o200k — абзац RU 63 токени vs EN 43 (~×1.5),
  довгі слова рівно ×2; у DeepSeek свій токенізатор, але напрямок той самий.
- Деталі тримати у файлах (цей файл, плани, SESSION-NOTES.md другого проєкту),
  а не в контексті; великі задачі делегувати субагентам.

## Ідеї на завтра (за пріоритетом)
1. Продовжити `playwright-DSH-mcp-cli` (там лише 2 коміти):
   наповнити проєкт за планом create-new-article.
2. Розібрати скіл `playwright-component-testing` (story gallery) — нова тема, є скіл.
3. Скіл `playwright-trace` — розбір trace-файлів з CLI.
4. Якщо захочеться git-практики: змержити/почистити історію, додати CI-воркфлоу
   (у .github/workflows уже лежить copilot-setup-steps.yml).

## Сьогодні зроблено (2026-08-22)
- Демонстрація `/compact` у GUI (без виконання): підказка «compact — Compact older
  conversation history», Escape закриває, поле очищається.
- Експеримент із токенізацією (tiktokenizer.vercel.app, gpt-4o/o200k): RU/EN/ZH порівняння —
  див. розділ про DSH вище. Скриншот: `.playwright-mcp/tiktokenizer-ru.png`.
- Обговорення: чому English ≈ вдвічі дешевше, практичні висновки.

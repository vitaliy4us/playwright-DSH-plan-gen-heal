# SESSION-NOTES — playwright-DSH-plan-gen-heal

Обновлено: 2026-08-22. Файл-память для продолжения работы в любой сессии (переживает /compact).

## Что это за проект
Обучающий проект: ручной цикл **Plan → Generate → Heal** в Playwright.
Приложение под тестом: GreenKart https://rahulshettyacademy.com/seleniumPractise/#/

## Текущий статус (всё сделано, всё зелёное)
- `specs/greenkart.plan.md` — план: 12 сценариев в 5 группах
  (Product Search, Shopping Cart, Promo Code, Checkout and Order Placement, Top Deals (Offers)).
- `Test Cases/` — greenkart-test-plan.md + TC-1.1 … TC-5.3 (12 ручных тест-кейсов, 4-колоночные таблицы).
- `tests/` — 12 автотестов (1 спека на сценарий) + `tests/seed.spec.ts` + `tests/fixtures.ts`
  (фикстура сама открывает главную страницу; тесты её не готоят).
- **13/13 тестов проходят** (12 сценариев + seed). Запуск:
  `node node_modules/@playwright/test/cli.js test`
- git: ветка master, коммит 31539ff, запушен в https://github.com/vitaliy4us/playwright-DSH-plan-gen-heal (публичный, чистое дерево).

## Агенты Playwright в DSH: настроено и проверено (2026-09-23)
Три роли Playwright Test Agents (planner / generator / healer) запускаются в DSH штатно.

**Конфигурация:**
- MCP-сервер: вторая строка `mcp-playwright-test` в `~/.dsh/profiles/web/cordis.patch.yml`
  (`npx.cmd playwright run-test-mcp-server`, `serverName: playwright-test`, обязательный `cwd` на этот проект).
  Даёт 87 инструментов: `planner_setup_page`, `planner_save_plan`, `generator_setup_page/read_log/write_test`,
  `test_list`, `test_run`, `test_debug`, `browser_generate_locator`, `browser_verify_*`.
  Имена в DSH — `mcp__playwright-test__*`; правка профиля применяется hot-swap, без перезапуска.
- Скиллы ролей: `.agents/skills/playwright-test-{planner,generator,healer}/SKILL.md` — DSH подхватил их
  в каталог скиллов сразу, без перезапуска.

**Чего в этом окружении нет:**
- поле `model:` в `.github/agents/*.agent.md` DSH игнорирует (модель берётся из `~/.dsh/settings.yaml`);
- файлы `.vscode/mcp.json`, `.github/agents/`, `.github/prompts/` DSH не читает — только содержимое ролей;
- часть инструментов тест-сервера не вызывается, хотя есть в списке: `browser_reload`, `browser_check`,
  `browser_resume` (обход: `browser_navigate`, клик по чекбоксу, повторный прогон).

**Доказательство цикла:**
- `specs/cart-edge-cases.plan.md` — новая группа Cart Edge Cases, 6 сценариев (планировщик).
- `tests/cart-edge-cases/` — **6 тестов, по одному на каждый сценарий плана** (генератор).
- Хилер проверен на трёх реальных падениях (см. ниже), каждый раз: прогон → `test_debug` на паузе →
  первопричина → минимальная правка → повторный прогон.
- Итог: **18 passed + 1 skipped из 19** (13 прежних + 6 новых; skipped — сознательно помеченный дефект).

**Найденные циклом дефекты приложения:**
1. **Корзина теряется при перезагрузке сразу после добавления.** Приложение сбрасывает корзину в
   localStorage примерно через **1 с** после изменения (замерено: ~1009 мс). `page.reload()` сразу после
   «ADD TO CART» обгоняет запись, и старт приложения перезаписывает все ключи `app_data_*` строкой `"null"`.
   Тест `should-persist-cart-after-app-reload` помечен `test.fixme()` с описанием (не подгоняли под баг).
2. **Экран подтверждения заказа держится дольше 5 с** — и для пустой корзины тоже: после «Proceed» URL
   остаётся на `#/country` и лишь затем уходит на `#/`. Ассерт URL требует `{ timeout: 15000 }`
   (та же практика, что в `tests/checkout/should-place-order-successfully.spec.ts`).

**Наблюдения по приложению (важно для новых тестов):**
- счётчик `Items` в шапке считает УНИКАЛЬНЫЕ товары, а не общее количество (2 шт. Brocolli → «Items: 1», «Price: 240»);
- повторное добавление товара увеличивает количество в существующей строке, второй строки не появляется;
- корзина живёт в localStorage (`app_data_info`, `app_data_qty`, `app_data_tqty`, `app_data_tamt`) и переживает перезагрузку — но с оговоркой из дефекта №1;
- бейдж `.cart-count` исчезает при пустой корзине; пустая корзина — это `.empty-cart h2` с текстом «You cart is empty!» (опечатка в приложении);
- разметка корзины есть в DOM и когда она закрыта (`display: none`) → ассерт по содержимому может пройти «вслепую»; нужен клик по ссылке «Cart» и проверка видимости;
- валидации пустой корзины нет: PROCEED TO CHECKOUT → `#/cart` (нулевые итоги `.totAmt`/`.discountPerc`/`.discountAmt`,
  таблицы `#productCartTables` нет), Place Order → `#/country`, завершение возвращает на `#/`;
- при пустой корзине экран «Thank you, your order has been placed…» не показывается (в отличие от заказа с товарами);
- ошибки в консоли — только `favicon.ico` (ERR_TOO_MANY_REDIRECTS), к приложению не относятся.

## Второй проект (рядом, вне этого воркспейса)
- Папка: `C:\Users\vital\AI\playwright-DSH-mcp-cli` (переименован из playwright-DSH1).
- git: master @ 9c49f46, remote https://github.com/vitaliy4us/playwright-DSH-mcp-cli.git (репо переименован на GitHub, старый URL 301-редиректит).
- 2 коммита: 6be26e3 (проект create-new-article: MCP+CLI, seed, заметки), 9c49f46 (агенты planner/generator/healer + MCP-конфиг).
- Внутри: SESSION-NOTES.md, prompts.txt, specs/, tests/, .playwright-cli/, .playwright-mcp/ (gitignored).
- Статус: только 2 коммита — очевидный кандидат на продолжение.

## Окружение: жёсткие факты песочницы
- **`npx` сломан** (bash CreateFileMapping fatal) → все Playwright-команды через
  `node node_modules/@playwright/test/cli.js …`
- **Playwright runner и playwright-cli требуют `danger-full-access`** (EPERM на fork-воркеров,
  named-pipe демона, TLS SEC_E_NO_CREDENTIALS). Правило: запустил → получил denial →
  повторил ту же команду с sandbox_permissions + justification. Без спекулятивных эскалаций.
- **GitHub**: GCM-токен невалиден для REST API (401); push работает через browser-auth.
  Репозитории создаёт пользователь вручную на github.com/new (пустые — без README/license).
  Проверка: `git ls-remote --heads origin` (полный доступ) и публичный API `GET /users/vitaliy4us`.
- choco / winget / gh CLI — недоступны (не тратить время).
- Python 3.14 есть, tiktoken НЕ установлен (для подсчёта токенов — онлайн tiktokenizer.vercel.app).

## Стабильные локаторы GreenKart (проверены в тестах)
- Карточка товара: `page.locator('.product').filter({ hasText: 'Brocolli' })`
- Кнопки +/-: `getByRole('link', { name: '+' })` / `{ name: '–' }` (внутри карточки)
- Добавить: `getByRole('button', { name: 'ADD TO CART' })`
- Корзина: строка Items `page.locator('table tbody tr').filter({ hasText: 'Items' }).locator('strong')`;
  в корзине (drawer): `.quantity`, `.amount`
- Чек-аут: `.totAmt`, `.discountPerc`, `.discountAmt`, `.promoInfo`,
  строки товаров `#productCartTables tbody tr`
- Страна: `getByRole('combobox')`, чекбокс `getByRole('checkbox')`
- Всплывающее окно Offers: `Promise.all([page.waitForEvent('popup'), click])`

## Грабли (запомнить, чтобы не наступать)
1. Символ ₹ вставляется CSS'ом (`::before`), в textContent отсутствует → не использовать
   `toContainText('₹ …')`, брать классы `.quantity`/`.amount`.
2. Итоги в чек-ауте разбиты по элементам с множественными пробелами → использовать классы,
   а не `getByText(/No\. of Items : 1/)`.
3. Очистка поиска в Offers возвращает таблицу на страницу 1 (Wheat…), а не Pineapple.
4. После оформления заказа (TC-4.2): экран «Thank you, your order has been placed
   successfully…», затем авто-редирект на `#/` (>5 с) → assert текст + `toHaveURL(/#\/$/, { timeout: 15000 })`.

## DSH: практика экономии контекста (проговорено с пользователем)
- `/compact` — **посессионный** (сжимает только текущую сессию), в GUI триггерится
  вводом `/compact` + Enter; маркер в ленте — свёрнутый блок с выжимкой.
- Запускать при ~40–50% (у нас было 205K Messages = 27% → после /compact 7%).
- Русский текст дороже английского: замер на o200k — абзац RU 63 токена vs EN 43 (~×1.5),
  длинные слова ровно ×2; у DeepSeek свой токенизатор, но направление то же.
- Детали держать в файлах (этот файл, планы, SESSION-NOTES.md второго проекта),
  а не в контексте; крупные задачи делегировать субагентам.

## Идеи на завтра (по приоритету)
1. Продолжить `playwright-DSH-mcp-cli` (там всего 2 коммита):
   наполнить проект по плану create-new-article.
2. Разобрать навык `playwright-component-testing` (story gallery) — новая тема, есть скилл.
3. Навык `playwright-trace` — разбор trace-файлов из CLI.
4. Если захочется git-практики: смержить/почистить историю, добавить CI-воркфлоу
   (в .github/workflows уже лежит copilot-setup-steps.yml).

## Сегодня сделано (2026-08-22)
- Демонстрация `/compact` в GUI (без выполнения): подсказка «compact — Compact older
  conversation history», Escape закрывает, поле очищается.
- Эксперимент с токенизацией (tiktokenizer.vercel.app, gpt-4o/o200k): RU/EN/ZH сравнение —
  см. раздел про DSH выше. Скриншот: `.playwright-mcp/tiktokenizer-ru.png`.
- Обсуждение: почему English ≈ вдвое дешевле, практические выводы.

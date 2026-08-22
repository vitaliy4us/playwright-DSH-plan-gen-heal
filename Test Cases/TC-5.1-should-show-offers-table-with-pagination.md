# TC-5.1 Отображение таблицы предложений с пагинацией (should-show-offers-table-with-pagination)

**Предусловия:** открыта главная страница GreenKart (`https://rahulshettyacademy.com/seleniumPractise/#/`)

| № шага | Описание шага | Ожидаемый результат | Фактический результат |
|---|---|---|---|
| 1 | Нажать «Top Deals» в шапке | Открывается новая вкладка с URL `#/offers`; таблица содержит колонки «Veg/fruit name», «Price» и «Discount price» | |
| 2 | При размере страницы 5 нажать «Next» | Отображаемые строки меняются на следующую страницу (например, Pineapple, Orange, Mango, Guava, Dragon fruit) | |
| 3 | Нажать «Last» | Отображается последняя страница; кнопка «Last» становится неактивной | |

# TC-5.1 Відображення таблиці пропозицій з пагінацією (should-show-offers-table-with-pagination)

**Передумови:** відкрито головну сторінку GreenKart (`https://rahulshettyacademy.com/seleniumPractise/#/`)

| № кроку | Опис кроку | Очікуваний результат | Фактичний результат |
|---|---|---|---|
| 1 | Натиснути «Top Deals» у шапці | Відкривається нова вкладка з URL `#/offers`; таблиця містить колонки «Veg/fruit name», «Price» і «Discount price» | |
| 2 | При розмірі сторінки 5 натиснути «Next» | Видимі рядки змінюються на наступну сторінку (наприклад, Pineapple, Orange, Mango, Guava, Dragon fruit) | |
| 3 | Натиснути «Last» | Відображається остання сторінка; кнопка «Last» стає неактивною | |

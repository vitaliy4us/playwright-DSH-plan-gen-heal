# TC-1.2 Порожній стан за відсутності збігів (should-show-empty-state-for-no-match)

**Передумови:** відкрито головну сторінку GreenKart (`https://rahulshettyacademy.com/seleniumPractise/#/`)

| № кроку | Опис кроку | Очікуваний результат | Фактичний результат |
|---|---|---|---|
| 1 | Ввести «xyz123» в поле пошуку «Search for Vegetables and Fruits» | Список товарів замінюється заголовком «Sorry, no products matched your search!» | |
| 2 | Перевірити підказку в порожньому стані | Відображається підказка «Enter a different keyword and try.» | |
| 3 | Очистити поле пошуку | Заголовок порожнього стану зникає, повний список товарів відновлюється | |

# TC-1.1 Фільтрація товарів за пошуком (should-filter-products-by-search)

**Передумови:** відкрито головну сторінку GreenKart (`https://rahulshettyacademy.com/seleniumPractise/#/`), повний каталог із 30 товарів

| № кроку | Опис кроку | Очікуваний результат | Фактичний результат |
|---|---|---|---|
| 1 | Ввести «ca» в поле пошуку «Search for Vegetables and Fruits» | Відображаються лише товари, що містять у назві «ca»: Cauliflower - 1 Kg, Carrot - 1 Kg, Capsicum, Cashews - 1 Kg | |
| 2 | Перевірити відсутність повідомлення про відсутність результатів | Заголовок «Sorry, no products matched your search!» не відображається | |
| 3 | Очистити поле пошуку | Відображаються всі 30 товарів, включно з Brocolli - 1 Kg і Walnuts - 1/4 Kg | |

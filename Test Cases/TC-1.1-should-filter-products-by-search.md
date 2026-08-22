# TC-1.1 Фильтрация товаров по поиску (should-filter-products-by-search)

**Предусловия:** открыта главная страница GreenKart (`https://rahulshettyacademy.com/seleniumPractise/#/`), полный каталог из 30 товаров

| № шага | Описание шага | Ожидаемый результат | Фактический результат |
|---|---|---|---|
| 1 | Ввести «ca» в поле поиска «Search for Vegetables and Fruits» | Отображаются только товары, содержащие в названии «ca»: Cauliflower - 1 Kg, Carrot - 1 Kg, Capsicum, Cashews - 1 Kg | |
| 2 | Проверить отсутствие сообщения об отсутствии результатов | Заголовок «Sorry, no products matched your search!» не отображается | |
| 3 | Очистить поле поиска | Отображаются все 30 товаров, включая Brocolli - 1 Kg и Walnuts - 1/4 Kg | |

# TC-1.2 Пустое состояние при отсутствии совпадений (should-show-empty-state-for-no-match)

**Предусловия:** открыта главная страница GreenKart (`https://rahulshettyacademy.com/seleniumPractise/#/`)

| № шага | Описание шага | Ожидаемый результат | Фактический результат |
|---|---|---|---|
| 1 | Ввести «xyz123» в поле поиска «Search for Vegetables and Fruits» | Список товаров заменяется заголовком «Sorry, no products matched your search!» | |
| 2 | Проверить подсказку в пустом состоянии | Отображается подсказка «Enter a different keyword and try.» | |
| 3 | Очистить поле поиска | Заголовок пустого состояния исчезает, полный список товаров восстанавливается | |

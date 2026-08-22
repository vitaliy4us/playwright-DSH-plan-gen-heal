# TC-4.1 Обязательное принятие условий (should-require-terms-acceptance)

**Предусловия:** открыта главная страница GreenKart, в корзине есть минимум один товар

| № шага | Описание шага | Ожидаемый результат | Фактический результат |
|---|---|---|---|
| 1 | Добавить любой товар в корзину, открыть корзину и нажать «PROCEED TO CHECKOUT» | URL становится `#/cart` | |
| 2 | Нажать «Place Order» | URL становится `#/country` | |
| 3 | Выбрать «India» в списке «Choose Country», оставить чекбокс Terms & Conditions неотмеченным и нажать «Proceed» | Появляется сообщение «Please accept Terms & Conditions - Required»; URL остаётся `#/country` | |

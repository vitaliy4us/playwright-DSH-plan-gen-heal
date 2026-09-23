# TC-4.1 Обов'язкове прийняття умов (should-require-terms-acceptance)

**Передумови:** відкрито головну сторінку GreenKart, у кошику є щонайменше один товар

| № кроку | Опис кроку | Очікуваний результат | Фактичний результат |
|---|---|---|---|
| 1 | Додати будь-який товар до кошика, відкрити кошик і натиснути «PROCEED TO CHECKOUT» | URL стає `#/cart` | |
| 2 | Натиснути «Place Order» | URL стає `#/country` | |
| 3 | Вибрати «India» у списку «Choose Country», залишити чекбокс Terms & Conditions не позначеним і натиснути «Proceed» | З'являється повідомлення «Please accept Terms & Conditions - Required»; URL залишається `#/country` | |

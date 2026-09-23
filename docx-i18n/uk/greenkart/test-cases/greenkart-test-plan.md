# План тестування GreenKart

## Огляд застосунку

GreenKart (https://rahulshettyacademy.com/seleniumPractise/#/) — демонстраційний вебзастосунок електронної комерції для купівлі овочів і фруктів. Головна сторінка містить 30 товарів, кожен із назвою, ціною за одиницю в рупіях (₹), кроковим регулятором кількості (мінус / spinbutton / плюс) і кнопкою "ADD TO CART". У шапці відображаються живий підсумок "Items" / "Price", живе поле пошуку товарів та іконка кошика, що відкриває випадний кошик. З випадного кошика користувач переходить на сторінку кошика (`#/cart`) з таблицею позицій, полем промокоду (валідний код `rahulshettyacademy` дає знижку 10%) і кнопкою "Place Order". Оформлення замовлення веде на сторінку вибору країни (`#/country`) з чекбоксом Terms & Conditions; після підтвердження кошик очищується і відбувається повернення до магазину. Окрема сторінка "Top Deals" (`#/offers`, відкривається в новій вкладці) показує таблицю пропозицій із пошуком, сортуванням, пагінацією та вибором дати доставки.

## Тестові сценарії

### 1. Пошук товарів

**Seed:** `tests/seed.spec.ts`

#### 1.1. should-filter-products-by-search

**Файл:** `tests/search/should-filter-products-by-search.spec.ts`

**Кроки:**
  1. Ввести "ca" у поле пошуку "Search for Vegetables and Fruits"
    - очікуваний результат: відображаються лише товари, назва яких містить "ca" (Cauliflower, Carrot, Capsicum, Cashews)
    - очікуваний результат: заголовок "Sorry, no products matched your search!" не відображається
  2. Очистити поле пошуку
    - очікуваний результат: знову видно всі 30 товарів (наприклад, присутні і Brocolli - 1 Kg, і Walnuts - 1/4 Kg)

#### 1.2. should-show-empty-state-for-no-match

**Файл:** `tests/search/should-show-empty-state-for-no-match.spec.ts`

**Кроки:**
  1. Ввести "xyz123" у поле пошуку
    - очікуваний результат: список товарів замінюється заголовком "Sorry, no products matched your search!"
    - очікуваний результат: видно підказку "Enter a different keyword and try."
  2. Очистити поле пошуку
    - очікуваний результат: заголовок порожнього стану зникає, повний список товарів відновлюється

### 2. Кошик

**Seed:** `tests/seed.spec.ts`

#### 2.1. should-add-single-product-to-cart

**Файл:** `tests/cart/should-add-single-product-to-cart.spec.ts`

**Кроки:**
  1. Натиснути "ADD TO CART" на картці "Brocolli - 1 Kg"
    - очікуваний результат: лічильник "Items" у шапці показує "1"
    - очікуваний результат: лічильник "Price" у шапці показує "120" (1 × ₹120)
  2. Натиснути іконку кошика, щоб відкрити випадний кошик
    - очікуваний результат: у кошику перелічено "Brocolli - 1 Kg", кількість "1 No." і сума "₹ 120"

#### 2.2. should-adjust-quantity-before-adding

**Файл:** `tests/cart/should-adjust-quantity-before-adding.spec.ts`

**Кроки:**
  1. На картці "Brocolli - 1 Kg" натиснути "+" двічі
    - очікуваний результат: поле кількості (spinbutton) показує "3"
  2. Натиснути "–" один раз
    - очікуваний результат: поле кількості (spinbutton) показує "2"
  3. Натиснути "–" ще двічі
    - очікуваний результат: кількість ніколи не опускається нижче "1"
    - очікуваний результат: поле кількості (spinbutton) показує "1"
  4. Натиснути "ADD TO CART"
    - очікуваний результат: у шапці "Items" показує "1", а "Price" показує "120" (1 × ₹120)
  5. Відкрити випадний кошик
    - очікуваний результат: кошик показує "Brocolli - 1 Kg", "1 No." і "₹ 120"

#### 2.3. should-remove-product-from-cart

**Файл:** `tests/cart/should-remove-product-from-cart.spec.ts`

**Кроки:**
  1. Додати "Brocolli - 1 Kg" до кошика
    - очікуваний результат: у шапці "Items" показує "1"
  2. Додати "Cauliflower - 1 Kg" до кошика
    - очікуваний результат: у шапці "Items" показує "2"
  3. Відкрити випадний кошик і натиснути "×" поруч із "Brocolli - 1 Kg"
    - очікуваний результат: "Brocolli - 1 Kg" більше не перелічено в кошику
    - очікуваний результат: у шапці "Items" показує "1"
    - очікуваний результат: у шапці "Price" показує "60" (залишилася лише Cauliflower)

### 3. Промокод

**Seed:** `tests/seed.spec.ts`

#### 3.1. should-reject-invalid-promo-code

**Файл:** `tests/promo/should-reject-invalid-promo-code.spec.ts`

**Кроки:**
  1. Додати 3 × "Brocolli - 1 Kg" (₹120 за штуку) до кошика, відкрити випадний кошик і натиснути "PROCEED TO CHECKOUT"
    - очікуваний результат: URL стає `#/cart`
  2. Ввести "INVALID123" у поле "Enter promo code" і натиснути "Apply"
    - очікуваний результат: з'являється повідомлення "Invalid code ..!"
    - очікуваний результат: "Discount : 0%" і "Total After Discount : 360" залишаються без змін

#### 3.2. should-apply-valid-promo-code

**Файл:** `tests/promo/should-apply-valid-promo-code.spec.ts`

**Кроки:**
  1. Додати 3 × "Brocolli - 1 Kg" (₹120 за штуку) до кошика і перейти до оформлення
    - очікуваний результат: "Total Amount :" дорівнює 360
  2. Ввести "rahulshettyacademy" у поле промокоду і натиснути "Apply"
    - очікуваний результат: з'являється повідомлення "Code applied ..!"
    - очікуваний результат: показано "Discount : 10%"
    - очікуваний результат: показано "Total After Discount : 324" (360 − 10%)

### 4. Оформлення замовлення

**Seed:** `tests/seed.spec.ts`

#### 4.1. should-require-terms-acceptance

**Файл:** `tests/checkout/should-require-terms-acceptance.spec.ts`

**Кроки:**
  1. Додати будь-який товар до кошика, перейти до оформлення і натиснути "Place Order"
    - очікуваний результат: URL стає `#/country`
  2. Вибрати "India" у списку "Choose Country", але залишити чекбокс Terms & Conditions не позначеним, потім натиснути "Proceed"
    - очікуваний результат: з'являється повідомлення "Please accept Terms & Conditions - Required"
    - очікуваний результат: URL залишається `#/country`

#### 4.2. should-place-order-successfully

**Файл:** `tests/checkout/should-place-order-successfully.spec.ts`

**Кроки:**
  1. Додати 2 × "Tomato - 1 Kg" (₹16 за штуку) до кошика і перейти до оформлення
    - очікуваний результат: сторінка кошика показує "No. of Items : 1" і суму "32"
  2. Натиснути "Place Order"
    - очікуваний результат: URL стає `#/country`
  3. Вибрати "India" у списку країн, позначити чекбокс Terms & Conditions, потім натиснути "Proceed"
    - очікуваний результат: з'являється повідомлення підтвердження "Thank you, your order has been placed successfully"
    - очікуваний результат: після авто-редиректу URL повертається на корінь магазину `#/`
    - очікуваний результат: лічильник "Items" у шапці показує "0" (кошик очищено)

### 5. Top Deals (Offers)

**Seed:** `tests/seed.spec.ts`

#### 5.1. should-show-offers-table-with-pagination

**Файл:** `tests/offers/should-show-offers-table-with-pagination.spec.ts`

**Кроки:**
  1. Натиснути "Top Deals" у шапці
    - очікуваний результат: відкривається нова вкладка з URL `#/offers`
    - очікуваний результат: таблиця має колонки "Veg/fruit name", "Price" і "Discount price"
  2. При розмірі сторінки 5 натиснути "Next"
    - очікуваний результат: видимі рядки змінюються на наступну сторінку (наприклад, Pineapple, Orange, Mango, Guava, Dragon fruit)
  3. Натиснути "Last"
    - очікуваний результат: показано останню сторінку, і кнопка "Last" стає недоступною

#### 5.2. should-sort-offers-table

**Файл:** `tests/offers/should-sort-offers-table.spec.ts`

**Кроки:**
  1. Відкрити сторінку пропозицій (`#/offers`)
    - очікуваний результат: статус сортування показує "Sorted by name: descending order"
  2. Натиснути заголовок колонки "Veg/fruit name"
    - очікуваний результат: статус сортування показує "Sorted by name: ascending order"
    - очікуваний результат: назва першого рядка — перша за алфавітом серед видимих рядків
  3. Натиснути заголовок колонки "Price"
    - очікуваний результат: статус сортування відображає сортування за ціною

#### 5.3. should-search-offers-table

**Файл:** `tests/offers/should-search-offers-table.spec.ts`

**Кроки:**
  1. Відкрити сторінку пропозицій (`#/offers`)
  2. Ввести "Orange" у поле "Search:"
    - очікуваний результат: залишається видимим лише рядок "Orange" з його Price і Discount price
  3. Очистити поле пошуку
    - очікуваний результат: повна таблиця відновлюється

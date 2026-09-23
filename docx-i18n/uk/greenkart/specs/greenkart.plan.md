# План тестування GreenKart

## Огляд застосунку

GreenKart (https://rahulshettyacademy.com/seleniumPractise/#/) — демонстраційний вебзастосунок електронної комерції для купівлі овочів і фруктів. Головна сторінка містить 30 товарів, кожен із назвою, ціною за одиницю в рупіях (₹), степпером кількості (мінус / spinbutton / плюс) і кнопкою «ADD TO CART». Заголовок показує живий підсумок «Items» / «Price», живе поле пошуку товарів і значок кошика, який відкриває панель кошика. З панелі кошика користувач переходить на сторінку кошика (`#/cart`) з деталізованою таблицею, полем промокоду (дійсний код `rahulshettyacademy` дає 10% знижки) і кнопкою «Place Order». Розміщення замовлення веде на сторінку вибору країни (`#/country`) з чекбоксом Terms & Conditions; після підтвердження кошик очищується і відбувається повернення до магазину. Окрема сторінка «Top Deals» (`#/offers`, відкривається в новій вкладці) показує таблицю пропозицій із пошуком, сортуванням, посторінковою навігацією та вибором дати доставки.

## Сценарії тестування

### 1. Пошук товарів

**Seed-тест:** `tests/seed.spec.ts`

#### 1.1. should-filter-products-by-search

**Файл:** `tests/search/should-filter-products-by-search.spec.ts`

**Кроки:**
  1. Ввести "ca" у поле пошуку "Search for Vegetables and Fruits"
    - очікуваний результат: показано лише товари, назва яких містить "ca" (Cauliflower, Carrot, Capsicum, Cashews)
    - очікуваний результат: заголовок "Sorry, no products matched your search!" не видно
  2. Очистити поле пошуку
    - очікуваний результат: знову видно всі 30 товарів (наприклад, присутні і Brocolli - 1 Kg, і Walnuts - 1/4 Kg)

#### 1.2. should-show-empty-state-for-no-match

**Файл:** `tests/search/should-show-empty-state-for-no-match.spec.ts`

**Кроки:**
  1. Ввести "xyz123" у поле пошуку
    - очікуваний результат: список товарів замінено заголовком "Sorry, no products matched your search!"
    - очікуваний результат: видно підказку "Enter a different keyword and try."
  2. Очистити поле пошуку
    - очікуваний результат: заголовок порожнього стану зникає, а повний список товарів відновлюється

### 2. Кошик

**Seed-тест:** `tests/seed.spec.ts`

#### 2.1. should-add-single-product-to-cart

**Файл:** `tests/cart/should-add-single-product-to-cart.spec.ts`

**Кроки:**
  1. Натиснути "ADD TO CART" на картці "Brocolli - 1 Kg"
    - очікуваний результат: лічильник "Items" у заголовку показує "1"
    - очікуваний результат: лічильник "Price" у заголовку показує "120" (1 × ₹120)
  2. Натиснути значок кошика, щоб відкрити панель кошика
    - очікуваний результат: панель показує "Brocolli - 1 Kg", кількість "1 No." і суму "₹ 120"

#### 2.2. should-adjust-quantity-before-adding

**Файл:** `tests/cart/should-adjust-quantity-before-adding.spec.ts`

**Кроки:**
  1. На картці "Brocolli - 1 Kg" натиснути "+" двічі
    - очікуваний результат: spinbutton кількості показує "3"
  2. Натиснути "–" один раз
    - очікуваний результат: spinbutton кількості показує "2"
  3. Натиснути "–" ще двічі
    - очікуваний результат: кількість ніколи не падає нижче "1"
    - очікуваний результат: spinbutton кількості показує "1"
  4. Натиснути "ADD TO CART"
    - очікуваний результат: у заголовку "Items" показує "1", а "Price" показує "120" (1 × ₹120)
  5. Відкрити панель кошика
    - очікуваний результат: панель показує "Brocolli - 1 Kg", "1 No." і "₹ 120"

#### 2.3. should-remove-product-from-cart

**Файл:** `tests/cart/should-remove-product-from-cart.spec.ts`

**Кроки:**
  1. Додати "Brocolli - 1 Kg" до кошика
    - очікуваний результат: у заголовку "Items" показує "1"
  2. Додати "Cauliflower - 1 Kg" до кошика
    - очікуваний результат: у заголовку "Items" показує "2"
  3. Відкрити панель кошика й натиснути "×" біля "Brocolli - 1 Kg"
    - очікуваний результат: "Brocolli - 1 Kg" більше не вказано в панелі
    - очікуваний результат: у заголовку "Items" показує "1"
    - очікуваний результат: у заголовку "Price" показує "60" (залишилася лише Cauliflower)

### 3. Промокод

**Seed-тест:** `tests/seed.spec.ts`

#### 3.1. should-reject-invalid-promo-code

**Файл:** `tests/promo/should-reject-invalid-promo-code.spec.ts`

**Кроки:**
  1. Додати 3 × "Brocolli - 1 Kg" (₹120 кожен) до кошика, відкрити панель кошика й натиснути "PROCEED TO CHECKOUT"
    - очікуваний результат: URL стає `#/cart`
  2. Ввести "INVALID123" у поле "Enter promo code" і натиснути "Apply"
    - очікуваний результат: з'являється повідомлення "Invalid code ..!"
    - очікуваний результат: "Discount : 0%" і "Total After Discount : 360" залишаються незмінними

#### 3.2. should-apply-valid-promo-code

**Файл:** `tests/promo/should-apply-valid-promo-code.spec.ts`

**Кроки:**
  1. Додати 3 × "Brocolli - 1 Kg" (₹120 кожен) до кошика й перейти до оформлення замовлення
    - очікуваний результат: "Total Amount :" становить 360
  2. Ввести "rahulshettyacademy" у поле промокоду й натиснути "Apply"
    - очікуваний результат: з'являється повідомлення "Code applied ..!"
    - очікуваний результат: показано "Discount : 10%"
    - очікуваний результат: показано "Total After Discount : 324" (360 − 10%)

### 4. Оформлення та розміщення замовлення

**Seed-тест:** `tests/seed.spec.ts`

#### 4.1. should-require-terms-acceptance

**Файл:** `tests/checkout/should-require-terms-acceptance.spec.ts`

**Кроки:**
  1. Додати будь-який товар до кошика, перейти до оформлення замовлення й натиснути "Place Order"
    - очікуваний результат: URL стає `#/country`
  2. Виберіть "India" у випадаючому списку "Choose Country", але залиште чекбокс Terms & Conditions не позначеним, потім натисніть "Proceed"
    - очікуваний результат: з'являється повідомлення "Please accept Terms & Conditions - Required"
    - очікуваний результат: URL залишається `#/country`

#### 4.2. should-place-order-successfully

**Файл:** `tests/checkout/should-place-order-successfully.spec.ts`

**Кроки:**
  1. Додати 2 × "Tomato - 1 Kg" (₹16 кожен) до кошика й перейти до оформлення замовлення
    - очікуваний результат: сторінка кошика показує "No. of Items : 1" і підсумок "32"
  2. Натиснути "Place Order"
    - очікуваний результат: URL стає `#/country`
  3. Виберіть "India" у випадаючому списку країн, позначте чекбокс Terms & Conditions, потім натисніть "Proceed"
    - очікуваний результат: з'являється повідомлення підтвердження "Thank you, your order has been placed successfully"
    - очікуваний результат: після автоматичного перенаправлення URL повертається до кореня магазину `#/`
    - очікуваний результат: лічильник "Items" у заголовку показує "0" (кошик очищено)

### 5. Top Deals (пропозиції)

**Seed-тест:** `tests/seed.spec.ts`

#### 5.1. should-show-offers-table-with-pagination

**Файл:** `tests/offers/should-show-offers-table-with-pagination.spec.ts`

**Кроки:**
  1. Натиснути "Top Deals" у заголовку
    - очікуваний результат: відкривається нова вкладка з URL `#/offers`
    - очікуваний результат: таблиця має стовпці "Veg/fruit name", "Price" і "Discount price"
  2. За розміру сторінки 5 натиснути "Next"
    - очікуваний результат: видимі рядки змінюються на наступну сторінку (наприклад, Pineapple, Orange, Mango, Guava, Dragon fruit)
  3. Натиснути "Last"
    - очікуваний результат: показано останню сторінку, а кнопка "Last" стає неактивною

#### 5.2. should-sort-offers-table

**Файл:** `tests/offers/should-sort-offers-table.spec.ts`

**Кроки:**
  1. Відкрити сторінку пропозицій (`#/offers`)
    - очікуваний результат: статус сортування показує "Sorted by name: descending order"
  2. Натиснути заголовок стовпця "Veg/fruit name"
    - очікуваний результат: статус сортування показує "Sorted by name: ascending order"
    - очікуваний результат: назва першого рядка є першою за алфавітом серед видимих рядків
  3. Натиснути заголовок стовпця "Price"
    - очікуваний результат: статус сортування відображає сортування за ціною

#### 5.3. should-search-offers-table

**Файл:** `tests/offers/should-search-offers-table.spec.ts`

**Кроки:**
  1. Відкрити сторінку пропозицій (`#/offers`)
  2. Ввести "Orange" у поле "Search:"
    - очікуваний результат: залишається видимим лише рядок "Orange" з його Price і Discount price
  3. Очистити поле пошуку
    - очікуваний результат: повна таблиця відновлюється

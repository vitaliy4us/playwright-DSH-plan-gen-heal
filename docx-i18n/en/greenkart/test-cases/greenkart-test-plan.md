# GreenKart Test Plan

## Application Overview

GreenKart (https://rahulshettyacademy.com/seleniumPractise/#/) is a demo e-commerce web application for buying vegetables and fruits. The main page lists 30 products, each with a name, unit price in rupees (₹), a quantity stepper (minus / spinbutton / plus) and an "ADD TO CART" button. A header shows a live "Items" / "Price" summary, a live product search box, and a cart icon that opens the cart drawer. From the cart drawer the user proceeds to a cart page (`#/cart`) with an itemized table, a promo code field (valid code `rahulshettyacademy` applies a 10% discount), and a "Place Order" button. Placing an order leads to a country selection page (`#/country`) with a Terms & Conditions checkbox; submitting clears the cart and returns to the shop. A separate "Top Deals" page (`#/offers`, opens in a new tab) shows a searchable, sortable, paginated offers table with a delivery date picker.

## Test Scenarios

### 1. Product Search

**Seed:** `tests/seed.spec.ts`

#### 1.1. should-filter-products-by-search

**File:** `tests/search/should-filter-products-by-search.spec.ts`

**Steps:**
  1. Type "ca" into the "Search for Vegetables and Fruits" search box
    - expect: only products whose name contains "ca" are shown (Cauliflower, Carrot, Capsicum, Cashews)
    - expect: the "Sorry, no products matched your search!" heading is not visible
  2. Clear the search box
    - expect: all 30 products are visible again (e.g. Brocolli - 1 Kg and Walnuts - 1/4 Kg are both present)

#### 1.2. should-show-empty-state-for-no-match

**File:** `tests/search/should-show-empty-state-for-no-match.spec.ts`

**Steps:**
  1. Type "xyz123" into the search box
    - expect: the product list is replaced by the "Sorry, no products matched your search!" heading
    - expect: the hint "Enter a different keyword and try." is visible
  2. Clear the search box
    - expect: the empty-state heading disappears and the full product list is restored

### 2. Shopping Cart

**Seed:** `tests/seed.spec.ts`

#### 2.1. should-add-single-product-to-cart

**File:** `tests/cart/should-add-single-product-to-cart.spec.ts`

**Steps:**
  1. Click "ADD TO CART" on the "Brocolli - 1 Kg" card
    - expect: header "Items" counter shows "1"
    - expect: header "Price" counter shows "120" (1 × ₹120)
  2. Click the cart icon to open the cart drawer
    - expect: drawer lists "Brocolli - 1 Kg", quantity "1 No." and amount "₹ 120"

#### 2.2. should-adjust-quantity-before-adding

**File:** `tests/cart/should-adjust-quantity-before-adding.spec.ts`

**Steps:**
  1. On the "Brocolli - 1 Kg" card, click "+" twice
    - expect: the quantity spinbutton shows "3"
  2. Click "–" once
    - expect: the quantity spinbutton shows "2"
  3. Click "–" twice more
    - expect: the quantity never drops below "1"
    - expect: the quantity spinbutton shows "1"
  4. Click "ADD TO CART"
    - expect: header "Items" shows "1" and header "Price" shows "120" (1 × ₹120)
  5. Open the cart drawer
    - expect: drawer shows "Brocolli - 1 Kg", "1 No." and "₹ 120"

#### 2.3. should-remove-product-from-cart

**File:** `tests/cart/should-remove-product-from-cart.spec.ts`

**Steps:**
  1. Add "Brocolli - 1 Kg" to the cart
    - expect: header "Items" shows "1"
  2. Add "Cauliflower - 1 Kg" to the cart
    - expect: header "Items" shows "2"
  3. Open the cart drawer and click "×" next to "Brocolli - 1 Kg"
    - expect: "Brocolli - 1 Kg" is no longer listed in the drawer
    - expect: header "Items" shows "1"
    - expect: header "Price" shows "60" (only Cauliflower remains)

### 3. Promo Code

**Seed:** `tests/seed.spec.ts`

#### 3.1. should-reject-invalid-promo-code

**File:** `tests/promo/should-reject-invalid-promo-code.spec.ts`

**Steps:**
  1. Add 3 × "Brocolli - 1 Kg" (₹120 each) to the cart, open the cart drawer and click "PROCEED TO CHECKOUT"
    - expect: URL becomes `#/cart`
  2. Type "INVALID123" into the "Enter promo code" field and click "Apply"
    - expect: the message "Invalid code ..!" appears
    - expect: "Discount : 0%" and "Total After Discount : 360" remain unchanged

#### 3.2. should-apply-valid-promo-code

**File:** `tests/promo/should-apply-valid-promo-code.spec.ts`

**Steps:**
  1. Add 3 × "Brocolli - 1 Kg" (₹120 each) to the cart and proceed to checkout
    - expect: "Total Amount :" is 360
  2. Type "rahulshettyacademy" into the promo code field and click "Apply"
    - expect: the message "Code applied ..!" appears
    - expect: "Discount : 10%" is shown
    - expect: "Total After Discount : 324" is shown (360 − 10%)

### 4. Checkout and Order Placement

**Seed:** `tests/seed.spec.ts`

#### 4.1. should-require-terms-acceptance

**File:** `tests/checkout/should-require-terms-acceptance.spec.ts`

**Steps:**
  1. Add any product to the cart, proceed to checkout and click "Place Order"
    - expect: URL becomes `#/country`
  2. Select "India" in the "Choose Country" dropdown but leave the Terms & Conditions checkbox unchecked, then click "Proceed"
    - expect: the message "Please accept Terms & Conditions - Required" appears
    - expect: URL remains `#/country`

#### 4.2. should-place-order-successfully

**File:** `tests/checkout/should-place-order-successfully.spec.ts`

**Steps:**
  1. Add 2 × "Tomato - 1 Kg" (₹16 each) to the cart and proceed to checkout
    - expect: cart page shows "No. of Items : 1" and total "32"
  2. Click "Place Order"
    - expect: URL becomes `#/country`
  3. Select "India" in the country dropdown and check the Terms & Conditions checkbox, then click "Proceed"
    - expect: a confirmation message "Thank you, your order has been placed successfully" appears
    - expect: URL returns to the shop root `#/` after the auto-redirect
    - expect: header "Items" counter shows "0" (cart is cleared)

### 5. Top Deals (Offers)

**Seed:** `tests/seed.spec.ts`

#### 5.1. should-show-offers-table-with-pagination

**File:** `tests/offers/should-show-offers-table-with-pagination.spec.ts`

**Steps:**
  1. Click "Top Deals" in the header
    - expect: a new tab opens with URL `#/offers`
    - expect: the table has columns "Veg/fruit name", "Price" and "Discount price"
  2. With page size 5, click "Next"
    - expect: the visible rows change to the next page (e.g. Pineapple, Orange, Mango, Guava, Dragon fruit)
  3. Click "Last"
    - expect: the last page is shown and the "Last" button becomes disabled

#### 5.2. should-sort-offers-table

**File:** `tests/offers/should-sort-offers-table.spec.ts`

**Steps:**
  1. Open the offers page (`#/offers`)
    - expect: the sort status reads "Sorted by name: descending order"
  2. Click the "Veg/fruit name" column header
    - expect: the sort status reads "Sorted by name: ascending order"
    - expect: the first row name is alphabetically first among the visible rows
  3. Click the "Price" column header
    - expect: the sort status reflects sorting by price

#### 5.3. should-search-offers-table

**File:** `tests/offers/should-search-offers-table.spec.ts`

**Steps:**
  1. Open the offers page (`#/offers`)
  2. Type "Orange" into the "Search:" box
    - expect: only the "Orange" row remains visible with its Price and Discount price
  3. Clear the search box
    - expect: the full table is restored

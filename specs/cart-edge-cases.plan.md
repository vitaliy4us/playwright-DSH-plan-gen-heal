# GreenKart Cart Edge Cases Test Plan

## Application Overview

This plan adds one new group, "Cart Edge Cases", to the existing coverage in specs/greenkart.plan.md. It targets cart behaviour that the existing plan does not cover.

Observed behaviour of the application (verified during planning):

- Cart state is persisted in localStorage under the keys app_data_info, app_data_qty, app_data_tqty and app_data_tamt, and the cart is restored when the app is opened again.
- Adding the same product twice does NOT create a second row: the single cart row grows to "2 Nos." and its amount doubles, while the header "Items" counter stays at "1" because it counts distinct products, not total quantity. The header "Price" counter does sum all amounts.
- The cart icon shows a badge (.cart-count) that equals the number of distinct products and disappears when the cart becomes empty.
- The cart drawer is opened by clicking the "Cart" link in the header; it then has the class "cart-preview active". Its rows are list items whose quantity is in .quantity ("2 Nos.") and amount in .amount ("240"). Note: the drawer markup is present in the DOM while the drawer is closed, so assertions on drawer content alone can pass while the drawer is not open.
- With an empty cart the drawer shows an .empty-cart block whose heading text is literally "You cart is empty!" (the application's own wording, not "Your cart").
- There is NO validation that blocks the checkout flow when the cart is empty: "PROCEED TO CHECKOUT" navigates to #/cart (empty state, all totals zero, no product table), "Place Order" navigates to #/country, and completing the country step returns to the shop as if an order had been placed.

Points worth noting while testing: the rupee sign is rendered through CSS (::before) and is not part of the element text, so assertions should use the numeric parts or the .quantity/.amount classes; console errors from favicon.ico (ERR_TOO_MANY_REDIRECTS) are unrelated site noise.

### Expected behaviour vs observed behaviour (known deviations)

Part of this plan describes what the application *actually does*. Where that contradicts what a user would expect, the deviation is recorded as a defect below, and the affected scenarios state the expectation explicitly so the gap stays visible instead of hiding behind a green test.

| # | Expectation | Observed | Defect report |
|---|---|---|---|
| 1 | A cart survives a page reload | The cart is lost when the page is reloaded within ~1 s of a change: the application flushes the cart to localStorage about 1 s after a change, and its startup overwrites the stored state with `"null"` | `Bug Reports/BUG-1-cart-is-lost-on-immediate-reload.md` |
| 2 | An empty cart cannot be ordered | Every step of the checkout flow is allowed with an empty cart, and the application returns to the shop as if an order had been placed | `Bug Reports/BUG-2-empty-cart-can-be-ordered.md` |

Scenarios 1.5 and 1.6 document the *observed* behaviour (they stay green on purpose, so a change in the application is caught). Scenario 1.7 states the *expectation* for an empty cart and is marked `test.fixme()` until the defect is resolved.

## Test Scenarios

### 1. Cart Edge Cases

**Seed:** `tests/seed.spec.ts`

#### 1.1. should-persist-cart-after-app-reload

**File:** `tests/cart-edge-cases/should-persist-cart-after-app-reload.spec.ts`

**Steps:**
  1. Click "ADD TO CART" on the "Brocolli - 1 Kg" product card
    - expect: the header "Items" counter shows "1"
    - expect: the header "Price" counter shows "120"
    - expect: the cart icon badge (.cart-count) shows "1"
  2. Reload the page with page.reload()
    - expect: the header "Items" counter still shows "1" (the cart is restored from localStorage)
    - expect: the header "Price" counter still shows "120"
    - expect: the cart icon badge (.cart-count) still shows "1"

#### 1.2. should-increment-quantity-when-same-product-is-added-twice

**File:** `tests/cart-edge-cases/should-increment-quantity-when-same-product-is-added-twice.spec.ts`

**Steps:**
  1. Click "ADD TO CART" on the "Brocolli - 1 Kg" product card
    - expect: the header "Items" counter shows "1"
    - expect: the header "Price" counter shows "120"
  2. Click "ADD TO CART" on the same "Brocolli - 1 Kg" product card again
    - expect: the header "Items" counter still shows "1" because it counts distinct products, not total quantity
    - expect: the header "Price" counter shows "240"
  3. Click the "Cart" link in the header to open the cart drawer
    - expect: the drawer contains exactly one row for "Brocolli - 1 Kg"
    - expect: that row's .quantity shows "2 Nos."
    - expect: that row's .amount shows "240"

#### 1.3. should-count-distinct-products-in-header-counters

**File:** `tests/cart-edge-cases/should-count-distinct-products-in-header-counters.spec.ts`

**Steps:**
  1. Click "ADD TO CART" on the "Brocolli - 1 Kg" product card
    - expect: the header "Items" counter shows "1"
    - expect: the header "Price" counter shows "120"
  2. Click "ADD TO CART" on the "Cauliflower - 1 Kg" product card
    - expect: the header "Items" counter shows "2"
    - expect: the header "Price" counter shows "180"
  3. Click "ADD TO CART" on the "Brocolli - 1 Kg" product card once more
    - expect: the header "Items" counter still shows "2"
    - expect: the header "Price" counter shows "300"
  4. Click the "Cart" link in the header to open the cart drawer
    - expect: the drawer contains exactly two rows
    - expect: the "Brocolli - 1 Kg" row has .quantity "2 Nos." and .amount "240"
    - expect: the "Cauliflower - 1 Kg" row has .quantity "1 No." and .amount "60"

#### 1.4. should-show-empty-cart-state-after-removing-the-last-product

**File:** `tests/cart-edge-cases/should-show-empty-cart-state-after-removing-the-last-product.spec.ts`

**Steps:**
  1. Click "ADD TO CART" on the "Brocolli - 1 Kg" product card
    - expect: the header "Items" counter shows "1"
  2. Click the "Cart" link in the header to open the cart drawer
    - expect: the drawer row for "Brocolli - 1 Kg" is visible
    - expect: that row's .quantity shows "1 No."
  3. Click the remove ("×") link inside the "Brocolli - 1 Kg" drawer row
    - expect: the drawer shows the empty-cart block with the text "You cart is empty!" (the application's literal wording)
    - expect: the header "Items" counter shows "0"
    - expect: the header "Price" counter shows "0"
    - expect: the cart icon badge (.cart-count) is no longer present

#### 1.5. should-show-zero-totals-on-cart-page-when-cart-is-empty

**File:** `tests/cart-edge-cases/should-show-zero-totals-on-cart-page-when-cart-is-empty.spec.ts`

**Steps:**
  1. Click the "Cart" link in the header to open the cart drawer with an empty cart
    - expect: the drawer shows "You cart is empty!"
  2. Click "PROCEED TO CHECKOUT" in the drawer
    - expect: the URL ends with "#/cart"
    - expect: the page still shows the empty-cart message "You cart is empty!"
    - expect: there is no itemised product table (#productCartTables is absent)
    - expect: "No. of Items : 0" is shown
    - expect: "Total Amount : 0" is shown
    - expect: "Discount : 0%" is shown
    - expect: "Total After Discount : 0" is shown

  > **Note:** this scenario documents the *observed* rendering of the cart page with an empty cart. It deliberately does not assert that ordering is blocked — that expectation is covered by scenario 1.7 (see `Bug Reports/BUG-2-empty-cart-can-be-ordered.md`).

#### 1.6. should-allow-completing-an-order-with-an-empty-cart

**File:** `tests/cart-edge-cases/should-allow-completing-an-order-with-an-empty-cart.spec.ts`

**Steps:**
  1. Open the cart drawer with an empty cart and click "PROCEED TO CHECKOUT"
    - expect: the URL ends with "#/cart"
  2. Click "Place Order" on the cart page
    - expect: the URL ends with "#/country" — the application does not block ordering with an empty cart
  3. Check the Terms & Conditions checkbox and click "Proceed"
    - expect: the application returns to the shop (the URL ends with "#/")
    - expect: no error message is shown to the user

  > **Note:** this scenario documents the *observed* behaviour, which contradicts the expectation stated in 1.7. It stays green on purpose: if the application starts blocking empty-cart checkout, this test will fail and point at the behaviour change.

#### 1.7. should-not-offer-order-placement-when-the-cart-is-empty

**File:** `tests/cart-edge-cases/should-not-offer-order-placement-when-the-cart-is-empty.spec.ts`

**Expected behaviour (tester's expectation, pending a product decision — see `Bug Reports/BUG-2-empty-cart-can-be-ordered.md`):** with an empty cart the application must not let the user place an order; the "Place Order" action must be unavailable on the cart page.

**Steps:**
  1. Click the "Cart" link in the header to open the cart drawer with an empty cart
    - expect: the drawer shows "You cart is empty!"
  2. Click "PROCEED TO CHECKOUT" in the drawer
    - expect: the URL ends with "#/cart"
  3. Inspect the "Place Order" action on the cart page
    - expect: "Place Order" is disabled (or absent) — an empty cart must not be orderable
    - expect: no order can be completed with an empty cart

**Status:** red by design. The test is marked `test.fixme()`: today "Place Order" is enabled and starts the order flow (see scenario 1.6).

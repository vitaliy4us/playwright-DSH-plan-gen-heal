# GreenKart Search and Cart Test Plan

## Application Overview

This plan adds one new group, "Search and Cart", covering the interaction between the product search box and the cart. Neither specs/greenkart.plan.md (search alone, cart alone) nor specs/cart-edge-cases.plan.md (cart edge cases) covers this combination.

Observed behaviour of the application (verified during planning):

- Search filters by a case-insensitive substring of the product name: "ca" and "CA" both return exactly the same four products — Cauliflower - 1 Kg, Carrot - 1 Kg, Capsicum, Cashews - 1 Kg — in the same order.
- The application REMOVES non-matching product cards from the DOM instead of hiding them: the `.products` container holds only the matching children (4 elements for "ca", 30 for an empty query). A query with no matches leaves `.products` empty.
- Locator trap: a naive `.product` selector also matches an unrelated hidden node whose classes are "showPriceWrapper product" (outside the `.products` container). Scope product locators to `.products > .product`, or match by product name.
- "ADD TO CART" works on a filtered card exactly as on the full catalogue, and the filter stays applied after adding.
- The cart is independent of the search filter: clearing the search restores all 30 products while the cart keeps its contents. The first product after clearing is "Brocolli - 1 Kg" and the last is "Walnuts - 1/4 Kg".
- The search box reacts to ordinary input events, so clearing it with fill('') (or selecting all and deleting) re-renders the full catalogue.
- Trap: navigating to the same URL with the same hash does NOT reload this single-page application — the search box keeps its value. Use a real reload when the scenario needs a fresh state.

Points worth noting while testing: the rupee sign is rendered through CSS (::before) and is not part of the element text, so assert the numeric parts or the .quantity/.amount classes; console errors from favicon.ico (ERR_TOO_MANY_REDIRECTS) are unrelated site noise.

## Test Scenarios

### 1. Search and Cart

**Seed:** `tests/seed.spec.ts`

#### 1.1. should-add-product-from-filtered-search-results

**File:** `tests/search-and-cart/should-add-product-from-filtered-search-results.spec.ts`

**Steps:**
  1. Type "ca" into the "Search for Vegetables and Fruits" search box
    - expect: exactly four product cards are shown: "Cauliflower - 1 Kg", "Carrot - 1 Kg", "Capsicum", "Cashews - 1 Kg"
    - expect: a product that does not contain "ca" (for example "Brocolli - 1 Kg") is not shown at all
    - expect: the header "Items" counter shows "0"
  2. Click "ADD TO CART" on the "Cauliflower - 1 Kg" card inside the filtered results
    - expect: the header "Items" counter shows "1"
    - expect: the header "Price" counter shows "60"
    - expect: the cart icon badge (.cart-count) shows "1"
    - expect: the filter is still applied: the same four products remain visible
  3. Click the "Cart" link in the header to open the cart drawer
    - expect: the drawer contains one row for "Cauliflower - 1 Kg"
    - expect: that row's .quantity shows "1 No."
    - expect: that row's .amount shows "60"

#### 1.2. should-keep-cart-when-search-is-cleared

**File:** `tests/search-and-cart/should-keep-cart-when-search-is-cleared.spec.ts`

**Steps:**
  1. Type "ca" into the search box and click "ADD TO CART" on "Cauliflower - 1 Kg"
    - expect: the header "Items" counter shows "1"
    - expect: the header "Price" counter shows "60"
  2. Clear the search box
    - expect: all 30 products are shown again: "Brocolli - 1 Kg" is visible as the first card and "Walnuts - 1/4 Kg" as the last
    - expect: the cart is unchanged: the header "Items" counter still shows "1" and "Price" still shows "60"
    - expect: the cart icon badge (.cart-count) still shows "1"
  3. Open the cart drawer
    - expect: the drawer still contains the "Cauliflower - 1 Kg" row with .quantity "1 No." and .amount "60"

#### 1.3. should-search-case-insensitively

**File:** `tests/search-and-cart/should-search-case-insensitively.spec.ts`

**Steps:**
  1. Type "CA" (uppercase) into the search box
    - expect: exactly the same four products are shown as for the lowercase query: "Cauliflower - 1 Kg", "Carrot - 1 Kg", "Capsicum", "Cashews - 1 Kg"
    - expect: the matching is still a filter and not a "show everything": "Brocolli - 1 Kg" is absent
    - expect: the header counters are untouched by searching: "Items" shows "0" and "Price" shows "0"

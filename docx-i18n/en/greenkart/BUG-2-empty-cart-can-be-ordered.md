# BUG-2 An order can be placed with an empty cart — no validation

**Severity:** low — the incorrect scenario is not blocked (a product decision, the requirements need confirmation)
**Component:** cart → checkout
**Environment:** GreenKart `https://rahulshettyacademy.com/seleniumPractise/#/`, Chromium (project `chromium`), Windows
**Found:** in the plan → generate → heal cycle while exploring the edge cases of the cart

## Summary

With an empty cart the application blocks no step of the checkout. The user goes the whole way to "confirmation" and returns to the main page as if the order had been placed.

## Preconditions

The GreenKart main page is open, the cart is empty (`Items : 0`).

## Steps to reproduce

| Step # | Step description | Expected result | Actual result |
|---|---|---|---|
| 1 | Click the cart icon | The drop-down cart opens with the message "You cart is empty!" | Matches the expected result |
| 2 | Click "PROCEED TO CHECKOUT" | The transition to checkout is blocked, or the button is unavailable | The transition to `#/cart` happens; there is no product table and the totals are zero |
| 3 | Click "Place Order" | Checkout is blocked and a message about the empty cart is shown | The transition to `#/country` happens |
| 4 | Accept the terms and click "Proceed" | Checkout is blocked | The user returns to the main page `#/`; the screen "Thank you, your order has been placed…" is not shown |

## Evidence

- On the `#/cart` page with an empty cart: the message "You cart is empty!", no `#productCartTables` table, the values `.totAmt` = 0, `.discountPerc` = 0%, `.discountAmt` = 0 — and yet the "Apply" and "Place Order" buttons are **available and active**.
- The transitions are confirmed by the URL: `#/cart` → `#/country` → `#/`.
- For comparison: when ordering with products, the application shows the confirmation screen "Thank you, your order has been placed successfully…" and only then returns to the main page. With an empty cart this screen does not appear at all.

## Impact

The user can complete the whole checkout process without a single product and get behaviour indistinguishable from a successful order. If the application ever gets a backend, this will lead to the creation of empty orders. For now (a demo application with no backend) the impact is limited to a false sense of a successful order and the absence of explicit feedback.

## Recommendation

Decide on the requirement and bring the behaviour in line with it. The most predictable option: on the cart page, when the cart is empty, make "Place Order" unavailable (disabled) or show an explicit "Cart is empty" message instead of the transition. In addition — hide or block "PROCEED TO CHECKOUT" in the drop-down cart.

## Related artefacts

- Tests documenting the current behaviour: `tests/cart-edge-cases/should-show-zero-totals-on-cart-page-when-cart-is-empty.spec.ts`, `tests/cart-edge-cases/should-allow-completing-an-order-with-an-empty-cart.spec.ts`.
- The test for the expected behaviour (marked `test.fixme()` until it is fixed): `tests/cart-edge-cases/should-not-offer-order-placement-when-the-cart-is-empty.spec.ts`.
- Plan: `specs/cart-edge-cases.plan.md`.

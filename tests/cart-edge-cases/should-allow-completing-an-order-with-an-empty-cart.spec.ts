// spec: specs/cart-edge-cases.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Cart Edge Cases', () => {
  // Documents the OBSERVED behaviour: the application allows every step of the checkout flow with
  // an empty cart. This contradicts the expectation asserted in
  // should-not-offer-order-placement-when-the-cart-is-empty.spec.ts.
  // Defect report: Bug Reports/BUG-2-empty-cart-can-be-ordered.md
  test('should-allow-completing-an-order-with-an-empty-cart', async ({ page }) => {
    // 1. Open the cart drawer with an empty cart and proceed to checkout
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'PROCEED TO CHECKOUT' }).click();

    // expect: the URL ends with "#/cart"
    await expect(page).toHaveURL(/#\/cart$/);

    // 2. Click "Place Order" on the cart page
    await page.getByRole('button', { name: 'Place Order' }).click();

    // expect: the URL ends with "#/country" — the application does not block ordering
    // with an empty cart (no validation of the empty cart exists)
    await expect(page).toHaveURL(/#\/country$/);

    // 3. Check the "Terms & Conditions" checkbox and click "Proceed"
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Proceed' }).click();

    // expect: the application returns to the shop (the URL ends with "#/") without showing
    // any error — it behaves as if an order had been placed.
    // The application keeps the confirmation screen at "#/country" for several seconds before
    // redirecting, so this assertion needs the same extended timeout the existing checkout
    // test uses (tests/checkout/should-place-order-successfully.spec.ts).
    await expect(page).toHaveURL(/#\/$/, { timeout: 15000 });
    // expect: the shop is usable again (the product list is displayed)
    await expect(page.locator('.product').first()).toBeVisible();
  });
});

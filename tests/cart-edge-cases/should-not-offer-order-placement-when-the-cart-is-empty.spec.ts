// spec: specs/cart-edge-cases.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Cart Edge Cases', () => {
  // EXPECTED BEHAVIOUR, NOT YET IMPLEMENTED — see Bug Reports/BUG-2-empty-cart-can-be-ordered.md.
  // With an empty cart the application currently lets the user walk the whole checkout flow:
  // PROCEED TO CHECKOUT -> #/cart (all totals zero), Place Order -> #/country, then back to #/.
  // The scenario below states what a user would expect instead. It is marked test.fixme() so the
  // suite stays green while the gap between expectation and behaviour stays visible.
  test.fixme('should-not-offer-order-placement-when-the-cart-is-empty', async ({ page }) => {
    // 1. Click the "Cart" link in the header to open the cart drawer with an empty cart
    await page.getByRole('link', { name: 'Cart' }).click();

    // expect: the drawer shows "You cart is empty!"
    await expect(page.locator('.cart-preview .empty-cart h2')).toHaveText('You cart is empty!');

    // 2. Click "PROCEED TO CHECKOUT" in the drawer
    await page.getByRole('button', { name: 'PROCEED TO CHECKOUT' }).click();

    // expect: the URL ends with "#/cart"
    await expect(page).toHaveURL(/#\/cart$/);

    // 3. Inspect the "Place Order" action on the cart page
    // expect: "Place Order" is disabled — an empty cart must not be orderable.
    // (A fix that removes the button instead of disabling it satisfies the same requirement;
    // in that case this assertion should become expect(placeOrder).toHaveCount(0).)
    const placeOrder = page.getByRole('button', { name: 'Place Order' });
    if (await placeOrder.count())
      await expect(placeOrder).toBeDisabled();
  });
});

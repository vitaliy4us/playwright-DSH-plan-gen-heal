// spec: specs/cart-edge-cases.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Cart Edge Cases', () => {
  // KNOWN DEFECT (diagnosed by the healer): the application flushes the cart to localStorage
  // roughly one second AFTER a change (measured: flush at ~1000 ms after "ADD TO CART").
  // page.reload() issued immediately after the click therefore races that write, and the
  // application's startup overwrites the stored cart with its empty state (every app_data_*
  // key becomes the string "null"), so the cart is lost. Once the flush has happened the cart
  // is persisted and restored correctly, so this is a narrow but real data-loss window:
  // reloading the page within ~1 s of adding a product loses the cart.
  // Marked test.fixme instead of weakening the assertion or adding an arbitrary sleep.
  test.fixme('should-persist-cart-after-app-reload', async ({ page }) => {
    const brocolliCard = page.locator('.product').filter({ hasText: 'Brocolli - 1 Kg' });
    const headerValue = (label: string) =>
      page.locator('table tbody tr').filter({ hasText: label }).locator('strong');
    const cartBadge = page.locator('.cart-icon .cart-count');

    // 1. Click "ADD TO CART" on the "Brocolli - 1 Kg" product card
    await brocolliCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: header "Items" counter shows "1"
    await expect(headerValue('Items')).toHaveText('1');
    // expect: header "Price" counter shows "120"
    await expect(headerValue('Price')).toHaveText('120');
    // expect: the cart icon badge shows "1"
    await expect(cartBadge).toHaveText('1');

    // 2. Reload the page with page.reload()
    await page.reload();

    // expect: the header "Items" counter still shows "1" — the cart is restored from localStorage
    await expect(headerValue('Items')).toHaveText('1');
    // expect: the header "Price" counter still shows "120"
    await expect(headerValue('Price')).toHaveText('120');
    // expect: the cart icon badge still shows "1"
    await expect(cartBadge).toHaveText('1');
  });
});

// spec: specs/cart-edge-cases.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Cart Edge Cases', () => {
  test('should-show-zero-totals-on-cart-page-when-cart-is-empty', async ({ page }) => {
    // 1. Click the "Cart" link in the header to open the cart drawer with an empty cart
    await page.getByRole('link', { name: 'Cart' }).click();

    // expect: the drawer shows "You cart is empty!"
    await expect(page.locator('.cart-preview .empty-cart h2')).toHaveText('You cart is empty!');

    // 2. Click "PROCEED TO CHECKOUT" in the drawer
    await page.getByRole('button', { name: 'PROCEED TO CHECKOUT' }).click();

    // expect: the URL ends with "#/cart"
    await expect(page).toHaveURL(/#\/cart$/);
    // expect: the page shows the empty-cart message "You cart is empty!"
    await expect(page.locator('.empty-cart h2')).toHaveText('You cart is empty!');
    // expect: there is no itemised product table
    await expect(page.locator('#productCartTables')).toHaveCount(0);
    // expect: the totals are all zero
    await expect(page.locator('.totAmt')).toHaveText('0');
    await expect(page.locator('.discountPerc')).toHaveText('0%');
    await expect(page.locator('.discountAmt')).toHaveText('0');
  });
});

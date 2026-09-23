// spec: specs/cart-edge-cases.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Cart Edge Cases', () => {
  test('should-increment-quantity-when-same-product-is-added-twice', async ({ page }) => {
    const brocolliCard = page.locator('.product').filter({ hasText: 'Brocolli - 1 Kg' });
    const headerValue = (label: string) =>
      page.locator('table tbody tr').filter({ hasText: label }).locator('strong');

    // 1. Click "ADD TO CART" on the "Brocolli - 1 Kg" product card
    await brocolliCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: header "Items" counter shows "1"
    await expect(headerValue('Items')).toHaveText('1');
    // expect: header "Price" counter shows "120"
    await expect(headerValue('Price')).toHaveText('120');

    // 2. Click "ADD TO CART" on the same "Brocolli - 1 Kg" product card again
    await brocolliCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: the header "Items" counter still shows "1" because it counts distinct products,
    // not the total quantity
    await expect(headerValue('Items')).toHaveText('1');
    // expect: header "Price" counter shows "240"
    await expect(headerValue('Price')).toHaveText('240');

    // 3. Click the "Cart" link in the header to open the cart drawer
    await page.getByRole('link', { name: 'Cart' }).click();

    // expect: the drawer contains exactly one row for "Brocolli - 1 Kg"
    const drawerItem = page.getByRole('listitem').filter({ hasText: 'Brocolli - 1 Kg' });
    await expect(drawerItem).toHaveCount(1);
    // expect: that row's .quantity shows "2 Nos."
    await expect(drawerItem.locator('.quantity')).toHaveText('2 Nos.');
    // expect: that row's .amount shows "240"
    await expect(drawerItem.locator('.amount')).toHaveText('240');
  });
});

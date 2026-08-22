// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Shopping Cart', () => {
  test('should-add-single-product-to-cart', async ({ page }) => {
    // 1. Click "ADD TO CART" on the "Brocolli - 1 Kg" card
    const brocolliCard = page.locator('.product').filter({ hasText: 'Brocolli - 1 Kg' });
    await brocolliCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: header "Items" counter shows "1"
    await expect(page.locator('table tbody tr').filter({ hasText: 'Items' }).locator('strong')).toHaveText('1');
    // expect: header "Price" counter shows "120"
    await expect(page.locator('table tbody tr').filter({ hasText: 'Price' }).locator('strong')).toHaveText('120');

    // 2. Click the cart icon to open the cart drawer
    await page.getByRole('link', { name: 'Cart' }).click();

    // expect: drawer lists "Brocolli - 1 Kg", quantity "1 No." and amount "₹ 120"
    // (₹ is rendered via CSS ::before, so assert the numeric parts)
    const drawerItem = page.getByRole('listitem').filter({ hasText: 'Brocolli - 1 Kg' });
    await expect(drawerItem.locator('.quantity')).toHaveText('1 No.');
    await expect(drawerItem.locator('.amount')).toHaveText('120');
  });
});

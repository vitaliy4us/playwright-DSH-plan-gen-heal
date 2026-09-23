// spec: specs/search-and-cart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Search and Cart', () => {
  test('should-keep-cart-when-search-is-cleared', async ({ page }) => {
    const searchBox = page.getByRole('searchbox', { name: 'Search for Vegetables and Fruits' });
    const productNames = page.locator('.products > .product h4');
    const headerValue = (label: string) =>
      page.locator('table tbody tr').filter({ hasText: label }).locator('strong');
    const cartBadge = page.locator('.cart-icon .cart-count');

    // 1. Type "ca" into the search box and click "ADD TO CART" on "Cauliflower - 1 Kg"
    await searchBox.fill('ca');
    await page.locator('.products > .product').filter({ hasText: 'Cauliflower - 1 Kg' })
      .getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: the header counters reflect the added product
    await expect(headerValue('Items')).toHaveText('1');
    await expect(headerValue('Price')).toHaveText('60');

    // 2. Clear the search box
    await searchBox.fill('');

    // expect: all 30 products are shown again, "Brocolli - 1 Kg" first and "Walnuts - 1/4 Kg" last
    await expect(productNames).toHaveCount(30);
    await expect(page.getByRole('heading', { name: 'Brocolli - 1 Kg' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Walnuts - 1/4 Kg' })).toBeVisible();
    // expect: the cart is unchanged by the catalogue change
    await expect(headerValue('Items')).toHaveText('1');
    await expect(headerValue('Price')).toHaveText('60');
    // expect: the cart icon badge still shows "1"
    await expect(cartBadge).toHaveText('1');

    // 3. Open the cart drawer
    await page.getByRole('link', { name: 'Cart' }).click();

    // expect: the drawer still contains the "Cauliflower - 1 Kg" row
    const drawerItem = page.locator('.cart-preview').getByRole('listitem')
      .filter({ hasText: 'Cauliflower - 1 Kg' });
    await expect(drawerItem).toHaveCount(1);
    // expect: that row's .quantity shows "1 No." and its .amount shows "60"
    await expect(drawerItem.locator('.quantity')).toHaveText('1 No.');
    await expect(drawerItem.locator('.amount')).toHaveText('60');
  });
});

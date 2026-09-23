// spec: specs/search-and-cart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Search and Cart', () => {
  test('should-add-product-from-filtered-search-results', async ({ page }) => {
    const searchBox = page.getByRole('searchbox', { name: 'Search for Vegetables and Fruits' });
    // The application removes non-matching cards from the DOM, and a bare `.product`
    // also matches an unrelated hidden node, so product locators are scoped to .products.
    const productNames = page.locator('.products > .product h4');
    const headerValue = (label: string) =>
      page.locator('table tbody tr').filter({ hasText: label }).locator('strong');

    // 1. Type "ca" into the "Search for Vegetables and Fruits" search box
    await searchBox.fill('ca');

    // expect: exactly four product cards are shown
    await expect(productNames).toHaveText([
      'Cauliflower - 1 Kg',
      'Carrot - 1 Kg',
      'Capsicum',
      'Cashews - 1 Kg',
    ]);
    // expect: a product that does not contain "ca" is not shown at all
    await expect(page.getByRole('heading', { name: 'Brocolli - 1 Kg' })).toHaveCount(0);
    // expect: the header "Items" counter shows "0"
    await expect(headerValue('Items')).toHaveText('0');

    // 2. Click "ADD TO CART" on the "Cauliflower - 1 Kg" card inside the filtered results
    await page.locator('.products > .product').filter({ hasText: 'Cauliflower - 1 Kg' })
      .getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: the header counters update
    await expect(headerValue('Items')).toHaveText('1');
    await expect(headerValue('Price')).toHaveText('60');
    // expect: the cart icon badge shows "1"
    await expect(page.locator('.cart-icon .cart-count')).toHaveText('1');
    // expect: the filter is still applied — the same four products remain visible
    await expect(productNames).toHaveText([
      'Cauliflower - 1 Kg',
      'Carrot - 1 Kg',
      'Capsicum',
      'Cashews - 1 Kg',
    ]);

    // 3. Click the "Cart" link in the header to open the cart drawer
    await page.getByRole('link', { name: 'Cart' }).click();

    // expect: the drawer contains one row for "Cauliflower - 1 Kg"
    const drawerItem = page.locator('.cart-preview').getByRole('listitem')
      .filter({ hasText: 'Cauliflower - 1 Kg' });
    await expect(drawerItem).toHaveCount(1);
    // expect: that row's .quantity shows "1 No." and its .amount shows "60"
    await expect(drawerItem.locator('.quantity')).toHaveText('1 No.');
    await expect(drawerItem.locator('.amount')).toHaveText('60');
  });
});

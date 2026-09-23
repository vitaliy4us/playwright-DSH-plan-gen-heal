// spec: specs/cart-edge-cases.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Cart Edge Cases', () => {
  test('should-count-distinct-products-in-header-counters', async ({ page }) => {
    const productCard = (name: string) => page.locator('.product').filter({ hasText: name });
    const headerValue = (label: string) =>
      page.locator('table tbody tr').filter({ hasText: label }).locator('strong');

    // 1. Click "ADD TO CART" on the "Brocolli - 1 Kg" product card
    await productCard('Brocolli - 1 Kg').getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: header "Items" counter shows "1"
    await expect(headerValue('Items')).toHaveText('1');
    // expect: header "Price" counter shows "120"
    await expect(headerValue('Price')).toHaveText('120');

    // 2. Click "ADD TO CART" on the "Cauliflower - 1 Kg" product card
    await productCard('Cauliflower - 1 Kg').getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: header "Items" counter shows "2"
    await expect(headerValue('Items')).toHaveText('2');
    // expect: header "Price" counter shows "180"
    await expect(headerValue('Price')).toHaveText('180');

    // 3. Click "ADD TO CART" on the "Brocolli - 1 Kg" product card once more
    await productCard('Brocolli - 1 Kg').getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: header "Items" counter still shows "2" — it counts distinct products,
    // not the total quantity
    await expect(headerValue('Items')).toHaveText('2');
    // expect: header "Price" counter shows "300"
    await expect(headerValue('Price')).toHaveText('300');

    // 4. Click the "Cart" link in the header to open the cart drawer
    await page.getByRole('link', { name: 'Cart' }).click();

    // expect: the drawer contains exactly two rows
    const drawerItems = page.locator('.cart-preview').getByRole('listitem');
    await expect(drawerItems).toHaveCount(2);

    // expect: the "Brocolli - 1 Kg" row has .quantity "2 Nos." and .amount "240"
    const brocolliItem = drawerItems.filter({ hasText: 'Brocolli - 1 Kg' });
    await expect(brocolliItem.locator('.quantity')).toHaveText('2 Nos.');
    await expect(brocolliItem.locator('.amount')).toHaveText('240');

    // expect: the "Cauliflower - 1 Kg" row has .quantity "1 No." and .amount "60"
    const cauliflowerItem = drawerItems.filter({ hasText: 'Cauliflower - 1 Kg' });
    await expect(cauliflowerItem.locator('.quantity')).toHaveText('1 No.');
    await expect(cauliflowerItem.locator('.amount')).toHaveText('60');
  });
});

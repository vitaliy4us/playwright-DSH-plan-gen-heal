// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Shopping Cart', () => {
  test('should-remove-product-from-cart', async ({ page }) => {
    // 1. Add "Brocolli - 1 Kg" to the cart
    const brocolliCard = page.locator('.product').filter({ hasText: 'Brocolli - 1 Kg' });
    await brocolliCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: header "Items" shows "1"
    await expect(page.locator('table tbody tr').filter({ hasText: 'Items' }).locator('strong')).toHaveText('1');

    // 2. Add "Cauliflower - 1 Kg" to the cart
    const cauliflowerCard = page.locator('.product').filter({ hasText: 'Cauliflower - 1 Kg' });
    await cauliflowerCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: header "Items" shows "2"
    await expect(page.locator('table tbody tr').filter({ hasText: 'Items' }).locator('strong')).toHaveText('2');

    // 3. Open the cart drawer and click "×" next to "Brocolli - 1 Kg"
    await page.getByRole('link', { name: 'Cart' }).click();
    const brocolliItem = page.getByRole('listitem').filter({ hasText: 'Brocolli - 1 Kg' });
    await brocolliItem.getByRole('link').click();

    // expect: "Brocolli - 1 Kg" is no longer listed in the drawer
    await expect(page.getByRole('listitem').filter({ hasText: 'Brocolli - 1 Kg' })).toHaveCount(0);
    // expect: header "Items" shows "1"
    await expect(page.locator('table tbody tr').filter({ hasText: 'Items' }).locator('strong')).toHaveText('1');
    // expect: header "Price" shows "60"
    await expect(page.locator('table tbody tr').filter({ hasText: 'Price' }).locator('strong')).toHaveText('60');
  });
});

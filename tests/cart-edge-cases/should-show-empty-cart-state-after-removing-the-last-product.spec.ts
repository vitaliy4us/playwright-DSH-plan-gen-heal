// spec: specs/cart-edge-cases.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Cart Edge Cases', () => {
  test('should-show-empty-cart-state-after-removing-the-last-product', async ({ page }) => {
    const brocolliCard = page.locator('.product').filter({ hasText: 'Brocolli - 1 Kg' });
    const headerValue = (label: string) =>
      page.locator('table tbody tr').filter({ hasText: label }).locator('strong');

    // 1. Click "ADD TO CART" on the "Brocolli - 1 Kg" product card
    await brocolliCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: header "Items" counter shows "1"
    await expect(headerValue('Items')).toHaveText('1');

    // 2. Click the "Cart" link in the header to open the cart drawer
    await page.getByRole('link', { name: 'Cart' }).click();

    // expect: the drawer row for "Brocolli - 1 Kg" is visible
    const drawerItem = page.getByRole('listitem').filter({ hasText: 'Brocolli - 1 Kg' });
    await expect(drawerItem).toBeVisible();
    // expect: that row's .quantity shows "1 No."
    await expect(drawerItem.locator('.quantity')).toHaveText('1 No.');

    // 3. Click the remove ("×") link inside the "Brocolli - 1 Kg" drawer row
    await drawerItem.getByRole('link').click();

    // expect: the drawer shows the empty-cart block with the text "You cart is empty!"
    // (the application's literal wording)
    await expect(page.locator('.cart-preview .empty-cart h2')).toHaveText('You cart is empty!');
    // expect: header "Items" counter shows "0"
    await expect(headerValue('Items')).toHaveText('0');
    // expect: header "Price" counter shows "0"
    await expect(headerValue('Price')).toHaveText('0');
    // expect: the cart icon badge (.cart-count) is no longer present
    await expect(page.locator('.cart-count')).toHaveCount(0);
  });
});

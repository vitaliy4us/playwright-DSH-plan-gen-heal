// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Shopping Cart', () => {
  test('should-adjust-quantity-before-adding', async ({ page }) => {
    const brocolliCard = page.locator('.product').filter({ hasText: 'Brocolli - 1 Kg' });
    const quantity = brocolliCard.getByRole('spinbutton');

    // 1. On the "Brocolli - 1 Kg" card, click "+" twice
    await brocolliCard.getByRole('link', { name: '+' }).click();
    await brocolliCard.getByRole('link', { name: '+' }).click();

    // expect: the quantity spinbutton shows "3"
    await expect(quantity).toHaveValue('3');

    // 2. Click "–" once
    await brocolliCard.getByRole('link', { name: '–' }).click();

    // expect: the quantity spinbutton shows "2"
    await expect(quantity).toHaveValue('2');

    // 3. Click "–" twice more
    await brocolliCard.getByRole('link', { name: '–' }).click();
    await brocolliCard.getByRole('link', { name: '–' }).click();

    // expect: the quantity never drops below "1"
    await expect(quantity).toHaveValue('1');

    // 4. Click "ADD TO CART"
    await brocolliCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // expect: header "Items" shows "1" and header "Price" shows "120"
    await expect(page.locator('table tbody tr').filter({ hasText: 'Items' }).locator('strong')).toHaveText('1');
    await expect(page.locator('table tbody tr').filter({ hasText: 'Price' }).locator('strong')).toHaveText('120');

    // 5. Open the cart drawer
    await page.getByRole('link', { name: 'Cart' }).click();

    // expect: drawer shows "Brocolli - 1 Kg", "1 No." and "₹ 120"
    // (₹ is rendered via CSS ::before, so assert the numeric parts)
    const drawerItem = page.getByRole('listitem').filter({ hasText: 'Brocolli - 1 Kg' });
    await expect(drawerItem.locator('.quantity')).toHaveText('1 No.');
    await expect(drawerItem.locator('.amount')).toHaveText('120');
  });
});

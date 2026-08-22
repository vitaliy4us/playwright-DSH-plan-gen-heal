// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Checkout and Order Placement', () => {
  test('should-place-order-successfully', async ({ page }) => {
    // 1. Add 2 × "Tomato - 1 Kg" (₹16 each) to the cart
    const tomatoCard = page.locator('.product').filter({ hasText: 'Tomato - 1 Kg' });
    await tomatoCard.getByRole('link', { name: '+' }).click();
    await tomatoCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // open the cart drawer and click "PROCEED TO CHECKOUT"
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'PROCEED TO CHECKOUT' }).click();

    // expect: cart page shows "No. of Items : 1" and total "32"
    await expect(page.locator('#productCartTables tbody tr')).toHaveCount(1);
    await expect(page.locator('.totAmt')).toHaveText('32');

    // 2. Click "Place Order"
    await page.getByRole('button', { name: 'Place Order' }).click();

    // expect: URL becomes #/country
    await expect(page).toHaveURL(/#\/country/);

    // 3. Select "India" in the country dropdown and check the Terms & Conditions checkbox
    await page.getByRole('combobox').selectOption('India');
    await page.getByRole('checkbox').check();

    // click "Proceed"
    await page.getByRole('button', { name: 'Proceed' }).click();

    // expect: a confirmation page appears before redirecting home
    await expect(page.getByText('Thank you, your order has been placed successfully')).toBeVisible();

    // expect: URL returns to the shop root #/ (auto-redirect can take a few seconds)
    await expect(page).toHaveURL(/#\/$/, { timeout: 15000 });
    // expect: header "Items" counter shows "0" (cart is cleared)
    await expect(page.locator('table tbody tr').filter({ hasText: 'Items' }).locator('strong')).toHaveText('0');
  });
});

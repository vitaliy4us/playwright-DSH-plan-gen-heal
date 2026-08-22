// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Promo Code', () => {
  test('should-apply-valid-promo-code', async ({ page }) => {
    // 1. Add 3 × "Brocolli - 1 Kg" (₹120 each) to the cart
    const brocolliCard = page.locator('.product').filter({ hasText: 'Brocolli - 1 Kg' });
    await brocolliCard.getByRole('link', { name: '+' }).click();
    await brocolliCard.getByRole('link', { name: '+' }).click();
    await brocolliCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // open the cart drawer and click "PROCEED TO CHECKOUT"
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'PROCEED TO CHECKOUT' }).click();

    // expect: "Total Amount :" is 360
    await expect(page.locator('.totAmt')).toHaveText('360');

    // 2. Type "rahulshettyacademy" into the promo code field and click "Apply"
    await page.getByRole('textbox', { name: 'Enter promo code' }).fill('rahulshettyacademy');
    await page.getByRole('button', { name: 'Apply' }).click();

    // expect: the message "Code applied ..!" appears once the promo request finishes
    await expect(page.locator('.promoInfo')).toHaveText('Code applied ..!', { timeout: 15000 });
    // expect: "Discount : 10%" is shown
    await expect(page.locator('.discountPerc')).toHaveText('10%');
    // expect: "Total After Discount : 324" is shown
    await expect(page.locator('.discountAmt')).toHaveText('324');
  });
});

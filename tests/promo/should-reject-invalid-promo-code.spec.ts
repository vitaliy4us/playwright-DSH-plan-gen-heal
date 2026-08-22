// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Promo Code', () => {
  test('should-reject-invalid-promo-code', async ({ page }) => {
    // 1. Add 3 × "Brocolli - 1 Kg" to the cart
    const brocolliCard = page.locator('.product').filter({ hasText: 'Brocolli - 1 Kg' });
    await brocolliCard.getByRole('link', { name: '+' }).click();
    await brocolliCard.getByRole('link', { name: '+' }).click();
    await brocolliCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // open the cart drawer and click "PROCEED TO CHECKOUT"
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'PROCEED TO CHECKOUT' }).click();

    // expect: URL becomes #/cart
    await expect(page).toHaveURL(/#\/cart/);

    // expect: "Total Amount :" is 360
    await expect(page.locator('.totAmt')).toHaveText('360');

    // 2. Type "INVALID123" into the "Enter promo code" field and click "Apply"
    await page.getByRole('textbox', { name: 'Enter promo code' }).fill('INVALID123');
    await page.getByRole('button', { name: 'Apply' }).click();

    // expect: the message "Invalid code ..!" appears once the promo request finishes
    await expect(page.locator('.promoInfo')).toHaveText('Invalid code ..!', { timeout: 15000 });
    // expect: "Discount : 0%" and "Total After Discount : 360" remain unchanged
    await expect(page.locator('.discountPerc')).toHaveText('0%');
    await expect(page.locator('.discountAmt')).toHaveText('360');
  });
});

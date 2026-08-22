// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Checkout and Order Placement', () => {
  test('should-require-terms-acceptance', async ({ page }) => {
    // 1. Add any product to the cart
    const brocolliCard = page.locator('.product').filter({ hasText: 'Brocolli - 1 Kg' });
    await brocolliCard.getByRole('button', { name: 'ADD TO CART' }).click();

    // open the cart drawer, proceed to checkout and click "Place Order"
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'PROCEED TO CHECKOUT' }).click();
    await page.getByRole('button', { name: 'Place Order' }).click();

    // expect: URL becomes #/country
    await expect(page).toHaveURL(/#\/country/);

    // 2. Select "India" in the "Choose Country" dropdown
    await page.getByRole('combobox').selectOption('India');

    // leave the Terms & Conditions checkbox unchecked, then click "Proceed"
    await page.getByRole('button', { name: 'Proceed' }).click();

    // expect: the message "Please accept Terms & Conditions - Required" appears
    await expect(page.getByText('Please accept Terms & Conditions - Required')).toBeVisible();
    // expect: URL remains #/country
    await expect(page).toHaveURL(/#\/country/);
  });
});

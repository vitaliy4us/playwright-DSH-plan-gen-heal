// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Product Search', () => {
  test('should-filter-products-by-search', async ({ page }) => {
    // 1. Type "ca" into the "Search for Vegetables and Fruits" search box
    await page.getByRole('searchbox', { name: 'Search for Vegetables and Fruits' }).fill('ca');

    // expect: only products whose name contains "ca" are shown
    await expect(page.getByRole('heading', { name: 'Brocolli - 1 Kg' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Cauliflower - 1 Kg' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Carrot - 1 Kg' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Capsicum' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cashews - 1 Kg' })).toBeVisible();

    // expect: the "no products" heading is not visible
    await expect(page.getByRole('heading', { name: 'Sorry, no products matched your search!' })).toHaveCount(0);

    // 2. Clear the search box
    await page.getByRole('searchbox', { name: 'Search for Vegetables and Fruits' }).fill('');

    // expect: all 30 products are visible again
    await expect(page.getByRole('heading', { name: 'Brocolli - 1 Kg' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Walnuts - 1/4 Kg' })).toBeVisible();
  });
});

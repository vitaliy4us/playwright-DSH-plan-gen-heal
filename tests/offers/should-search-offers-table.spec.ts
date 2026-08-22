// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Top Deals (Offers)', () => {
  test('should-search-offers-table', async ({ page }) => {
    // 1. Open the offers page
    const [offersPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('link', { name: 'Top Deals' }).click(),
    ]);
    await offersPage.waitForLoadState('domcontentloaded');

    // 2. Type "Orange" into the "Search:" box
    await offersPage.getByRole('searchbox', { name: 'Search:' }).fill('Orange');

    // expect: only the "Orange" row remains visible with its Price and Discount price
    await expect(offersPage.getByRole('row', { name: /Orange/ })).toBeVisible();
    await expect(offersPage.getByRole('row', { name: /Pineapple/ })).toHaveCount(0);

    // 3. Clear the search box
    await offersPage.getByRole('searchbox', { name: 'Search:' }).fill('');

    // expect: the full table is restored (back to page 1, first row Wheat)
    await expect(offersPage.getByRole('row', { name: /Wheat/ })).toBeVisible();
  });
});

// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Top Deals (Offers)', () => {
  test('should-sort-offers-table', async ({ page }) => {
    // 1. Open the offers page
    const [offersPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('link', { name: 'Top Deals' }).click(),
    ]);
    await offersPage.waitForLoadState('domcontentloaded');

    // expect: the sort status reads "Sorted by name: descending order"
    await expect(offersPage.getByRole('alert')).toContainText('Sorted by name: descending order');

    // 2. Click the "Veg/fruit name" column header
    await offersPage.getByRole('columnheader', { name: /Veg\/fruit name/ }).click();

    // expect: the sort status reads "Sorted by name: ascending order"
    await expect(offersPage.getByRole('alert')).toContainText('Sorted by name: ascending order');

    // 3. Click the "Price" column header
    await offersPage.getByRole('columnheader', { name: /Price/ }).click();

    // expect: the sort status reflects sorting by price
    await expect(offersPage.getByRole('alert')).toContainText(/Sorted by price/);
  });
});

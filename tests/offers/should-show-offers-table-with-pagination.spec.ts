// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Top Deals (Offers)', () => {
  test('should-show-offers-table-with-pagination', async ({ page }) => {
    // 1. Click "Top Deals" in the header
    const [offersPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('link', { name: 'Top Deals' }).click(),
    ]);
    await offersPage.waitForLoadState('domcontentloaded');

    // expect: a new tab opens with URL #/offers
    await expect(offersPage).toHaveURL(/#\/offers/);

    // expect: the table has columns "Veg/fruit name", "Price" and "Discount price"
    await expect(offersPage.getByRole('columnheader', { name: /Veg\/fruit name/ })).toBeVisible();
    await expect(offersPage.getByRole('columnheader', { name: /Price/ })).toBeVisible();
    await expect(offersPage.getByRole('columnheader', { name: /Discount price/ })).toBeVisible();

    // 2. With page size 5, click "Next"
    await offersPage.getByRole('button', { name: 'Next' }).click();

    // expect: the visible rows change to the next page
    await expect(offersPage.getByRole('row', { name: /Pineapple/ })).toBeVisible();
    await expect(offersPage.getByRole('row', { name: /Dragon fruit/ })).toBeVisible();

    // 3. Click "Last"
    await offersPage.getByRole('button', { name: 'Last' }).click();

    // expect: the last page is shown and the "Last" button becomes disabled
    await expect(offersPage.getByRole('button', { name: 'Last' })).toBeDisabled();
    await expect(offersPage.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});

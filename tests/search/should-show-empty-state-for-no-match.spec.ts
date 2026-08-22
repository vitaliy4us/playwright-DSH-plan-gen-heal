// spec: specs/greenkart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Product Search', () => {
  test('should-show-empty-state-for-no-match', async ({ page }) => {
    // 1. Type "xyz123" into the search box
    await page.getByRole('searchbox', { name: 'Search for Vegetables and Fruits' }).fill('xyz123');

    // expect: the product list is replaced by the empty-state heading
    await expect(page.getByRole('heading', { name: 'Sorry, no products matched your search!' })).toBeVisible();

    // expect: the hint is visible
    await expect(page.getByText('Enter a different keyword and try.')).toBeVisible();

    // 2. Clear the search box
    await page.getByRole('searchbox', { name: 'Search for Vegetables and Fruits' }).fill('');

    // expect: the empty-state heading disappears and the full product list is restored
    await expect(page.getByRole('heading', { name: 'Sorry, no products matched your search!' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Brocolli - 1 Kg' })).toBeVisible();
  });
});

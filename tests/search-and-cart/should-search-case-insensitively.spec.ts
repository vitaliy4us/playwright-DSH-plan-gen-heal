// spec: specs/search-and-cart.plan.md
// seed: tests/seed.spec.ts
import { test, expect } from '../fixtures';

test.describe('Search and Cart', () => {
  test('should-search-case-insensitively', async ({ page }) => {
    const searchBox = page.getByRole('searchbox', { name: 'Search for Vegetables and Fruits' });
    // The application removes non-matching cards from the DOM, and a bare `.product`
    // also matches an unrelated hidden node, so product locators are scoped to .products.
    const productNames = page.locator('.products > .product h4');
    const headerValue = (label: string) =>
      page.locator('table tbody tr').filter({ hasText: label }).locator('strong');

    // 1. Type "CA" (uppercase) into the search box
    await searchBox.fill('CA');

    // expect: exactly the same four products are shown as for the lowercase query
    await expect(productNames).toHaveText([
      'Cauliflower - 1 Kg',
      'Carrot - 1 Kg',
      'Capsicum',
      'Cashews - 1 Kg',
    ]);
    // expect: the matching is still a filter and not a "show everything"
    await expect(page.getByRole('heading', { name: 'Brocolli - 1 Kg' })).toHaveCount(0);
    // expect: the header counters are untouched by searching
    await expect(headerValue('Items')).toHaveText('0');
    await expect(headerValue('Price')).toHaveText('0');
  });
});

import { test as baseTest } from '@playwright/test';
export { expect } from '@playwright/test';

// Seed fixture: navigates to the GreenKart shop, the fresh state every scenario starts from.
export const test = baseTest.extend({
  page: async ({ page }, use) => {
    await page.goto('https://rahulshettyacademy.com/seleniumPractise/#/');
    await use(page);
  },
});

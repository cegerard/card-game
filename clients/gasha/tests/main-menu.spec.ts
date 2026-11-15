import { test, expect } from '@playwright/test';
import { serveFights } from './helpers/arcade.js';

test('main menu shows Arcade Mode button', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /arcade mode/i }),
  ).toBeVisible();
});

test('clicking Arcade Mode navigates to /arcade', async ({ page }) => {
  await serveFights(page);
  await page.goto('/');
  await page.getByRole('button', { name: /arcade mode/i }).click();
  await expect(page).toHaveURL('/arcade');
});

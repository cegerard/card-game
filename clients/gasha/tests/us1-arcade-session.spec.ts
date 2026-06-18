import { test, expect } from '@playwright/test';

test('main menu shows Arcade Mode button', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: /arcade mode/i }),
  ).toBeVisible();
});

test('clicking Arcade Mode navigates to /arcade', async ({ page }) => {
  await page.route('**/fight', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: /arcade mode/i }).click();
  await expect(page).toHaveURL('/arcade', { timeout: 10000 });
});

test('arcade page mounts a Phaser canvas', async ({ page }) => {
  await page.route('**/fight', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    }),
  );
  await page.goto('/arcade');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
});

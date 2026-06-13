import { test, expect } from '@playwright/test';

test('main menu shows Arcade Mode button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /arcade mode/i })).toBeVisible();
});

test('clicking Arcade Mode navigates to /arcade', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /arcade mode/i }).click();
  await expect(page).toHaveURL('/arcade');
});

test('arcade page mounts a Phaser canvas', async ({ page }) => {
  await page.goto('/arcade');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
});

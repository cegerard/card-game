import { test, expect } from '@playwright/test';

const ENEMY_WIN_RESULT = JSON.stringify({
  0: { kind: 'fight_end', winner: 'Level 1 — Rookies' },
});

test('game over screen appears when player loses', async ({ page }) => {
  await page.route('**/fight', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: ENEMY_WIN_RESULT }),
  );
  await page.goto('/arcade');
  await expect(page.getByRole('heading', { name: /game over/i })).toBeVisible({ timeout: 15000 });
});

test('clicking Back to Menu returns to / after game over', async ({ page }) => {
  await page.route('**/fight', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: ENEMY_WIN_RESULT }),
  );
  await page.goto('/arcade');
  await page.getByRole('button', { name: /back to menu/i }).click({ timeout: 15000 });
  await expect(page).toHaveURL('/');
});

test('new arcade session starts at level 1 after previous loss', async ({ page }) => {
  await page.route('**/fight', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: ENEMY_WIN_RESULT }),
  );
  await page.goto('/arcade');
  await page.getByRole('button', { name: /back to menu/i }).click({ timeout: 15000 });
  await page.goto('/arcade');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
});

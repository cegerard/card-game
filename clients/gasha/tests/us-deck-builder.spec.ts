import { test, expect } from '@playwright/test';

test('main menu shows a Deck Builder button that opens /deck', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /deck builder/i }).click();
  await expect(page).toHaveURL('/deck', { timeout: 10000 });
});

test('deck page shows a full 5 / 5 deck by default', async ({ page }) => {
  await page.goto('/deck');
  await expect(page.getByText(/5\s*\/\s*5/)).toBeVisible();
});

test('an unselected roster card is disabled while the deck is full', async ({
  page,
}) => {
  await page.goto('/deck');
  await expect(
    page.getByRole('button', { name: /storm caller/i }),
  ).toBeDisabled();
});

test('deselecting a card drops the counter to 4 / 5', async ({ page }) => {
  await page.goto('/deck');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /warrior/i }).click();
  await expect(page.getByText(/4\s*\/\s*5/)).toBeVisible();
});

test('Arcade Mode is disabled while the deck is incomplete', async ({
  page,
}) => {
  await page.goto('/deck');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /warrior/i }).click();
  await page.getByRole('button', { name: /back to menu/i }).click();
  await expect(
    page.getByRole('button', { name: /arcade mode/i }),
  ).toBeDisabled();
});

import { test, expect } from '@playwright/test';
import {
  arcadeUrl,
  playArcade,
  serveFights,
  type RendererMode,
} from './helpers/arcade.js';

const MODES: RendererMode[] = ['web', 'phaser'];

for (const mode of MODES) {
  test.describe(`Arcade, ${mode} renderer`, () => {
    test('a victory offers the next level', async ({ page }) => {
      await serveFights(page);
      await playArcade(page, mode, 1);
      await page.getByRole('button', { name: 'Next Level' }).click();
      await expect(page.getByText('Level 2', { exact: true })).toBeVisible();
    });

    test('winning the last level clears the arcade', async ({ page }) => {
      test.slow();
      await serveFights(page);
      await playArcade(page, mode, 5);
      await expect(
        page.getByRole('heading', { name: 'All Levels Cleared!' }),
      ).toBeVisible();
    });

    test('the final victory leads back to the menu', async ({ page }) => {
      test.slow();
      await serveFights(page);
      await playArcade(page, mode, 5);
      await page.getByRole('button', { name: /back to menu/i }).click();
      await expect(page).toHaveURL('/');
    });

    test('a defeat shows the game over screen', async ({ page }) => {
      await serveFights(page, [3]);
      await playArcade(page, mode, 3);
      await expect(
        page.getByRole('heading', { name: 'Game Over' }),
      ).toBeVisible();
    });

    test('game over leads back to the menu', async ({ page }) => {
      await serveFights(page, [3]);
      await playArcade(page, mode, 3);
      await page.getByRole('button', { name: /back to menu/i }).click();
      await expect(page).toHaveURL('/');
    });

    test('a new session starts at level 1 after a defeat', async ({ page }) => {
      await serveFights(page, [3]);
      await playArcade(page, mode, 3);
      await page.getByRole('button', { name: /back to menu/i }).click();
      await page.getByRole('button', { name: /arcade mode/i }).click();
      await expect(page.getByText('Level 1', { exact: true })).toBeVisible();
    });
  });
}

test('the phaser renderer mounts a canvas', async ({ page }) => {
  await serveFights(page);
  await page.goto(arcadeUrl('phaser'));
  await expect(page.locator('canvas')).toBeVisible();
});

test('the web renderer draws no canvas', async ({ page }) => {
  await serveFights(page);
  await page.goto(arcadeUrl('web'));
  await page.getByRole('button', { name: 'Continue' }).waitFor();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('the web report names the winner', async ({ page }) => {
  await serveFights(page);
  await page.goto(arcadeUrl('web'));
  await expect(page.getByText('VICTORY', { exact: true })).toBeVisible();
});

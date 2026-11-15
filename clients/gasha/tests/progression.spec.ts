import { test, expect, type Page } from '@playwright/test';
import { playArcade, serveFights } from './helpers/arcade.js';

const PROGRESSION_KEY = 'card-game:progression:v1';

async function winFirstLevelThenOpenDeck(page: Page) {
  await playArcade(page, 'web', 1);
  await page.getByRole('button', { name: /back to menu/i }).click();
  await page.goto('/deck');
}

test('a victory credits XP to the deck', async ({ page }) => {
  await serveFights(page);
  await playArcade(page, 'web', 1);
  await expect(page.getByText(/^\+\d+ XP$/).first()).toBeVisible();
});

test('the XP gained survives a reload', async ({ page }) => {
  await serveFights(page);
  await winFirstLevelThenOpenDeck(page);
  await expect(page.getByText(/^[1-9]\d*\/5000$/).first()).toBeVisible();
});

test('the next fight is sent with the XP gained', async ({ page }) => {
  const requests = await serveFights(page);
  await playArcade(page, 'web', 2);
  const [first, second] = requests.map((r) => r.postDataJSON().player1.deck);
  expect(second).not.toEqual(first);
});

// The Rogue lands the only blow of the level 1 report, so its progression
// is the one the fight rewrites.
test('a fused card keeps its tier after a fight', async ({ page }) => {
  await page.addInitScript((key) => {
    if (localStorage.getItem(key)) return;
    const rogue = { cardId: 'player-rogue', experience: 0, tier: 2 };
    localStorage.setItem(key, JSON.stringify({ 'player-rogue': rogue }));
  }, PROGRESSION_KEY);
  await serveFights(page);
  await winFirstLevelThenOpenDeck(page);
  await expect(page.getByRole('button', { name: 'Rogue' })).toContainText('★2');
});

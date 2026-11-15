import type { Page, Request } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ARCADE_LEVELS } from '../../src/lib/arcade/levels.js';

export type RendererMode = 'web' | 'phaser';
type Outcome = 'victory' | 'defeat';

/** A real engine report, recorded by tests/fixtures/record-fights.mjs. */
function fightReport(levelIndex: number, outcome: Outcome): string {
  return readFileSync(
    new URL(`../fixtures/level-${levelIndex}-${outcome}.json`, import.meta.url),
    'utf-8',
  );
}

function levelIndexOf(request: Request): number {
  const enemyName = request.postDataJSON().player2.name;
  const level = ARCADE_LEVELS.find((candidate) => candidate.name === enemyName);
  if (!level) throw new Error(`Unknown arcade level: ${enemyName}`);
  return level.index;
}

/**
 * Answers every POST /fight with the recorded report of the level the
 * client asked for: a victory, unless the level is listed in `defeats`.
 * Returns the requests the client sent, in order.
 */
export async function serveFights(
  page: Page,
  defeats: number[] = [],
): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route('**/fight', (route) => {
    const levelIndex = levelIndexOf(route.request());
    requests.push(route.request());
    return route.fulfill({
      contentType: 'application/json',
      body: fightReport(
        levelIndex,
        defeats.includes(levelIndex) ? 'defeat' : 'victory',
      ),
    });
  });
  return requests;
}

export function arcadeUrl(mode: RendererMode): string {
  return mode === 'phaser' ? '/arcade?mode=phaser' : '/arcade';
}

/** The web report waits for Continue; the Phaser replay ends by itself. */
async function finishFight(page: Page, mode: RendererMode) {
  if (mode === 'web') {
    await page.getByRole('button', { name: 'Continue' }).click();
  }
}

/**
 * Opens the arcade and plays `fights` fights from level 1, moving to the
 * next level after each one but the last.
 */
export async function playArcade(
  page: Page,
  mode: RendererMode,
  fights: number,
) {
  await page.goto(arcadeUrl(mode));
  for (let fight = 1; fight <= fights; fight++) {
    await finishFight(page, mode);
    if (fight < fights) {
      await page.getByRole('button', { name: 'Next Level' }).click();
    }
  }
}

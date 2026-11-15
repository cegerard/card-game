// Records the fight reports the Playwright tests replay, from a running
// combat engine: `pnpm dev:engine`, then `pnpm --filter gasha record:fights`.
// The default deck fights each arcade level exactly as engine-client.ts
// sends it; for each scenario the shortest seeded fight is kept, so the
// Phaser replay (300 ms a step) stays quick.
import { writeFileSync } from 'node:fs';
import { toCombatConfig } from '@card-game/shared-types';
import { DEFAULT_DECK_IDS, findRosterCard } from '../../src/lib/deck/roster.ts';
import { ARCADE_LEVELS } from '../../src/lib/arcade/levels.ts';

/** @typedef {import('../../src/lib/arcade/types.ts').ArcadeLevel} ArcadeLevel */
/** @typedef {{ level: ArcadeLevel, playerWins: boolean }} Scenario */

const ENGINE_URL = process.env.PUBLIC_COMBAT_ENGINE_URL ?? 'http://localhost:3000';
const SEEDS = 300;
const PLAYER = 'Player';

const deck = DEFAULT_DECK_IDS.map((id) => {
  const card = findRosterCard(id);
  if (!card) throw new Error(`Unknown roster card: ${id}`);
  return toCombatConfig(card);
});

/** @type {Scenario[]} */
const scenarios = [
  ...ARCADE_LEVELS.map((level) => ({ level, playerWins: true })),
  { level: ARCADE_LEVELS[2], playerWins: false },
];

/**
 * @param {ArcadeLevel} level
 * @param {number} seed
 */
async function fight(level, seed) {
  const response = await fetch(`${ENGINE_URL}/fight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player1: { name: PLAYER, deck },
      player2: { name: level.name, deck: level.enemyTeam.map(toCombatConfig) },
      cardSelectorStrategy: 'speed-weighted',
      seed,
    }),
  });
  if (!response.ok) {
    throw new Error(`${level.name}, seed ${seed}: HTTP ${response.status}`);
  }
  return response.json();
}

/** @param {Scenario} scenario */
async function shortestFight({ level, playerWins }) {
  let best;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const report = await fight(level, seed);
    const steps = Object.values(report);
    const won = steps.at(-1).winner === PLAYER;
    if (won === playerWins && (!best || steps.length < best.length)) {
      best = { seed, length: steps.length, report };
    }
  }
  if (!best) {
    throw new Error(`${level.name}: no seed where the player ${playerWins ? 'wins' : 'loses'}`);
  }
  return best;
}

for (const scenario of scenarios) {
  const { seed, length, report } = await shortestFight(scenario);
  const name = `level-${scenario.level.index}-${scenario.playerWins ? 'victory' : 'defeat'}`;
  writeFileSync(
    new URL(`${name}.json`, import.meta.url),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(`${name}: seed ${seed}, ${length} steps`);
}

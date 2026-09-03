import type { ArcadeLevel } from './types.js';
import type {
  Archetype,
  CardDefinition,
  Element,
} from '@card-game/shared-types';

function makeEnemy(
  id: string,
  name: string,
  mult: number,
  element: Element = 'PHYSICAL',
  archetype: Archetype = 'Guerrier',
): CardDefinition {
  const stats = {
    attack: Math.round(60 * mult),
    defense: Math.round(40 * mult),
    health: Math.round(100 * mult),
    speed: Math.round(45 * mult),
    agility: 35,
    accuracy: 80,
  };
  return {
    id,
    name,
    archetype,
    element,
    stats,
    criticalChance: 0.1,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Heavy Strike',
        damages: [{ type: element, rate: 1.8 }],
        energy: 3,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Attack',
        damages: [{ type: element, rate: 1.0 }],
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'simple-dodge' },
  };
}

function makeDebuffEnemy(
  id: string,
  name: string,
  mult: number,
): CardDefinition {
  return {
    ...makeEnemy(id, name, mult, 'EARTH', 'Tank'),
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Earth Crush',
        damages: [{ type: 'EARTH', rate: 2.0 }],
        energy: 4,
        targetingStrategy: 'target-all',
      },
      simpleAttack: {
        name: 'Ground Slam',
        damages: [{ type: 'EARTH', rate: 1.0 }],
        targetingStrategy: 'position-based',
      },
      others: [
        {
          kind: 'ALTERATION',
          polarity: 'buff',
          name: 'Fortify',
          rate: 0.3,
          targetingStrategy: 'self',
          event: 'turn-end',
          buffType: 'defense',
          duration: 2,
        },
      ],
    },
  };
}

function makeChainEnemy(
  id: string,
  name: string,
  mult: number,
): CardDefinition {
  return {
    ...makeEnemy(id, name, mult, 'AIR', 'Assassin'),
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Whirlwind',
        damages: [{ type: 'AIR', rate: 2.2 }],
        energy: 3,
        targetingStrategy: 'target-all',
      },
      simpleAttack: {
        name: 'Wind Slash',
        damages: [
          { type: 'AIR', rate: 0.6 },
          { type: 'PHYSICAL', rate: 0.4 },
        ],
        targetingStrategy: 'position-based',
      },
      others: [
        {
          kind: 'ALTERATION',
          name: 'Wind Step',
          rate: 0.4,
          targetingStrategy: 'self',
          event: 'turn-end',
          buffType: 'agility',
          polarity: 'buff',
          duration: 3,
        },
      ],
    },
  };
}

export const ARCADE_LEVELS: ArcadeLevel[] = [
  {
    index: 1,
    name: 'Level 1 — Rookies',
    enemyTeam: [makeEnemy('enemy-1-1', 'Grunt', 1.0)],
  },
  {
    index: 2,
    name: 'Level 2 — Brawlers',
    enemyTeam: [
      makeEnemy('enemy-2-1', 'Brawler', 1.3),
      makeEnemy('enemy-2-2', 'Scout', 1.3, 'AIR', 'Assassin'),
    ],
  },
  {
    index: 3,
    name: 'Level 3 — Brutes',
    enemyTeam: [
      makeDebuffEnemy('enemy-3-1', 'Brute', 1.6),
      makeEnemy('enemy-3-2', 'Guard', 1.6),
      makeEnemy('enemy-3-3', 'Ranger', 1.6, 'AIR', 'Assassin'),
    ],
  },
  {
    index: 4,
    name: 'Level 4 — Champions',
    enemyTeam: [
      makeChainEnemy('enemy-4-1', 'Champion', 2.0),
      makeDebuffEnemy('enemy-4-2', 'Crusher', 2.0),
      makeEnemy('enemy-4-3', 'Sentinel', 2.0, 'WATER', 'Support'),
      makeEnemy('enemy-4-4', 'Pyro', 2.0, 'FIRE', 'DPS'),
    ],
  },
  {
    index: 5,
    name: 'Level 5 — Overlords',
    enemyTeam: [
      makeChainEnemy('enemy-5-1', 'Overlord', 2.5),
      makeChainEnemy('enemy-5-2', 'Tempest', 2.5),
      makeDebuffEnemy('enemy-5-3', 'Colossus', 2.5),
      makeEnemy('enemy-5-4', 'Inferno', 2.5, 'FIRE', 'DPS'),
      makeEnemy('enemy-5-5', 'Glacier', 2.5, 'WATER', 'Support'),
    ],
  },
];

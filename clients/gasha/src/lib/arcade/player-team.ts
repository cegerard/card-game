import type { CardConfig } from './types.js';

export const PLAYER_TEAM: CardConfig[] = [
  {
    id: 'player-warrior',
    name: 'Warrior',
    attack: 80,
    defense: 60,
    health: 120,
    speed: 50,
    agility: 40,
    accuracy: 85,
    criticalChance: 15,
    element: 'PHYSICAL',
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Power Slash',
        damages: [{ type: 'PHYSICAL', rate: 2.0 }],
        energy: 3,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Strike',
        damages: [{ type: 'PHYSICAL', rate: 1.0 }],
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'simple-dodge' },
  },
  {
    id: 'player-mage',
    name: 'Mage',
    attack: 100,
    defense: 30,
    health: 80,
    speed: 60,
    agility: 35,
    accuracy: 90,
    criticalChance: 20,
    element: 'FIRE',
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Fireball',
        damages: [{ type: 'FIRE', rate: 2.5 }],
        energy: 4,
        targetingStrategy: 'target-all',
      },
      simpleAttack: {
        name: 'Flame Bolt',
        damages: [
          { type: 'FIRE', rate: 0.7 },
          { type: 'PHYSICAL', rate: 0.3 },
        ],
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'random-dodge' },
  },
  {
    id: 'player-healer',
    name: 'Healer',
    attack: 40,
    defense: 50,
    health: 100,
    speed: 55,
    agility: 45,
    accuracy: 80,
    criticalChance: 5,
    element: 'WATER',
    skills: {
      special: {
        kind: 'HEALING',
        name: 'Tidal Wave',
        rate: 1.5,
        energy: 3,
        targetingStrategy: 'all-allies',
      },
      simpleAttack: {
        name: 'Water Jet',
        damages: [{ type: 'WATER', rate: 1.0 }],
        targetingStrategy: 'position-based',
      },
      others: [
        {
          kind: 'HEALING',
          name: 'Mend',
          rate: 0.3,
          targetingStrategy: 'self',
          event: 'turn-end',
        },
      ],
    },
    behaviors: { dodge: 'simple-dodge' },
  },
];

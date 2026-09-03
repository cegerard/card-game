import type { CardDefinition } from '@card-game/shared-types';

// Roster de test à des fins de développement et de démonstration.
// Échelle de valeurs volontairement distincte du roster réel (base Notion
// "Cartes") : ces personnages sont voués à disparaître une fois le roster
// réel intégré. Voir Notion > Les cartes > Système d'expérience > Plan
// d'implémentation > Étape 1.
export const CHARACTER_ROSTER: CardDefinition[] = [
  {
    id: 'player-warrior',
    name: 'Warrior',
    archetype: 'Guerrier',
    element: 'PHYSICAL',
    stats: {
      attack: 80,
      defense: 60,
      health: 120,
      speed: 50,
      agility: 40,
      accuracy: 85,
    },
    criticalChance: 0.15,
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
    archetype: 'DPS',
    element: 'FIRE',
    stats: {
      attack: 100,
      defense: 30,
      health: 80,
      speed: 60,
      agility: 35,
      accuracy: 90,
    },
    criticalChance: 0.2,
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
    archetype: 'Support',
    element: 'WATER',
    stats: {
      attack: 40,
      defense: 50,
      health: 100,
      speed: 55,
      agility: 45,
      accuracy: 80,
    },
    criticalChance: 0.05,
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
  {
    id: 'player-rogue',
    name: 'Rogue',
    archetype: 'Assassin',
    element: 'AIR',
    stats: {
      attack: 85,
      defense: 35,
      health: 85,
      speed: 90,
      agility: 70,
      accuracy: 88,
    },
    criticalChance: 0.35,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Shadow Flurry',
        damages: [
          { type: 'PHYSICAL', rate: 1.6 },
          { type: 'AIR', rate: 0.6 },
        ],
        energy: 3,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Quick Cut',
        damages: [{ type: 'PHYSICAL', rate: 1.0 }],
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'random-dodge' },
  },
  {
    id: 'player-guardian',
    name: 'Guardian',
    archetype: 'Tank',
    element: 'EARTH',
    stats: {
      attack: 45,
      defense: 90,
      health: 140,
      speed: 40,
      agility: 30,
      accuracy: 80,
    },
    criticalChance: 0.05,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Bulwark Smash',
        damages: [{ type: 'EARTH', rate: 1.8 }],
        energy: 3,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Shield Bash',
        damages: [{ type: 'EARTH', rate: 1.0 }],
        targetingStrategy: 'position-based',
      },
      others: [
        {
          kind: 'ALTERATION',
          polarity: 'buff',
          name: 'Brace',
          rate: 0.25,
          targetingStrategy: 'all-allies',
          event: 'turn-end',
          buffType: 'defense',
          duration: 2,
        },
      ],
    },
    behaviors: { dodge: 'simple-dodge' },
  },
  {
    id: 'player-berserker',
    name: 'Berserker',
    archetype: 'DPS',
    element: 'PHYSICAL',
    stats: {
      attack: 120,
      defense: 25,
      health: 95,
      speed: 65,
      agility: 40,
      accuracy: 82,
    },
    criticalChance: 0.25,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Rampage',
        damages: [{ type: 'PHYSICAL', rate: 2.8 }],
        energy: 4,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Reckless Swing',
        damages: [{ type: 'PHYSICAL', rate: 1.2 }],
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'simple-dodge' },
  },
  {
    id: 'player-frost-sage',
    name: 'Frost Sage',
    archetype: 'DPS',
    element: 'WATER',
    stats: {
      attack: 75,
      defense: 45,
      health: 90,
      speed: 58,
      agility: 40,
      accuracy: 90,
    },
    criticalChance: 0.1,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Glacial Spike',
        damages: [{ type: 'WATER', rate: 2.2 }],
        energy: 4,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Frost Touch',
        damages: [{ type: 'WATER', rate: 0.9 }],
        targetingStrategy: 'position-based',
        effects: [{ type: 'FREEZE', rate: 0.1, level: 1, probability: 0.3 }],
      },
      others: [],
    },
    behaviors: { dodge: 'simple-dodge' },
  },
  {
    id: 'player-storm-caller',
    name: 'Storm Caller',
    archetype: 'DPS',
    element: 'AIR',
    stats: {
      attack: 90,
      defense: 35,
      health: 85,
      speed: 70,
      agility: 50,
      accuracy: 87,
    },
    criticalChance: 0.18,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Chain Lightning',
        damages: [{ type: 'AIR', rate: 1.9 }],
        energy: 4,
        targetingStrategy: 'target-all',
      },
      simpleAttack: {
        name: 'Gust',
        damages: [
          { type: 'AIR', rate: 0.7 },
          { type: 'PHYSICAL', rate: 0.3 },
        ],
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'random-dodge' },
  },
  {
    id: 'player-invisible-hero',
    name: 'Invisible Hero',
    archetype: 'Guerrier',
    element: 'FIRE',
    stats: {
      attack: 900,
      defense: 350,
      health: 850,
      speed: 700,
      agility: 500,
      accuracy: 870,
    },
    criticalChance: 1,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Inferno Blast',
        damages: [{ type: 'FIRE', rate: 2.0 }],
        energy: 4,
        targetingStrategy: 'target-all',
      },
      simpleAttack: {
        name: 'Flame Wave',
        damages: [
          { type: 'FIRE', rate: 1.0 },
          { type: 'PHYSICAL', rate: 1.0 },
        ],
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'random-dodge' },
  },
];

export const DEFAULT_DECK_IDS: string[] = CHARACTER_ROSTER.slice(0, 5).map(
  (card) => card.id,
);

export function findRosterCard(id: string): CardDefinition | undefined {
  return CHARACTER_ROSTER.find((card) => card.id === id);
}

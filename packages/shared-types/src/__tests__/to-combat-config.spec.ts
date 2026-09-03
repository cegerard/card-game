import { describe, it, expect } from 'vitest';
import { toCombatConfig } from '../index.js';
import type { CardDefinition } from '../index.js';

function makeDefinition(
  overrides: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id: 'test-card',
    name: 'Test Card',
    archetype: 'Guerrier',
    element: 'FIRE',
    stats: {
      attack: 85,
      defense: 60,
      health: 550,
      speed: 75,
      accuracy: 80,
      agility: 55,
    },
    criticalChance: 0.05,
    resistance: 50,
    regeneration: 45,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Special',
        damages: [{ type: 'PHYSICAL', rate: 1.5 }],
        energy: 40,
        targetingStrategy: 'target-all',
      },
      simpleAttack: {
        name: 'Basic',
        damages: [{ type: 'PHYSICAL', rate: 0.8 }],
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'simple-dodge' },
    ...overrides,
  };
}

describe('toCombatConfig', () => {
  it('maps identity fields', () => {
    const config = toCombatConfig(makeDefinition());
    expect({ id: config.id, name: config.name }).toEqual({
      id: 'test-card',
      name: 'Test Card',
    });
  });

  it('flattens stats onto the combat config', () => {
    const config = toCombatConfig(makeDefinition());
    expect({
      attack: config.attack,
      defense: config.defense,
      health: config.health,
      speed: config.speed,
      accuracy: config.accuracy,
      agility: config.agility,
    }).toEqual({
      attack: 85,
      defense: 60,
      health: 550,
      speed: 75,
      accuracy: 80,
      agility: 55,
    });
  });

  it('carries criticalChance as a 0-1 rate unchanged', () => {
    const config = toCombatConfig(makeDefinition({ criticalChance: 0.08 }));
    expect(config.criticalChance).toBe(0.08);
  });

  it('carries the element through', () => {
    const config = toCombatConfig(makeDefinition({ element: 'WATER' }));
    expect(config.element).toBe('WATER');
  });

  it('passes skills and behaviors through unchanged', () => {
    const definition = makeDefinition();
    const config = toCombatConfig(definition);
    expect({ skills: config.skills, behaviors: config.behaviors }).toEqual({
      skills: definition.skills,
      behaviors: definition.behaviors,
    });
  });

  it('does not leak archetype onto the combat config', () => {
    const config = toCombatConfig(makeDefinition());
    expect('archetype' in config).toBe(false);
  });

  it('does not leak resistance onto the combat config', () => {
    const config = toCombatConfig(makeDefinition());
    expect('resistance' in config).toBe(false);
  });

  it('does not leak regeneration onto the combat config', () => {
    const config = toCombatConfig(makeDefinition());
    expect('regeneration' in config).toBe(false);
  });
});

import { EntangleAttackEffect } from '../attack-entangle-effect';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { FightingCard } from '../../../fighting-card';
import { Player } from '../../../../player';

describe('EntangleAttackEffect', () => {
  const effectRandomizer = new RandomizerFake();
  const cardRandomizer = new RandomizerFake();
  let attacker: FightingCard;
  let defender: FightingCard;

  const entangle = (failChance = 0.7) =>
    new EntangleAttackEffect(failChance, effectRandomizer).applyEffect(
      defender,
      attacker,
      {
        sourcePlayer: new Player('p1', [attacker]),
        opponentPlayer: new Player('p2', [defender]),
      },
    );

  beforeEach(() => {
    effectRandomizer.reset();
    cardRandomizer.reset();
    attacker = createFightingCard({});
    defender = createFightingCard({
      resistance: 0,
      randomizer: cardRandomizer,
    });
  });

  it('reports the entanglement as a status', () => {
    expect(entangle()).toEqual({ type: 'entangle', card: defender });
  });

  it('makes the next offensive action fail under its chance', () => {
    entangle();
    cardRandomizer.setNextRandomValue(0.69);

    expect(defender.failsOffensiveAction()).toBe(true);
  });

  it('lets the action through above its chance', () => {
    entangle();
    cardRandomizer.setNextRandomValue(0.7);

    expect(defender.failsOffensiveAction()).toBe(false);
  });

  it('goes with the first offensive action', () => {
    entangle();
    defender.failsOffensiveAction();

    expect(defender.isEntangled).toBe(false);
  });

  it('is refused by a control immunity', () => {
    defender.activateStance({
      name: 'Garde',
      duration: 2,
      immunities: ['control'],
    });

    expect(entangle()).toBeUndefined();
  });

  it('rejects a fail chance outside ]0, 1]', () => {
    expect(() => new EntangleAttackEffect(1.2, effectRandomizer)).toThrow(
      'Entangle failChance must be in ]0, 1], got 1.2',
    );
  });
});

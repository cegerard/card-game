import { StackedPoisonAttackEffect } from '../attack-stacked-poison-effect';
import { MathRandomizer } from '../../../../../tools/math-randomizer';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { StateEffectResult } from '../attack-effect';
import { CardStateFrozen } from '../../state/card-state-frozen';

function venom(
  params: {
    stacks?: number;
    maxStacks?: number;
    ignoresImmunity?: boolean;
  } = {},
): StackedPoisonAttackEffect {
  return new StackedPoisonAttackEffect(
    0.03,
    3,
    params.maxStacks ?? 3,
    2,
    new MathRandomizer(),
    {
      stacks: params.stacks,
      basis: 'target-max-health',
      ignoresImmunity: params.ignoresImmunity,
    },
  );
}

const tick = (card: FightingCard) => card.applyStateEffects()[0];

describe('StackedPoisonAttackEffect', () => {
  let attacker: FightingCard;
  let defender: FightingCard;

  beforeEach(() => {
    attacker = createFightingCard({ attack: 100 });
    defender = createFightingCard({ health: 1000 });
  });

  describe('on a defender that is not poisoned', () => {
    let result: StateEffectResult;

    beforeEach(() => {
      result = venom().applyEffect(defender, attacker, null);
    });

    it('reports the poison with its stack count', () => {
      expect(result).toEqual({ type: 'poison', card: defender, stacks: 1 });
    });

    it('ticks a share of the target max health', () => {
      expect(tick(defender).damage).toBe(30);
    });

    it('names the card that laid it', () => {
      expect(defender.poisoner).toBe(attacker);
    });
  });

  describe('when stacks pile up', () => {
    it('multiplies the tick at each stack', () => {
      [1, 2, 3].forEach(() => venom().applyEffect(defender, attacker, null));

      expect(tick(defender).damage).toBe(120);
    });

    it('stops at the cap', () => {
      [1, 2, 3, 4].forEach(() => venom().applyEffect(defender, attacker, null));

      expect(defender.poisonStacks()).toBe(3);
    });

    it('keeps a poison already above its own cap', () => {
      venom({ stacks: 5, maxStacks: 5 }).applyEffect(defender, attacker, null);
      venom().applyEffect(defender, attacker, null);

      expect(defender.poisonStacks()).toBe(5);
    });

    it('restarts the poison for its whole duration', () => {
      venom().applyEffect(defender, attacker, null);
      tick(defender);
      venom().applyEffect(defender, attacker, null);

      expect(tick(defender).remainingTurns).toBe(2);
    });
  });

  describe('against a damage-over-time immunity', () => {
    beforeEach(() => {
      defender.activateStance({
        name: 'warded',
        duration: 2,
        immunities: ['damage-over-time'],
      });
    });

    it('is refused', () => {
      venom().applyEffect(defender, attacker, null);

      expect(defender.poisonStacks()).toBe(0);
    });

    it('goes through when it ignores immunity', () => {
      venom({ ignoresImmunity: true }).applyEffect(defender, attacker, null);

      expect(defender.poisonStacks()).toBe(1);
    });
  });

  it('is not laid on a frozen card', () => {
    defender.setState(new CardStateFrozen(1, 1, 0));
    venom().applyEffect(defender, attacker, null);

    expect(defender.poisonStacks()).toBe(0);
  });

  it('rejects a non positive stack multiplier', () => {
    expect(
      () => new StackedPoisonAttackEffect(0.03, 3, 3, 0, new MathRandomizer()),
    ).toThrow('stackMultiplier');
  });
});

describe('FightingCard stacked poison', () => {
  let attacker: FightingCard;
  let defender: FightingCard;

  beforeEach(() => {
    attacker = createFightingCard({ attack: 100 });
    defender = createFightingCard({ health: 1000 });
    venom().applyEffect(defender, attacker, null);
  });

  it('surges to the given stacks with its damage multiplied', () => {
    defender.surgePoison(3, 2);

    expect(tick(defender).damage).toBe(240);
  });

  it('keeps the surge through a later application', () => {
    defender.surgePoison(3, 2);
    venom().applyEffect(defender, attacker, null);

    expect(tick(defender).damage).toBe(240);
  });

  it('counts the cards its owner keeps poisoned', () => {
    expect(attacker.poisonedCardCount).toBe(1);
  });

  it('keeps the poisoner known on a card the poison killed', () => {
    tick(defender);
    tick(defender);
    defender.addRealDamage(930);
    tick(defender);

    expect(defender.poisoner).toBe(attacker);
  });
});

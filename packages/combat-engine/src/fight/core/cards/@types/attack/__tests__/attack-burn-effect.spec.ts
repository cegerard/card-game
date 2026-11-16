import { BurnAttackEffect } from '../attack-burn-effect';
import { EffectTriggeredDebuff } from '../effect-triggered-debuff';
import { CardStateBurned } from '../../state/card-state-burned';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { MathRandomizer } from '../../../../../tools/math-randomizer';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { StateEffectResult } from '../attack-effect';

function makeCards() {
  const attacker = createFightingCard({ attack: 200 });
  const defender = createFightingCard({ defense: 100 });
  return { attacker, defender };
}

describe('BurnAttackEffect number precision', () => {
  it('rounds damage value to 2 decimal places', () => {
    const attacker = createFightingCard({ attack: 33 });
    const defender = createFightingCard({ health: 100 });
    const effect = new BurnAttackEffect(0.1, 1, new MathRandomizer());
    effect.applyEffect(defender, attacker, null);

    const [stateResult] = defender.applyStateEffects();

    expect(stateResult.damage).toBe(3.3);
  });
});

describe('BurnAttackEffect with triggeredDebuff', () => {
  const randomizer = new RandomizerFake();

  afterEach(() => {
    randomizer.reset();
  });

  describe('when burn is applied and roll succeeds', () => {
    let result: StateEffectResult;

    beforeEach(() => {
      randomizer.setNextRandomValue(0);
      const { attacker, defender } = makeCards();
      const triggered = new EffectTriggeredDebuff(
        1.0,
        'defense',
        0.1,
        2,
        randomizer,
      );
      const effect = new BurnAttackEffect(
        0.2,
        1,
        new MathRandomizer(),
        triggered,
      );
      result = effect.applyEffect(defender, attacker, null);
    });

    it('populates triggeredDebuff in EffectResult', () => {
      expect(result.triggeredDebuff).toEqual({
        card: expect.anything(),
        debuff: expect.objectContaining({
          type: 'defense',
          value: 10,
          duration: 2,
        }),
      });
    });
  });

  describe('when burn level is already high enough (effect skipped)', () => {
    let result: StateEffectResult;

    beforeEach(() => {
      const { attacker, defender } = makeCards();
      defender.setState(new CardStateBurned(2, 3, 10));
      const triggered = new EffectTriggeredDebuff(
        1.0,
        'defense',
        0.1,
        2,
        randomizer,
      );
      const effect = new BurnAttackEffect(
        0.2,
        1,
        new MathRandomizer(),
        triggered,
      );
      result = effect.applyEffect(defender, attacker, null);
    });

    it('returns undefined (no triggered debuff)', () => {
      expect(result).toBeUndefined();
    });
  });
});

describe('BurnAttackEffect with an explicit duration', () => {
  const burnedTurnsLeft = (level: 1 | 3, duration?: number) => {
    const defender = createFightingCard({});
    new BurnAttackEffect(
      0.1,
      level,
      new MathRandomizer(),
      undefined,
      undefined,
      undefined,
      duration,
    ).applyEffect(defender, createFightingCard({}), {} as any);
    return defender.applyStateEffects()[0].remainingTurns;
  };

  it('outlasts the single turn of its level 1', () => {
    expect(burnedTurnsLeft(1, 2)).toBe(1);
  });

  it('cuts short the five turns of its level 3', () => {
    expect(burnedTurnsLeft(3, 2)).toBe(1);
  });

  it('keeps the level duration when absent', () => {
    expect(burnedTurnsLeft(3)).toBe(4);
  });

  it.each([0, 1.5])('refuses a duration of %s', (duration) => {
    expect(
      () =>
        new BurnAttackEffect(
          0.1,
          1,
          new MathRandomizer(),
          undefined,
          undefined,
          undefined,
          duration,
        ),
    ).toThrow(`BurnAttackEffect duration must be an integer >= 1`);
  });
});

import { BurnAttackEffect } from '../attack-burn-effect';
import { EffectTriggeredDebuff } from '../effect-triggered-debuff';
import { CardStateBurned } from '../../state/card-state-burned';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { MathRandomizer } from '../../../../../tools/math-randomizer';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { EffectResult } from '../attack-effect';

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
    let result: EffectResult;

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
    let result: EffectResult;

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

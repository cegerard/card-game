import { FreezeAttackEffect } from '../attack-freeze-effect';
import { EffectTriggeredDebuff } from '../effect-triggered-debuff';
import { CardStateFrozen } from '../../state/card-state-frozen';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { EffectResult } from '../attack-effect';

function makeCards() {
  const attacker = createFightingCard({ attack: 200 });
  const defender = createFightingCard({ agility: 50 });
  return { attacker, defender };
}

describe('FreezeAttackEffect with triggeredDebuff', () => {
  const randomizer = new RandomizerFake();

  afterEach(() => {
    randomizer.reset();
  });

  describe('when freeze is applied and roll succeeds', () => {
    let result: EffectResult;

    beforeEach(() => {
      randomizer.setNextRandomValue(0);
      const { attacker, defender } = makeCards();
      const triggered = new EffectTriggeredDebuff(
        1.0,
        'agility',
        0.1,
        2,
        randomizer,
      );
      const effect = new FreezeAttackEffect(0.2, 1, triggered);
      result = effect.applyEffect(defender, attacker, null);
    });

    it('populates triggeredDebuff in EffectResult', () => {
      expect(result.triggeredDebuff).toEqual({
        card: expect.anything(),
        debuff: expect.objectContaining({
          type: 'agility',
          value: 5,
          duration: 2,
        }),
      });
    });
  });

  describe('when frozen level is already high enough (effect skipped)', () => {
    let result: EffectResult;

    beforeEach(() => {
      const { attacker, defender } = makeCards();
      defender.setState(new CardStateFrozen(2, 3, 0.1));
      const triggered = new EffectTriggeredDebuff(
        1.0,
        'agility',
        0.1,
        2,
        randomizer,
      );
      const effect = new FreezeAttackEffect(0.2, 1, triggered);
      result = effect.applyEffect(defender, attacker, null);
    });

    it('returns undefined (no triggered debuff)', () => {
      expect(result).toBeUndefined();
    });
  });
});

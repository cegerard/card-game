import { PoisonedAttackEffect } from '../attack-poisoned-effect';
import { EffectTriggeredDebuff } from '../effect-triggered-debuff';
import { CardStateFrozen } from '../../state/card-state-frozen';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { EffectResult } from '../attack-effect';

function makeCards() {
  const attacker = createFightingCard({ attack: 200 });
  const defender = createFightingCard({ defense: 100, attack: 150 });
  return { attacker, defender };
}

describe('PoisonedAttackEffect with triggeredDebuff', () => {
  const randomizer = new RandomizerFake();

  afterEach(() => {
    randomizer.reset();
  });

  describe('when poison is applied and roll succeeds', () => {
    let result: EffectResult;

    beforeEach(() => {
      randomizer.setNextRandomValue(0);
      const { attacker, defender } = makeCards();
      const triggered = new EffectTriggeredDebuff(
        1.0,
        'attack',
        0.1,
        2,
        randomizer,
      );
      const effect = new PoisonedAttackEffect(0.2, 1, triggered);
      result = effect.applyEffect(defender, attacker, null);
    });

    it('populates triggeredDebuff in EffectResult', () => {
      expect(result.triggeredDebuff).toEqual({
        card: expect.anything(),
        debuff: expect.objectContaining({
          type: 'attack',
          value: 15,
          duration: 2,
        }),
      });
    });
  });

  describe('when defender is frozen (effect skipped)', () => {
    let result: EffectResult;

    beforeEach(() => {
      const { attacker, defender } = makeCards();
      defender.setState(new CardStateFrozen(1, 1, 0.1));
      const triggered = new EffectTriggeredDebuff(
        1.0,
        'attack',
        0.1,
        2,
        randomizer,
      );
      const effect = new PoisonedAttackEffect(0.2, 1, triggered);
      result = effect.applyEffect(defender, attacker, null);
    });

    it('returns undefined (no triggered debuff)', () => {
      expect(result).toBeUndefined();
    });
  });
});

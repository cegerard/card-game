import { EffectTriggeredDebuff } from '../effect-triggered-debuff';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';

describe('EffectTriggeredDebuff', () => {
  const randomizer = new RandomizerFake();

  afterEach(() => {
    randomizer.reset();
  });

  describe('when the random roll succeeds', () => {
    let result: ReturnType<EffectTriggeredDebuff['tryApply']>;

    beforeEach(() => {
      randomizer.setNextRandomValue(0);
      const target = createFightingCard({ defense: 200 });
      const triggered = new EffectTriggeredDebuff(
        1.0,
        'defense',
        0.1,
        2,
        randomizer,
      );
      result = triggered.tryApply(target);
    });

    it('returns the applied debuff', () => {
      expect(result).toEqual({
        type: 'defense',
        value: 20,
        duration: 2,
      });
    });
  });

  describe('when the random roll fails', () => {
    let result: ReturnType<EffectTriggeredDebuff['tryApply']>;

    beforeEach(() => {
      randomizer.setNextRandomValue(100);
      const target = createFightingCard({ defense: 200 });
      const triggered = new EffectTriggeredDebuff(
        1.0,
        'defense',
        0.1,
        2,
        randomizer,
      );
      result = triggered.tryApply(target);
    });

    it('returns undefined', () => {
      expect(result).toBeUndefined();
    });
  });
});

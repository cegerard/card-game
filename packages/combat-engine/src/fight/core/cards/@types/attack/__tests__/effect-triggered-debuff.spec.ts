import { EffectTriggeredDebuff } from '../effect-triggered-debuff';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';

describe('EffectTriggeredDebuff constructor validation', () => {
  const randomizer = new RandomizerFake();

  it('throws when probability is below 0', () => {
    expect(
      () => new EffectTriggeredDebuff(-0.1, 'defense', 0.1, 2, randomizer),
    ).toThrow('probability must be in [0, 1], got: -0.1');
  });

  it('throws when probability is above 1', () => {
    expect(
      () => new EffectTriggeredDebuff(1.5, 'defense', 0.1, 2, randomizer),
    ).toThrow('probability must be in [0, 1], got: 1.5');
  });
});

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
        polarity: 'debuff',
        type: 'defense',
        value: 20,
        duration: 2,
        terminationEvent: undefined,
        powerId: undefined,
      });
    });
  });

  describe('when a terminationEvent is provided', () => {
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
        'my-end-event',
      );
      result = triggered.tryApply(target);
    });

    it('returns the applied debuff with the terminationEvent', () => {
      expect(result).toEqual({
        polarity: 'debuff',
        type: 'defense',
        value: 20,
        duration: 2,
        terminationEvent: 'my-end-event',
        powerId: undefined,
      });
    });
  });

  describe('when a powerId is provided', () => {
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
        undefined,
        'my-power-id',
      );
      result = triggered.tryApply(target);
    });

    it('returns the applied debuff with the powerId', () => {
      expect(result).toEqual({
        polarity: 'debuff',
        type: 'defense',
        value: 20,
        duration: 2,
        terminationEvent: undefined,
        powerId: 'my-power-id',
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

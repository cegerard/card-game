import { ProbabilityCondition } from '../probability-condition';
import { FightingCard } from '../../../../fighting-card';
import { FightingContext } from '../../../fighting-context';
import { RandomizerFake } from '../../../../../../../../test/helpers/randomizer-fake';
import { MathRandomizer } from '../../../../../../tools/math-randomizer';

const source = {} as FightingCard;
const context = {} as FightingContext;

describe('ProbabilityCondition', () => {
  describe('rolling against the chance', () => {
    it('passes when the roll is below the probability', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.1);
      const condition = new ProbabilityCondition(0.3, randomizer);

      expect(condition.evaluate(source, context)).toBe(true);
    });

    it('fails when the roll is above the probability', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.9);
      const condition = new ProbabilityCondition(0.3, randomizer);

      expect(condition.evaluate(source, context)).toBe(false);
    });

    it('fails when the roll equals the probability', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.3);
      const condition = new ProbabilityCondition(0.3, randomizer);

      expect(condition.evaluate(source, context)).toBe(false);
    });
  });

  describe('certain outcomes', () => {
    it('always passes at a probability of 1', () => {
      const condition = new ProbabilityCondition(1, new MathRandomizer());

      expect(condition.evaluate(source, context)).toBe(true);
    });

    it('never passes at a probability of 0', () => {
      const condition = new ProbabilityCondition(0, new MathRandomizer());

      expect(condition.evaluate(source, context)).toBe(false);
    });
  });

  describe('re-evaluation', () => {
    it('rolls again on each evaluation', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.1);
      const condition = new ProbabilityCondition(0.3, randomizer);
      condition.evaluate(source, context);
      randomizer.setNextRandomValue(0.9);

      expect(condition.evaluate(source, context)).toBe(false);
    });
  });

  describe('invalid configuration', () => {
    it('rejects a negative probability', () => {
      expect(
        () => new ProbabilityCondition(-0.1, new MathRandomizer()),
      ).toThrow('probability must be in [0, 1], got: -0.1');
    });

    it('rejects a probability above 1', () => {
      expect(() => new ProbabilityCondition(2, new MathRandomizer())).toThrow(
        'probability must be in [0, 1], got: 2',
      );
    });
  });
});

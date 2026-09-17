import { DamageReductionSkill } from '../damage-reduction';
import { RandomizerFake } from '../../../../../../test/helpers/randomizer-fake';
import { MathRandomizer } from '../../../../tools/math-randomizer';

describe('DamageReductionSkill', () => {
  const NAME = 'Resilience des marais';

  describe('without probability', () => {
    it('always reduces the damage by its rate', () => {
      const skill = new DamageReductionSkill(NAME, 0.15, new MathRandomizer());
      expect(skill.tryMitigate(100)).toBe(85);
    });

    it('rounds the mitigated damage to an integer', () => {
      const skill = new DamageReductionSkill(NAME, 0.15, new MathRandomizer());
      expect(skill.tryMitigate(33)).toBe(28);
    });

    it('absorbs everything at rate 1', () => {
      const skill = new DamageReductionSkill(NAME, 1, new MathRandomizer());
      expect(skill.tryMitigate(100)).toBe(0);
    });
  });

  describe('with probability', () => {
    it('mitigates when the roll succeeds', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.1);
      const skill = new DamageReductionSkill(NAME, 0.15, randomizer, 0.3);
      expect(skill.tryMitigate(100)).toBe(85);
    });

    it('returns undefined when the roll fails', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.9);
      const skill = new DamageReductionSkill(NAME, 0.15, randomizer, 0.3);
      expect(skill.tryMitigate(100)).toBeUndefined();
    });

    it('returns undefined when the roll equals the probability', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.3);
      const skill = new DamageReductionSkill(NAME, 0.15, randomizer, 0.3);
      expect(skill.tryMitigate(100)).toBeUndefined();
    });
  });

  describe('invalid configuration', () => {
    it('rejects a rate of 0', () => {
      expect(
        () => new DamageReductionSkill(NAME, 0, new MathRandomizer()),
      ).toThrow('rate must be in ]0, 1], got: 0');
    });

    it('rejects a rate above 1', () => {
      expect(
        () => new DamageReductionSkill(NAME, 1.5, new MathRandomizer()),
      ).toThrow('rate must be in ]0, 1], got: 1.5');
    });

    it('rejects a probability above 1', () => {
      expect(
        () => new DamageReductionSkill(NAME, 0.15, new MathRandomizer(), 2),
      ).toThrow('probability must be in [0, 1], got: 2');
    });
  });
});

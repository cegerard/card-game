import { faker } from '@faker-js/faker';

import { MathRandomizer } from '../math-randomizer';

describe('math randomizer', () => {
  const randomizer = new MathRandomizer();
  describe('when computing a integer between two values', () => {
    describe('when max is strictly higher than min', () => {
      const min = faker.number.int(10);
      const max = faker.number.int({ min, max: 100 });
      it('returns a value greater than or equal to min', () => {
        const randomValue = randomizer.random_int_between(min, max);

        expect(randomValue).toBeGreaterThanOrEqual(min);
      });

      it('returns a value less than or equal to max', () => {
        const randomValue = randomizer.random_int_between(min, max);

        expect(randomValue).toBeLessThanOrEqual(max);
      });
    });

    describe('when max is equal to min', () => {
      const min = faker.number.int(100);
      const max = min;
      it('returns the min/max value', () => {
        const randomValue = randomizer.random_int_between(min, max);

        expect(randomValue).toEqual(min);
      });
    });
  });
});

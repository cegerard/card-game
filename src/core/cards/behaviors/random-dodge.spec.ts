import { RandomizerFake } from '../../../../test/helpers/randomizer-fake';
import { RandomDodge } from './random-dodge';

describe('RandomDodge', () => {
  const randomizer = new RandomizerFake();
  const randomDodge = new RandomDodge(randomizer);

  afterEach(() => {
    randomizer.reset();
  });

  describe('with a 60% dodge rate', () => {
    const defenderAgility = 48;

    describe('when the attacker reduce the dodge rate by 20%', () => {
      const attackerAccuracy = 20;

      describe('when the random number is below the reduced dodge rate', () => {
        const random = 10;

        beforeEach(() => {
          randomizer.setNextRandomValue(random);
        });

        it('should dodge', () => {
          expect(randomDodge.dodge(defenderAgility, attackerAccuracy)).toBe(
            true,
          );
        });
      });
    });
  });
});

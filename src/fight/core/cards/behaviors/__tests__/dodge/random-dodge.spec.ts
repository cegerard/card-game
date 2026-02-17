import { faker } from '@faker-js/faker';

import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { RandomDodge } from '../../random-dodge';

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
        const random = faker.number.int({ min: 0, max: 39 });

        beforeEach(() => {
          randomizer.setNextRandomValue(random);
        });

        it('dodge', () => {
          const isDodge = randomDodge.dodge(defenderAgility, attackerAccuracy);
          expect(isDodge).toBe(true);
        });
      });

      describe('when the random number is above the reduced dodge rate', () => {
        const random = faker.number.int({ min: 40, max: 100 });

        beforeEach(() => {
          randomizer.setNextRandomValue(random);
        });

        it('not dodge', () => {
          const isDodge = randomDodge.dodge(defenderAgility, attackerAccuracy);
          expect(isDodge).toBe(false);
        });
      });
    });

    describe('when the attacker reduce the dodge rate to 0%', () => {
      const attackerAccuracy = 60;

      beforeEach(() => {
        randomizer.setNextRandomValue(0);
      });

      it('not dodge', () => {
        const isDodge = randomDodge.dodge(defenderAgility, attackerAccuracy);
        expect(isDodge).toBe(false);
      });
    });

    describe('when the attacker have an accuracy higher than the dodge rate', () => {
      const attackerAccuracy = 70;

      beforeEach(() => {
        randomizer.setNextRandomValue(0);
      });

      it('not dodge', () => {
        const isDodge = randomDodge.dodge(defenderAgility, attackerAccuracy);
        expect(isDodge).toBe(false);
      });
    });

    describe('when the attacker have an accuracy equal to 0', () => {
      const attackerAccuracy = 0;

      describe('when the random number is below the dodge rate', () => {
        const random = faker.number.int({ min: 0, max: 59 });

        beforeEach(() => {
          randomizer.setNextRandomValue(random);
        });

        it('dodge', () => {
          const isDodge = randomDodge.dodge(defenderAgility, attackerAccuracy);
          expect(isDodge).toBe(true);
        });
      });

      describe('when the random number is above the dodge rate', () => {
        const random = faker.number.int({ min: 60, max: 100 });

        beforeEach(() => {
          randomizer.setNextRandomValue(random);
        });

        it('not dodge', () => {
          const isDodge = randomDodge.dodge(defenderAgility, attackerAccuracy);
          expect(isDodge).toBe(false);
        });
      });
    });
  });
});

import { RampingChance } from '../ramping-chance';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';

describe('RampingChance', () => {
  let randomizer: RandomizerFake;
  let chance: RampingChance;

  const rolls = (count: number, blocked = false) =>
    [...Array(count)].map(() => chance.roll(blocked));

  beforeEach(() => {
    randomizer = new RandomizerFake().setNextRandomValue(0.3);
    chance = new RampingChance(0.25, 0.1, 3, randomizer);
  });

  it('never fires before its turn', () => {
    randomizer.setNextRandomValue(0);

    expect(rolls(2)).toEqual([false, false]);
  });

  it('grows after each event it did not fire', () => {
    expect(rolls(4)).toEqual([false, false, false, true]);
  });

  it('drops back to 0 once it fired', () => {
    rolls(4);

    expect(rolls(3)).toEqual([false, false, false]);
  });

  it('grows again from 0 after firing', () => {
    rolls(4);

    expect(rolls(5)).toEqual([false, false, false, false, true]);
  });

  it('never fires a blocked event, which still grows it', () => {
    rolls(3, true);

    expect(rolls(1)).toEqual([true]);
  });

  it('rejects a start chance above 1', () => {
    expect(() => new RampingChance(1.5, 0.1, 1, randomizer)).toThrow(
      'startChance',
    );
  });
});

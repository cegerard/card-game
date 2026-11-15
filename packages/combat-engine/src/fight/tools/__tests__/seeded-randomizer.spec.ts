import { SeededRandomizer } from '../seeded-randomizer';

const draw = (seed: number, count: number) => {
  const randomizer = new SeededRandomizer(seed);
  return Array.from({ length: count }, () => randomizer.random());
};

describe('SeededRandomizer', () => {
  it('draws the same sequence for the same seed', () => {
    expect(draw(42, 5)).toEqual(draw(42, 5));
  });

  it('draws another sequence for another seed', () => {
    expect(draw(42, 5)).not.toEqual(draw(43, 5));
  });

  it('draws in [0, 1)', () => {
    expect(draw(7, 1000).every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('draws integers within the bounds from its own sequence', () => {
    const randomizer = new SeededRandomizer(7);
    const values = Array.from({ length: 1000 }, () =>
      randomizer.random_int_between(1, 3),
    );

    expect([...new Set(values)].sort()).toEqual([1, 2, 3]);
  });
});

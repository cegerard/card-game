import { seededRandom } from '../seeded-random';

const draw = (next: () => number, count: number) =>
  Array.from({ length: count }, () => next());

describe('seededRandom', () => {
  it('draws the same sequence for the same seed', () => {
    expect(draw(seededRandom(42), 5)).toEqual(draw(seededRandom(42), 5));
  });

  it('draws another sequence for another seed', () => {
    expect(draw(seededRandom(42), 5)).not.toEqual(draw(seededRandom(43), 5));
  });

  it('draws in [0, 1)', () => {
    const values = draw(seededRandom(7), 1000);

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});

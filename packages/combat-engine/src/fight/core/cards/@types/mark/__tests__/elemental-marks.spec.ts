import { DamageType } from '@card-game/shared-types';
import { ElementalMark } from '../elemental-mark';
import { ElementalMarks } from '../elemental-marks';

describe('ElementalMarks', () => {
  const fireMark = new ElementalMark(DamageType.FIRE, 0.1, 3);
  let marks: ElementalMarks;

  beforeEach(() => {
    marks = new ElementalMarks();
  });

  it('keeps a first application within the cap', () => {
    expect(marks.apply(fireMark, 5)).toBe(3);
  });

  it('stops a later application at the cap', () => {
    marks.apply(fireMark, 2);

    expect(marks.apply(fireMark, 2)).toBe(3);
  });

  it('amplifies its damage type by the rate of each stack', () => {
    marks.apply(fireMark, 2);

    expect(marks.amplifier(DamageType.FIRE)).toBe(1.2);
  });

  it('leaves the other damage types alone', () => {
    marks.apply(fireMark, 2);

    expect(marks.amplifier(DamageType.WATER)).toBe(1);
  });
});

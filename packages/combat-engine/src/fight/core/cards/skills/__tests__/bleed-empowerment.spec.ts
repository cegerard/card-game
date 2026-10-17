import { RateBasis } from '../../@types/rate-basis';
import { BleedEmpowermentSkill } from '../bleed-empowerment';

describe('BleedEmpowermentSkill', () => {
  it('rejects a negative extra stack count', () => {
    expect(
      () => new BleedEmpowermentSkill('Lames', 'vent-rouge', -1, 0.08),
    ).toThrow();
  });

  it('rejects a rate that is not positive', () => {
    expect(
      () => new BleedEmpowermentSkill('Lames', 'vent-rouge', 1, 0),
    ).toThrow();
  });

  it.each([0, 1.5])('rejects a duration of %s', (duration) => {
    expect(
      () =>
        new BleedEmpowermentSkill('Griffures', 'fusion', 0, 0.03, { duration }),
    ).toThrow('BleedEmpowermentSkill duration must be an integer');
  });

  it('rejects an unknown basis', () => {
    expect(
      () =>
        new BleedEmpowermentSkill('Griffures', 'fusion', 0, 0.03, {
          basis: 'whatever' as RateBasis,
        }),
    ).toThrow('Unknown bleed basis: whatever');
  });
});

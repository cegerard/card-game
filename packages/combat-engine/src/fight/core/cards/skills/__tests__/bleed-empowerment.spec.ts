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
});

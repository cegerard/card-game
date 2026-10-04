import { LowHealthDebuff } from '../low-health-debuff';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';

describe('LowHealthDebuff', () => {
  const shock = new LowHealthDebuff('Choc Hémorragique', 0.3, [
    { type: 'defense', rate: 0.4, duration: 4 },
    { type: 'regeneration', rate: 0.8, duration: 4 },
  ]);
  let target: FightingCard;

  beforeEach(() => {
    target = createFightingCard({ health: 1000 });
  });

  it('debuffs a target left under the threshold', () => {
    target.addRealDamage(750);

    expect(
      shock
        .apply(target)
        .map((r) => [r.alteration.type, r.alteration.duration]),
    ).toEqual([
      ['defense', 4],
      ['regeneration', 4],
    ]);
  });

  it('debuffs a target that was already under the threshold', () => {
    target.addRealDamage(900);

    expect(shock.apply(target)).toHaveLength(2);
  });

  it('leaves a target above the threshold alone', () => {
    target.addRealDamage(500);

    expect(shock.apply(target)).toEqual([]);
  });

  it('leaves a dead target alone', () => {
    target.addRealDamage(100000);

    expect(shock.apply(target)).toEqual([]);
  });

  it('rejects a threshold outside ]0, 1]', () => {
    expect(() => new LowHealthDebuff('Choc', 0, [])).toThrow();
  });
});

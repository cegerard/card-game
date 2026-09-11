import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

describe('FightingCard critical chance alteration', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ criticalChance: 0.2 });
  });

  it('raises the actual critical chance with a buff', () => {
    card.applyBuff('criticalChance', 0.5, 3);

    expect(card.actualCriticalChance).toBeCloseTo(0.3);
  });

  it('lowers the actual critical chance with a debuff', () => {
    card.applyDebuff('criticalChance', 0.5, 3);

    expect(card.actualCriticalChance).toBeCloseTo(0.1);
  });

  it('never exceeds a certain critical chance', () => {
    card.applyBuff('criticalChance', 10, 3);

    expect(card.actualCriticalChance).toBe(1);
  });

  it('never drops below zero', () => {
    card.applyDebuff('criticalChance', 10, 3);

    expect(card.actualCriticalChance).toBe(0);
  });

  it('restores the base critical chance once the buff expires', () => {
    card.applyBuff('criticalChance', 0.5, 1);
    card.decreaseBuffAndDebuffDuration();
    card.decreaseBuffAndDebuffDuration();

    expect(card.actualCriticalChance).toBe(0.2);
  });
});

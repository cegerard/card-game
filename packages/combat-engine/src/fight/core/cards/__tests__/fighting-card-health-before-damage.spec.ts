import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

describe('FightingCard health ratio before the last damage', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ health: 1000, defense: 0 });
  });

  it('is full before any damage', () => {
    expect(card.healthRatioBeforeLastDamage).toBe(1);
  });

  it('remembers the ratio before a hit', () => {
    card.addRealDamage(800);
    card.applyFinalDamage(500);

    expect(card.healthRatioBeforeLastDamage).toBe(0.2);
  });

  it('remembers the ratio before a real damage', () => {
    card.applyFinalDamage(300);
    card.addRealDamage(1000);

    expect(card.healthRatioBeforeLastDamage).toBe(0.7);
  });
});

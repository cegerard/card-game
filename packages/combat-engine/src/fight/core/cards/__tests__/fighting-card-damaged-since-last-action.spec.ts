import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

describe('FightingCard — damaged since its last action', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ health: 1000 });
  });

  it('is undamaged when nothing hit it', () => {
    card.beginAction();

    expect(card.damagedSinceLastAction).toBe(false);
  });

  it('is damaged after losing health to a hit', () => {
    card.applyFinalDamage(100);
    card.beginAction();

    expect(card.damagedSinceLastAction).toBe(true);
  });

  it('is damaged after losing health to a status tick', () => {
    card.addRealDamage(50);
    card.beginAction();

    expect(card.damagedSinceLastAction).toBe(true);
  });

  it('is undamaged again at the next action without a hit', () => {
    card.applyFinalDamage(100);
    card.beginAction();
    card.beginAction();

    expect(card.damagedSinceLastAction).toBe(false);
  });

  it('ignores a hit the shield absorbed entirely', () => {
    card.applyShield(0.5, 2);
    card.applyFinalDamage(100);
    card.beginAction();

    expect(card.damagedSinceLastAction).toBe(false);
  });
});

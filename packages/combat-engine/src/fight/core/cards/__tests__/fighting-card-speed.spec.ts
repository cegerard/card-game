import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

describe('FightingCard speed alteration', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ speed: 100 });
  });

  it('raises the actual speed with a speed buff', () => {
    card.applyBuff('speed', 0.2, 3);

    expect(card.actualSpeed).toBe(120);
  });

  it('lowers the actual speed with a speed debuff', () => {
    card.applyDebuff('speed', 0.08, 3);

    expect(card.actualSpeed).toBe(92);
  });

  it('never drops the actual speed below zero', () => {
    card.applyDebuff('speed', 2, 3);

    expect(card.actualSpeed).toBe(0);
  });

  it('keeps the base speed once the alteration expires', () => {
    card.applyBuff('speed', 0.2, 1);
    card.decreaseBuffAndDebuffDuration();
    card.decreaseBuffAndDebuffDuration();

    expect(card.actualSpeed).toBe(100);
  });
});

describe('FightingCard turn order with altered speed', () => {
  it('is slower than an opponent once debuffed below it', () => {
    const card = createFightingCard({ speed: 100 });
    const opponent = createFightingCard({ speed: 95 });
    card.applyDebuff('speed', 0.1, 3);

    expect(card.fasterThan(opponent)).toBe(false);
  });

  it('is faster than an opponent once buffed above it', () => {
    const card = createFightingCard({ speed: 100 });
    const opponent = createFightingCard({ speed: 110 });
    card.applyBuff('speed', 0.2, 3);

    expect(card.fasterThan(opponent)).toBe(true);
  });
});

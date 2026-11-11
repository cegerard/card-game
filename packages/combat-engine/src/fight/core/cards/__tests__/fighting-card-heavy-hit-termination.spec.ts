import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

const EVENT = 'damage-taken-umiko';

describe('FightingCard alteration ended by a heavy hit only', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ speed: 100 });
    card.applyBuff('speed', 0.05, Infinity, EVENT, undefined, undefined, {
      terminationDamageRate: 0.3,
    });
  });

  it('survives a hit costing at most the threshold', () => {
    card.removeEventBoundBuffs(EVENT, 0.3);

    expect(card.actualSpeed).toBe(105);
  });

  it('ends on a hit costing more than the threshold', () => {
    card.removeEventBoundBuffs(EVENT, 0.31);

    expect(card.actualSpeed).toBe(100);
  });

  it('survives the event fired without a hit', () => {
    card.removeEventBoundBuffs(EVENT);

    expect(card.actualSpeed).toBe(105);
  });

  it('still ends an alteration without threshold on any hit', () => {
    card.applyBuff('speed', 0.1, Infinity, 'other-event');
    card.removeEventBoundBuffs('other-event', 0.01);

    expect(card.actualSpeed).toBe(105);
  });
});

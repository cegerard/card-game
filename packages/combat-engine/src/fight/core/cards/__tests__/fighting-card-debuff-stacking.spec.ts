import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

const ENLISEMENT = { id: 'enlisement', maxStacks: 3 };

function slow(card: FightingCard, stacking = ENLISEMENT) {
  return card.applyDebuff('speed', 0.1, 3, undefined, undefined, stacking);
}

describe('FightingCard — debuff stack cap', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ speed: 100 });
  });

  describe('below the cap', () => {
    it('applies the debuff', () => {
      expect(slow(card)).toBeDefined();
    });

    it('counts the applied stacks', () => {
      slow(card);
      slow(card);

      expect(card.debuffStacks('enlisement')).toBe(2);
    });

    it('accumulates the effect on the stat', () => {
      slow(card);
      slow(card);

      expect(card.actualSpeed).toBe(80);
    });
  });

  describe('at the cap', () => {
    beforeEach(() => {
      slow(card);
      slow(card);
      slow(card);
    });

    it('refuses the next application', () => {
      expect(slow(card)).toBeUndefined();
    });

    it('does not grow the stack count', () => {
      slow(card);

      expect(card.debuffStacks('enlisement')).toBe(3);
    });

    it('leaves the stat untouched', () => {
      slow(card);

      expect(card.actualSpeed).toBe(70);
    });
  });

  describe('after a stack expires', () => {
    it('accepts a new application', () => {
      slow(card);
      slow(card);
      slow(card);
      card.decreaseBuffAndDebuffDuration();
      card.decreaseBuffAndDebuffDuration();
      card.decreaseBuffAndDebuffDuration();
      card.decreaseBuffAndDebuffDuration();

      expect(slow(card)).toBeDefined();
    });
  });

  describe('independent piles', () => {
    it('does not count another pile against this cap', () => {
      slow(card, { id: 'other-slow', maxStacks: 1 });
      slow(card);
      slow(card);

      expect(slow(card)).toBeDefined();
    });

    it('does not count an uncapped debuff of the same stat', () => {
      card.applyDebuff('speed', 0.1, 3);
      card.applyDebuff('speed', 0.1, 3);
      slow(card);
      slow(card);

      expect(slow(card)).toBeDefined();
    });
  });

  describe('without a stack budget', () => {
    it('keeps piling up without limit', () => {
      for (let i = 0; i < 10; i++) card.applyDebuff('speed', 0.1, 3);

      expect(card.actualSpeed).toBe(0);
    });

    it('belongs to no pile', () => {
      card.applyDebuff('speed', 0.1, 3);

      expect(card.debuffStacks('enlisement')).toBe(0);
    });
  });
});

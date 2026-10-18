import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

const INSTINCT = { id: 'instinct', maxStacks: 3 };

function hasten(card: FightingCard, stacking = INSTINCT) {
  return card.applyBuff(
    'speed',
    0.15,
    Infinity,
    undefined,
    undefined,
    stacking,
  );
}

describe('FightingCard — buff stack cap', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ speed: 100 });
  });

  describe('below the cap', () => {
    it('applies the buff', () => {
      expect(hasten(card)).toBeDefined();
    });

    it('counts the applied stacks', () => {
      hasten(card);
      hasten(card);

      expect(card.buffStacks('instinct')).toBe(2);
    });
  });

  describe('at the cap', () => {
    beforeEach(() => {
      hasten(card);
      hasten(card);
      hasten(card);
    });

    it('refuses the fourth application', () => {
      expect(hasten(card)).toBeUndefined();
    });

    it('does not grow the stack count', () => {
      hasten(card);

      expect(card.buffStacks('instinct')).toBe(3);
    });

    it('leaves the stat untouched', () => {
      hasten(card);

      expect(card.actualSpeed).toBe(145);
    });
  });

  describe('independent piles', () => {
    it('does not count another pile against this cap', () => {
      hasten(card, { id: 'other-haste', maxStacks: 1 });
      hasten(card);
      hasten(card);

      expect(hasten(card)).toBeDefined();
    });

    it('does not count a capped debuff of the same id', () => {
      card.applyDebuff('speed', 0.1, 3, undefined, undefined, INSTINCT);
      hasten(card);
      hasten(card);

      expect(hasten(card)).toBeDefined();
    });
  });

  describe('without a stack budget', () => {
    it('belongs to no pile', () => {
      card.applyBuff('speed', 0.15, 3);

      expect(card.buffStacks('instinct')).toBe(0);
    });
  });
});

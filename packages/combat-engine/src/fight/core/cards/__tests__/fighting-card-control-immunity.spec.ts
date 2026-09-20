import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';
import { CardStateStunted } from '../@types/state/card-state-stunted';
import { CardStateFrozen } from '../@types/state/card-state-frozen';
import { CardStatePoisoned } from '../@types/state/card-state-poisoned';

const ANCHOR = 'forteresse-des-ages';

describe('FightingCard — control immunity granted by a stance', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ health: 1000 });
  });

  describe('while the stance grants control immunity', () => {
    beforeEach(() => {
      card.activateStance(ANCHOR, 3, ['control']);
    });

    it('refuses a stunt', () => {
      expect(card.setState(new CardStateStunted(1, 1))).toBe(false);
    });

    it('leaves the card free to act', () => {
      card.setState(new CardStateStunted(1, 1));

      expect(card.isStunted).toBe(false);
    });

    it('refuses a freeze', () => {
      expect(card.setState(new CardStateFrozen(1, 1, 0.2))).toBe(false);
    });

    it('still accepts a poison, which is not control', () => {
      expect(card.setState(new CardStatePoisoned(1, 1, 10))).toBe(true);
    });

    it('reports immunity to control', () => {
      expect(card.isImmuneTo('control')).toBe(true);
    });

    it('reports no immunity to damage over time', () => {
      expect(card.isImmuneTo('damage-over-time')).toBe(false);
    });
  });

  describe('without the stance', () => {
    it('accepts a stunt', () => {
      expect(card.setState(new CardStateStunted(1, 1))).toBe(true);
    });
  });

  describe('once the stance runs out', () => {
    it('accepts a stunt again', () => {
      card.activateStance(ANCHOR, 1, ['control']);
      card.decreaseStanceDurations();
      card.decreaseStanceDurations();

      expect(card.setState(new CardStateStunted(1, 1))).toBe(true);
    });
  });

  describe('a stance granting no immunity', () => {
    it('does not protect from control', () => {
      card.activateStance(ANCHOR, 3);

      expect(card.isImmuneTo('control')).toBe(false);
    });
  });

  describe('a blanket transformation immunity', () => {
    it('still covers every category', () => {
      card.applyStatusImmunity(3);

      expect(card.isImmuneTo('damage-over-time')).toBe(true);
    });
  });
});

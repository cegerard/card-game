import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { CardStatePoisoned } from '../@types/state/card-state-poisoned';
import { CardStateBurned } from '../@types/state/card-state-burned';
import { CardStateFrozen } from '../@types/state/card-state-frozen';

describe('FightingCard.removeEventBoundEffects()', () => {
  describe('when card has a poisoned effect with matching terminationEvent', () => {
    it('removes the poison effect', () => {
      const card = createFightingCard({});
      card.setState(new CardStatePoisoned(1, 3, 50, 'cleanse'));

      card.removeEventBoundEffects('cleanse');

      expect(card.poisonLevel).toBe(0);
    });

    it('returns removed effect info', () => {
      const card = createFightingCard({});
      card.setState(new CardStatePoisoned(1, 3, 50, 'cleanse'));

      const removed = card.removeEventBoundEffects('cleanse');

      expect(removed).toEqual([{ type: 'poison', card: card.identityInfo }]);
    });
  });

  describe('when card has a burned effect with matching terminationEvent', () => {
    it('removes the burn effect', () => {
      const card = createFightingCard({});
      card.setState(new CardStateBurned(2, 3, 80, 'fire-end'));

      card.removeEventBoundEffects('fire-end');

      expect(card.burnLevel).toBe(0);
    });

    it('returns removed effect info', () => {
      const card = createFightingCard({});
      card.setState(new CardStateBurned(2, 3, 80, 'fire-end'));

      const removed = card.removeEventBoundEffects('fire-end');

      expect(removed).toEqual([{ type: 'burn', card: card.identityInfo }]);
    });
  });

  describe('when card has a frozen effect with matching terminationEvent', () => {
    it('removes the freeze effect', () => {
      const card = createFightingCard({});
      card.setState(new CardStateFrozen(1, 3, 0.5, 'thaw'));

      card.removeEventBoundEffects('thaw');

      expect(card.frozenLevel).toBe(0);
    });

    it('returns removed effect info', () => {
      const card = createFightingCard({});
      card.setState(new CardStateFrozen(1, 3, 0.5, 'thaw'));

      const removed = card.removeEventBoundEffects('thaw');

      expect(removed).toEqual([{ type: 'freeze', card: card.identityInfo }]);
    });
  });

  describe('when card has effects without terminationEvent', () => {
    it('does not remove effects', () => {
      const card = createFightingCard({});
      card.setState(new CardStatePoisoned(1, 3, 50));
      card.setState(new CardStateBurned(1, 3, 80));

      card.removeEventBoundEffects('cleanse');

      expect(card.poisonLevel).toBe(1);
    });

    it('returns empty array', () => {
      const card = createFightingCard({});
      card.setState(new CardStatePoisoned(1, 3, 50));

      const removed = card.removeEventBoundEffects('cleanse');

      expect(removed).toHaveLength(0);
    });
  });

  describe('when card has multiple effects bound to the same event', () => {
    it('removes all matching effects', () => {
      const card = createFightingCard({});
      card.setState(new CardStatePoisoned(1, 3, 50, 'purge'));
      card.setState(new CardStateBurned(2, 3, 80, 'purge'));

      card.removeEventBoundEffects('purge');

      expect(card.poisonLevel).toBe(0);
    });

    it('returns info for all removed effects', () => {
      const card = createFightingCard({});
      card.setState(new CardStatePoisoned(1, 3, 50, 'purge'));
      card.setState(new CardStateBurned(2, 3, 80, 'purge'));

      const removed = card.removeEventBoundEffects('purge');

      expect(removed).toHaveLength(2);
    });
  });
});

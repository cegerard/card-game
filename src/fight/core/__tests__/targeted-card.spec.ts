import { TargetedCard } from '../targeting-card-strategies/targeted-card';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { Player } from '../player';

describe('TargetedCard', () => {
  describe('id', () => {
    it('returns targeted-card', () => {
      const strategy = new TargetedCard('any-id');

      expect(strategy.id).toBe('targeted-card');
    });
  });

  describe('targetedCards', () => {
    it('returns the target card when alive in defending player deck', () => {
      const targetCard = createFightingCard({ id: 'enemy-1', health: 1000 });
      const otherCard = createFightingCard({ id: 'enemy-2' });
      const attacker = createFightingCard({ id: 'attacker' });

      const attackingPlayer = new Player('P1', [attacker]);
      const defendingPlayer = new Player('P2', [targetCard, otherCard]);

      const strategy = new TargetedCard('enemy-1');

      const result = strategy.targetedCards(
        attacker,
        attackingPlayer,
        defendingPlayer,
      );

      expect(result).toEqual([targetCard]);
    });

    it('returns empty array when target card is dead', () => {
      const targetCard = createFightingCard({ id: 'enemy-1', health: 1 });
      const attacker = createFightingCard({ id: 'attacker', attack: 99999 });

      const attackingPlayer = new Player('P1', [attacker]);
      const defendingPlayer = new Player('P2', [targetCard]);

      // Kill the target card
      targetCard.addRealDamage(99999);

      const strategy = new TargetedCard('enemy-1');

      const result = strategy.targetedCards(
        attacker,
        attackingPlayer,
        defendingPlayer,
      );

      expect(result).toEqual([]);
    });

    it('returns empty array when target card ID does not exist in defending deck', () => {
      const otherCard = createFightingCard({ id: 'enemy-2' });
      const attacker = createFightingCard({ id: 'attacker' });

      const attackingPlayer = new Player('P1', [attacker]);
      const defendingPlayer = new Player('P2', [otherCard]);

      const strategy = new TargetedCard('non-existent-id');

      const result = strategy.targetedCards(
        attacker,
        attackingPlayer,
        defendingPlayer,
      );

      expect(result).toEqual([]);
    });
  });
});

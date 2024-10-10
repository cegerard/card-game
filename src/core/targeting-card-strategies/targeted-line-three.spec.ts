import { createFightingCard } from '../../../test/helpers/fighting-card';
import { Player } from '../player';
import { TargetedLineThree } from './targeted-line-three';

describe('TargetedLineThree Strategy', () => {
  const targetedLineThree = new TargetedLineThree();
  const attackingCard = createFightingCard({});
  const defendingCardRight = createFightingCard({});
  const defendingCardCenter = createFightingCard({});
  const defendingCardLeft = createFightingCard({});
  const defendingPlayer = new Player('Player 2', [
    defendingCardLeft,
    defendingCardCenter,
    defendingCardRight,
  ]);

  describe('when the attacking card is in the center', () => {
    const attackingPlayer = new Player('Player 1', [null, attackingCard]);

    it('should return the three cards from the center', () => {
      const targetedCards = targetedLineThree.targetedCards(
        attackingCard,
        attackingPlayer,
        defendingPlayer,
      );

      expect(targetedCards).toEqual([
        defendingCardLeft,
        defendingCardCenter,
        defendingCardRight,
      ]);
    });
  });

  describe('when the attacking card is on the left edge', () => {
    const attackingPlayer = new Player('Player 1', [attackingCard]);

    it('should return the two cards on the right', () => {
      const targetedCards = targetedLineThree.targetedCards(
        attackingCard,
        attackingPlayer,
        defendingPlayer,
      );

      expect(targetedCards).toEqual([defendingCardLeft, defendingCardCenter]);
    });
  });

  describe('when the attacking card is on the right edge', () => {
    const attackingPlayer = new Player('Player 1', [null, null, attackingCard]);

    it('should return the two cards on the left', () => {
      const targetedCards = targetedLineThree.targetedCards(
        attackingCard,
        attackingPlayer,
        defendingPlayer,
      );

      expect(targetedCards).toEqual([defendingCardCenter, defendingCardRight]);
    });
  });
});

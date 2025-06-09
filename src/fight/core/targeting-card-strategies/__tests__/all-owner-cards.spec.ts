import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { AllOwnerCards } from '../all-owner-cards';

describe('All Owner Cards Targeting Strategy', () => {
  let strategy: AllOwnerCards;
  let sourceCard: FightingCard;
  let player2: Player;

  beforeEach(() => {
    strategy = new AllOwnerCards();
    sourceCard = createFightingCard({ name: 'Source Card' });
    player2 = new Player('Player 2', [
      createFightingCard({ name: 'Card 3' }),
      createFightingCard({ name: 'Card 4' }),
    ]);
  });

  describe('with owner cards present', () => {
    let player1: Player;
    let targets: FightingCard[];

    beforeEach(() => {
      player1 = new Player('Player 1', [
        sourceCard,
        createFightingCard({ name: 'Card 1' }),
        createFightingCard({ name: 'Card 2' }),
      ]);

      targets = strategy.targetedCards(sourceCard, player1, player2);
    });

    it('targets all owner cards', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Source Card', 'Card 1', 'Card 2']);
    });
  });

  describe('with only source card present', () => {
    let player1: Player;
    let targets: FightingCard[];

    beforeEach(() => {
      player1 = new Player('Player 1', [sourceCard]);
      targets = strategy.targetedCards(sourceCard, player1, player2);
    });

    it('returns only the source card', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Source Card']);
    });
  });
});

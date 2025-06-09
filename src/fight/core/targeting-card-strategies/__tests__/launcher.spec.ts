import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { Launcher } from '../launcher';

describe('Launcher Targeting Strategy', () => {
  let strategy: Launcher;
  let sourceCard: FightingCard;
  let player2: Player;

  beforeEach(() => {
    strategy = new Launcher();
    sourceCard = createFightingCard({ name: 'Source Card' });
    player2 = new Player('Player 2', [
      createFightingCard({ name: 'Card 3' }),
      createFightingCard({ name: 'Card 4' }),
    ]);
  });

  describe('when targeting cards', () => {
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

    it('targets only the source card', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Source Card']);
    });
  });
});

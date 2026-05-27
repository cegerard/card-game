import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { AllAllies } from '../all-allies';

describe('All Allies Targeting Strategy', () => {
  let strategy: AllAllies;
  let sourceCard: FightingCard;
  let player2: Player;

  beforeEach(() => {
    strategy = new AllAllies();
    sourceCard = createFightingCard({ name: 'Source Card' });
    player2 = new Player('Player 2', [
      createFightingCard({ name: 'Card 3' }),
      createFightingCard({ name: 'Card 4' }),
    ]);
  });

  describe('with allies present', () => {
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
    it('targets all allies', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Card 1', 'Card 2']);
    });
  });

  describe('with no allies present', () => {
    let player1: Player;
    let targets: FightingCard[];

    beforeEach(() => {
      player1 = new Player('Player 1', [sourceCard]);
      targets = strategy.targetedCards(sourceCard, player1, player2);
    });

    it('returns an empty array', () => {
      expect(targets).toEqual([]);
    });
  });
});

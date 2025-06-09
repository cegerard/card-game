import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { TargetedAll } from '../targeted-all';

describe('Targeted All Targeting Strategy', () => {
  let strategy: TargetedAll;
  let sourceCard: FightingCard;
  let defendingPlayer: Player;

  beforeEach(() => {
    strategy = new TargetedAll();
    sourceCard = createFightingCard({ name: 'Source Card' });
  });

  describe('with defending player cards present', () => {
    let attackingPlayer: Player;
    let targets: FightingCard[];

    beforeEach(() => {
      attackingPlayer = new Player('Attacking Player', [sourceCard]);
      defendingPlayer = new Player('Defending Player', [
        createFightingCard({ name: 'Card 1' }),
        createFightingCard({ name: 'Card 2' }),
        createFightingCard({ name: 'Card 3' }),
      ]);

      targets = strategy.targetedCards(
        sourceCard,
        attackingPlayer,
        defendingPlayer,
      );
    });

    it('targets all defending player cards', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Card 1', 'Card 2', 'Card 3']);
    });
  });

  describe('with no defending player cards', () => {
    let attackingPlayer: Player;
    let targets: FightingCard[];

    beforeEach(() => {
      attackingPlayer = new Player('Attacking Player', [sourceCard]);
      defendingPlayer = new Player('Defending Player', []);

      targets = strategy.targetedCards(
        sourceCard,
        attackingPlayer,
        defendingPlayer,
      );
    });

    it('returns an empty array', () => {
      expect(targets).toEqual([]);
    });
  });
});

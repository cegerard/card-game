import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { TargetedFromPosition } from '../targeted-from-position';

describe('Targeted From Position Targeting Strategy', () => {
  let strategy: TargetedFromPosition;
  let sourceCard: FightingCard;
  let defendingPlayer: Player;

  beforeEach(() => {
    strategy = new TargetedFromPosition();
    sourceCard = createFightingCard({ name: 'Source Card' });
    defendingPlayer = new Player('Defending Player', [
      createFightingCard({ name: 'Card 1' }),
      createFightingCard({ name: 'Card 2' }),
      createFightingCard({ name: 'Card 3' }),
    ]);
  });

  describe('when targeting card at same position', () => {
    let attackingPlayer: Player;
    let targets: FightingCard[];

    beforeEach(() => {
      attackingPlayer = new Player('Attacking Player', [
        createFightingCard({ name: 'Other Card' }),
        sourceCard,
        createFightingCard({ name: 'Another Card' }),
      ]);

      targets = strategy.targetedCards(
        sourceCard,
        attackingPlayer,
        defendingPlayer,
      );
    });

    it('targets the card at the same position', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Card 2']);
    });
  });

  describe('when target card is dead', () => {
    let attackingPlayer: Player;
    let targets: FightingCard[];
    let deadCard: FightingCard;

    beforeEach(() => {
      deadCard = createFightingCard({ name: 'Dead Card' });
      deadCard.addRealDamage(deadCard.actualHealth);

      attackingPlayer = new Player('Attacking Player', [
        createFightingCard({ name: 'Other Card' }),
        sourceCard,
      ]);

      defendingPlayer = new Player('Defending Player', [
        createFightingCard({ name: 'Card 1' }),
        deadCard,
        createFightingCard({ name: 'Card 3' }),
      ]);

      targets = strategy.targetedCards(
        sourceCard,
        attackingPlayer,
        defendingPlayer,
      );
    });

    it('targets the next alive card', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Card 3']);
    });
  });

  describe('when all cards after dead card are dead', () => {
    let attackingPlayer: Player;
    let targets: FightingCard[];
    let deadCard1: FightingCard;
    let deadCard2: FightingCard;

    beforeEach(() => {
      deadCard1 = createFightingCard({ name: 'Dead Card 1' });
      deadCard2 = createFightingCard({ name: 'Dead Card 2' });
      deadCard1.addRealDamage(deadCard1.actualHealth);
      deadCard2.addRealDamage(deadCard2.actualHealth);

      attackingPlayer = new Player('Attacking Player', [
        createFightingCard({ name: 'Other Card' }),
        sourceCard,
      ]);

      defendingPlayer = new Player('Defending Player', [
        createFightingCard({ name: 'Card 1' }),
        deadCard1,
        deadCard2,
      ]);

      targets = strategy.targetedCards(
        sourceCard,
        attackingPlayer,
        defendingPlayer,
      );
    });

    it('targets the first alive card before the dead card', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Card 1']);
    });
  });

  describe('when all cards are dead', () => {
    let attackingPlayer: Player;
    let targets: FightingCard[];
    let deadCard1: FightingCard;
    let deadCard2: FightingCard;
    let deadCard3: FightingCard;

    beforeEach(() => {
      deadCard1 = createFightingCard({ name: 'Dead Card 1' });
      deadCard2 = createFightingCard({ name: 'Dead Card 2' });
      deadCard3 = createFightingCard({ name: 'Dead Card 3' });
      deadCard1.addRealDamage(deadCard1.actualHealth);
      deadCard2.addRealDamage(deadCard2.actualHealth);
      deadCard3.addRealDamage(deadCard3.actualHealth);

      attackingPlayer = new Player('Attacking Player', [
        createFightingCard({ name: 'Other Card' }),
        sourceCard,
      ]);

      defendingPlayer = new Player('Defending Player', [
        deadCard1,
        deadCard2,
        deadCard3,
      ]);

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

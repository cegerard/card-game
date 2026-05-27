import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { TargetedLineThree } from '../targeted-line-three';

describe('Targeted Line Three Targeting Strategy', () => {
  let strategy: TargetedLineThree;
  let sourceCard: FightingCard;
  let defendingPlayer: Player;

  beforeEach(() => {
    strategy = new TargetedLineThree();
    sourceCard = createFightingCard({ name: 'Source Card' });
    defendingPlayer = new Player('Defending Player', [
      createFightingCard({ name: 'Card 1' }),
      createFightingCard({ name: 'Card 2' }),
      createFightingCard({ name: 'Card 3' }),
      createFightingCard({ name: 'Card 4' }),
      createFightingCard({ name: 'Card 5' }),
    ]);
  });

  describe('when targeting from middle position', () => {
    let attackingPlayer: Player;
    let targets: FightingCard[];

    beforeEach(() => {
      attackingPlayer = new Player('Attacking Player', [
        createFightingCard({ name: 'Other Card' }),
        createFightingCard({ name: 'Another Card' }),
        sourceCard,
        createFightingCard({ name: 'Yet Another Card' }),
        createFightingCard({ name: 'Last Card' }),
      ]);

      targets = strategy.targetedCards(
        sourceCard,
        attackingPlayer,
        defendingPlayer,
      );
    });

    it('targets three cards from center position', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Card 2', 'Card 3', 'Card 4']);
    });
  });

  describe('when targeting from first position', () => {
    let attackingPlayer: Player;
    let targets: FightingCard[];

    beforeEach(() => {
      attackingPlayer = new Player('Attacking Player', [
        sourceCard,
        createFightingCard({ name: 'Another Card' }),
        createFightingCard({ name: 'Yet Another Card' }),
        createFightingCard({ name: 'Last Card' }),
      ]);

      targets = strategy.targetedCards(
        sourceCard,
        attackingPlayer,
        defendingPlayer,
      );
    });

    it('targets three cards from start', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Card 1', 'Card 2']);
    });
  });

  describe('when targeting from last position', () => {
    let attackingPlayer: Player;
    let targets: FightingCard[];

    beforeEach(() => {
      attackingPlayer = new Player('Attacking Player', [
        createFightingCard({ name: 'Other Card' }),
        createFightingCard({ name: 'Another Card' }),
        createFightingCard({ name: 'Yet Another Card' }),
        sourceCard,
      ]);

      targets = strategy.targetedCards(
        sourceCard,
        attackingPlayer,
        defendingPlayer,
      );
    });

    it('targets three cards from end', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Card 3', 'Card 4', 'Card 5']);
    });
  });

  describe('when some target cards are dead', () => {
    let attackingPlayer: Player;
    let targets: FightingCard[];
    let deadCard: FightingCard;

    beforeEach(() => {
      deadCard = createFightingCard({ name: 'Dead Card' });
      deadCard.addRealDamage(deadCard.actualHealth);

      attackingPlayer = new Player('Attacking Player', [
        createFightingCard({ name: 'Other Card' }),
        sourceCard,
        createFightingCard({ name: 'Yet Another Card' }),
      ]);

      defendingPlayer = new Player('Defending Player', [
        createFightingCard({ name: 'Card 1' }),
        deadCard,
        createFightingCard({ name: 'Card 3' }),
        createFightingCard({ name: 'Card 4' }),
      ]);

      targets = strategy.targetedCards(
        sourceCard,
        attackingPlayer,
        defendingPlayer,
      );
    });

    it('filters out dead cards', () => {
      const targetsNames = targets.map((target) => target.name);
      expect(targetsNames).toEqual(['Card 1', 'Card 3']);
    });
  });
});

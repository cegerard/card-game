import { AlliedCardByIdStrategy } from '../allied-card-by-id';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';

describe('AlliedCardByIdStrategy', () => {
  let opponentPlayer: Player;

  beforeEach(() => {
    opponentPlayer = new Player('opponent', [createFightingCard()]);
  });

  describe('when ally is alive in sourcePlayer', () => {
    let ally: FightingCard;
    let sourcePlayer: Player;
    let strategy: AlliedCardByIdStrategy;

    beforeEach(() => {
      ally = createFightingCard({ id: 'ally-01' });
      sourcePlayer = new Player('source', [createFightingCard(), ally]);
      strategy = new AlliedCardByIdStrategy('ally-01');
    });

    it('returns the ally card', () => {
      expect(
        strategy.targetedCards(createFightingCard(), sourcePlayer, opponentPlayer),
      ).toEqual([ally]);
    });
  });

  describe('when ally is dead', () => {
    let sourcePlayer: Player;
    let strategy: AlliedCardByIdStrategy;

    beforeEach(() => {
      const deadAlly = createFightingCard({ id: 'ally-01', health: 1 });
      deadAlly.applyFinalDamage(9999);
      sourcePlayer = new Player('source', [createFightingCard(), deadAlly]);
      strategy = new AlliedCardByIdStrategy('ally-01');
    });

    it('returns empty array', () => {
      expect(
        strategy.targetedCards(createFightingCard(), sourcePlayer, opponentPlayer),
      ).toEqual([]);
    });
  });

  describe('when ally is absent from team', () => {
    let sourcePlayer: Player;
    let strategy: AlliedCardByIdStrategy;

    beforeEach(() => {
      sourcePlayer = new Player('source', [createFightingCard()]);
      strategy = new AlliedCardByIdStrategy('non-existent-id');
    });

    it('returns empty array', () => {
      expect(
        strategy.targetedCards(createFightingCard(), sourcePlayer, opponentPlayer),
      ).toEqual([]);
    });
  });
});

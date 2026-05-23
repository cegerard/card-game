import { LastAttackerOfAllyTargetingStrategy } from '../last-attacker-of-ally';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';

describe('LastAttackerOfAllyTargetingStrategy', () => {
  const ALLY_ID = 'ally-01';
  let strategy: LastAttackerOfAllyTargetingStrategy;
  let sourcePlayer: Player;
  let opponentPlayer: Player;

  beforeEach(() => {
    strategy = new LastAttackerOfAllyTargetingStrategy(ALLY_ID);
    sourcePlayer = new Player('source', [createFightingCard({ id: ALLY_ID })]);
    opponentPlayer = new Player('opponent', [createFightingCard()]);
  });

  describe('when ally has no lastAttacker recorded', () => {
    it('returns empty array', () => {
      expect(
        strategy.targetedCards(
          createFightingCard(),
          sourcePlayer,
          opponentPlayer,
        ),
      ).toEqual([]);
    });
  });

  describe('when ally has an alive lastAttacker', () => {
    let attacker: ReturnType<typeof createFightingCard>;

    beforeEach(() => {
      attacker = createFightingCard();
      sourcePlayer.allCards[0].lastAttacker = attacker;
    });

    it('returns the last attacker card', () => {
      expect(
        strategy.targetedCards(
          createFightingCard(),
          sourcePlayer,
          opponentPlayer,
        ),
      ).toEqual([attacker]);
    });
  });

  describe('when ally lastAttacker is dead', () => {
    beforeEach(() => {
      const deadAttacker = createFightingCard({ health: 1 });
      deadAttacker.applyFinalDamage(9999);
      sourcePlayer.allCards[0].lastAttacker = deadAttacker;
    });

    it('returns empty array', () => {
      expect(
        strategy.targetedCards(
          createFightingCard(),
          sourcePlayer,
          opponentPlayer,
        ),
      ).toEqual([]);
    });
  });

  describe('when ally is absent from both players', () => {
    beforeEach(() => {
      strategy = new LastAttackerOfAllyTargetingStrategy('non-existent-id');
    });

    it('returns empty array', () => {
      expect(
        strategy.targetedCards(
          createFightingCard(),
          sourcePlayer,
          opponentPlayer,
        ),
      ).toEqual([]);
    });
  });

  describe('when ally is in defendingPlayer team only', () => {
    let attacker: ReturnType<typeof createFightingCard>;

    beforeEach(() => {
      attacker = createFightingCard();
      sourcePlayer = new Player('source', [createFightingCard()]);
      opponentPlayer = new Player('opponent', [
        createFightingCard({ id: ALLY_ID }),
      ]);
      opponentPlayer.allCards[0].lastAttacker = attacker;
    });

    it('finds ally via fallback and returns last attacker', () => {
      expect(
        strategy.targetedCards(
          createFightingCard(),
          sourcePlayer,
          opponentPlayer,
        ),
      ).toEqual([attacker]);
    });
  });
});

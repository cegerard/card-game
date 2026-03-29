import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { FightingContext } from '../@types/fighting-context';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';

describe('FightingCard targeting override', () => {
  let context: FightingContext;
  let enemy1;
  let enemy2;

  beforeEach(() => {
    enemy1 = createFightingCard({
      id: 'enemy-1',
      name: 'Enemy1',
      health: 5000,
    });
    enemy2 = createFightingCard({
      id: 'enemy-2',
      name: 'Enemy2',
      health: 5000,
    });
  });

  describe('overrideAttackTargeting', () => {
    it('changes the targeting used by launchAttack to target all', () => {
      const card = createFightingCard({
        id: 'card-1',
        attack: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            targetingStrategy: 'position-based',
          },
        },
      });
      const player1 = new Player('p1', [card]);
      const player2 = new Player('p2', [enemy1, enemy2]);
      context = { sourcePlayer: player1, opponentPlayer: player2 };

      card.overrideAttackTargeting(new TargetedAll(), 'power-end');
      const results = card.launchAttack(context);

      expect(results).toHaveLength(2);
    });
  });

  describe('restoreAttackTargeting', () => {
    it('reverts to original targeting after restore', () => {
      const card = createFightingCard({
        id: 'card-1',
        attack: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            targetingStrategy: 'position-based',
          },
        },
      });
      const player1 = new Player('p1', [card]);
      const player2 = new Player('p2', [enemy1, enemy2]);
      context = { sourcePlayer: player1, opponentPlayer: player2 };

      card.overrideAttackTargeting(new TargetedAll(), 'power-end');
      card.restoreAttackTargeting('power-end');
      const results = card.launchAttack(context);

      expect(results).toHaveLength(1);
    });

    it('returns the removed overrides', () => {
      const card = createFightingCard({ id: 'card-1' });
      const strategy = new TargetedAll();

      card.overrideAttackTargeting(strategy, 'power-end');
      const removed = card.restoreAttackTargeting('power-end');

      expect(removed).toEqual([
        {
          strategy: strategy,
          terminationEvent: 'power-end',
        },
      ]);
    });

    it('returns the original strategy id for reporting', () => {
      const card = createFightingCard({
        id: 'card-1',
        skills: {
          simpleAttack: { targetingStrategy: 'position-based' },
        },
      });

      expect(card.attackTargetingId).toBe('from-position');
    });
  });
});

import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';

describe('FightingCard composite power', () => {
  beforeEach(() => {});

  describe('two skills with same powerId and trigger both fire', () => {
    it('returns two SkillResults', () => {
      const card = createFightingCard({
        id: 'card-1',
        attack: 100,
        health: 5000,
        skills: {
          others: [
            {
              buffType: 'attack',
              buffRate: 0.2,
              duration: 3,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              powerId: 'my-power',
            },
            {
              effectRate: 0.1,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              powerId: 'my-power',
            },
          ],
        },
      });
      const player1 = new Player('p1', [card]);
      const player2 = new Player('p2', [createFightingCard()]);
      const ctx = { sourcePlayer: player1, opponentPlayer: player2 };

      const results = card.launchSkills('turn-end', ctx);

      expect(results).toHaveLength(2);
    });

    it('carries powerId on both results', () => {
      const card = createFightingCard({
        id: 'card-1',
        attack: 100,
        health: 5000,
        skills: {
          others: [
            {
              buffType: 'attack',
              buffRate: 0.2,
              duration: 3,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              powerId: 'my-power',
            },
            {
              effectRate: 0.1,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              powerId: 'my-power',
            },
          ],
        },
      });
      const player1 = new Player('p1', [card]);
      const player2 = new Player('p2', [createFightingCard()]);
      const ctx = { sourcePlayer: player1, opponentPlayer: player2 };

      const results = card.launchSkills('turn-end', ctx);

      expect(results.every((r) => r.powerId === 'my-power')).toBe(true);
    });
  });

  describe('skills with different powerIds activate independently', () => {
    it('returns results with their respective powerIds', () => {
      const card = createFightingCard({
        id: 'card-1',
        attack: 100,
        health: 5000,
        skills: {
          others: [
            {
              buffType: 'attack',
              buffRate: 0.2,
              duration: 3,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              powerId: 'power-a',
            },
            {
              buffType: 'defense',
              buffRate: 0.1,
              duration: 3,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              powerId: 'power-b',
            },
          ],
        },
      });
      const player1 = new Player('p1', [card]);
      const player2 = new Player('p2', [createFightingCard()]);
      const ctx = { sourcePlayer: player1, opponentPlayer: player2 };

      const results = card.launchSkills('turn-end', ctx);

      expect(results[0].powerId).toBe('power-a');
      expect(results[1].powerId).toBe('power-b');
    });
  });
});

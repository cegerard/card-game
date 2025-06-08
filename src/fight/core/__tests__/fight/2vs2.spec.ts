import { Fight } from '../../fight-simulator/fight';
import { Player } from '../../player';
import { DamageReport } from '../../fight-simulator/@types/damage-report';
import { FightResult } from '../../fight-simulator/@types/fight-result';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { SpeedWeightedCardSelector } from '../../fight-simulator/card-selectors/speed-weighted-card-pool';

describe('with only two cards each', () => {
  describe('when the player1 has the speediest cards in speed weighted card pool selection', () => {
    let player1AttackCount: number;
    let player2AttackCount: number;
    let res: FightResult;

    beforeAll(() => {
      const card1 = createFightingCard({
        attack: 100,
        defense: 30,
        health: 100,
        speed: 100,
        criticalChance: 1,
        skills: {
          simpleAttack: {
            damageRate: 1.0,
          },
        },
      });
      const card2 = createFightingCard({
        attack: 60,
        defense: 30,
        health: 50,
        speed: 80,
        criticalChance: 1,
        agility: 0,
        skills: {
          simpleAttack: {
            damageRate: 1.0,
          },
        },
      });
      const card3 = createFightingCard({
        attack: 10,
        defense: 5,
        health: 50,
        speed: 5,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: {
            damageRate: 1.0,
          },
        },
      });
      const card4 = createFightingCard({
        attack: 10,
        defense: 5,
        health: 50,
        speed: 5,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: {
            damageRate: 1.0,
          },
        },
      });
      const player1 = new Player('Player 1', [card1, card2]);
      const player2 = new Player('Player 2', [card3, card4]);
      const fight = new Fight(
        player1,
        player2,
        new SpeedWeightedCardSelector(player1, player2),
      );

      res = fight.start();
      player1AttackCount = Object.values(res).filter(
        (step) =>
          step.kind === 'attack' &&
          (step as DamageReport).attacker.deckIdentity.startsWith('Player 1'),
      ).length;
      player2AttackCount = Object.values(res).filter(
        (step) =>
          step.kind === 'attack' &&
          (step as DamageReport).attacker.deckIdentity.startsWith('Player 2'),
      ).length;
    });

    it('attack more frequently', () => {
      expect(player1AttackCount).toBeGreaterThanOrEqual(player2AttackCount);
    });

    it('wins', () => {
      expect(res[Object.keys(res).length]).toEqual({
        kind: 'fight_end',
        winner: 'Player 1',
      });
    });
  });
});

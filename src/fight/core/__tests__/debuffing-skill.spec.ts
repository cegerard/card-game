import { Fight } from '../fight-simulator/fight';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';

describe('Debuffing-skill', () => {
  let card1: FightingCard;
  let player1: Player;
  let card2: FightingCard;
  let player2: Player;
  let fight: Fight;

  beforeEach(() => {
    card2 = createFightingCard({
      attack: 120,
      defense: 50,
      health: 180,
      speed: 80,
      criticalChance: 0,
      agility: 30,
      accuracy: 60,
      skills: {
        simpleAttack: {
          damageRate: 1.2,
        },
        others: [],
      },
    });

    player2 = new Player('Player 2', [card2]);
  });

  describe('Attack debuff application', () => {
    beforeEach(() => {
      card1 = createFightingCard({
        attack: 100,
        defense: 100,
        health: 200,
        speed: 100,
        criticalChance: 0,
        agility: 50,
        accuracy: 75,
        skills: {
          simpleAttack: {
            damageRate: 1.0,
          },
          others: [
            {
              debuffType: 'attack',
              duration: 3,
              debuffRate: 0.3,
              trigger: 'turn-end',
              targetingStrategy: 'position-based',
            },
          ],
        },
      });

      player1 = new Player('Player 1', [card1]);

      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('applies attack debuff to opponent when triggered at turn end', () => {
      const initialAttack = card2.actualAttack;

      const fightResult = fight.start();

      expect(fightResult).toMatchObject({
        1: expect.objectContaining({
          kind: 'attack',
          attacker: card1.identityInfo,
        }),
        2: expect.objectContaining({
          kind: 'debuff',
          source: card1.identityInfo,
          debuffs: [
            {
              target: card2.identityInfo,
              kind: 'attack',
              value: 36, // 30% of 120
              remainingTurns: 3,
            },
          ],
        }),
      });

      expect(card2.actualAttack).toBe(initialAttack - 36 * 2);
    });
  });

  describe('Defense debuff application', () => {
    beforeEach(() => {
      card1 = createFightingCard({
        attack: 80,
        defense: 40,
        health: 200,
        speed: 100,
        criticalChance: 0,
        agility: 50,
        skills: {
          simpleAttack: {
            damageRate: 1.0,
          },
          others: [
            {
              debuffType: 'defense',
              duration: 2,
              debuffRate: 0.4,
              trigger: 'turn-end',
              targetingStrategy: 'position-based',
            },
          ],
        },
      });

      player1 = new Player('Player 1', [card1]);
      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('applies defense debuff making target more vulnerable', () => {
      const initialDefense = card2.actualDefense;

      fight.start();

      // Defense should be debuff
      expect(card2.actualDefense).toBe(initialDefense - 20); // 40% of 50
    });
  });

  describe('Agility debuff application', () => {
    beforeEach(() => {
      card1 = createFightingCard({
        attack: 80,
        defense: 40,
        health: 200,
        speed: 100,
        criticalChance: 0,
        agility: 50,
        skills: {
          simpleAttack: {
            damageRate: 1.0,
          },
          others: [
            {
              debuffType: 'agility',
              duration: 2,
              debuffRate: 0.5,
              trigger: 'turn-end',
              targetingStrategy: 'position-based',
            },
          ],
        },
      });

      player1 = new Player('Player 1', [card1]);
      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('applies agility debuff making target less evasive', () => {
      const initialAgility = card2.actualAgility;

      fight.start();

      expect(card2.actualAgility).toBe(initialAgility - 15); // 50% of 30
    });
  });

  describe('Accuracy debuff application', () => {
    beforeEach(() => {
      card1 = createFightingCard({
        attack: 80,
        defense: 40,
        health: 200,
        speed: 100,
        criticalChance: 0,
        agility: 50,
        skills: {
          simpleAttack: {
            damageRate: 1.0,
          },
          others: [
            {
              debuffType: 'accuracy',
              duration: 2,
              debuffRate: 0.1,
              trigger: 'turn-end',
              targetingStrategy: 'position-based',
            },
          ],
        },
      });

      player1 = new Player('Player 1', [card1]);
      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('applies accuracy debuff making target less precise', () => {
      const initialAccuracy = card2.actualAccuracy;

      fight.start();

      expect(card2.actualAccuracy).toBe(initialAccuracy - 6); // 10% of 60
    });
  });

  // describe('With multiple debuff of the same type', () => {
  //   beforeEach(() => {
  //     card1 = createFightingCard({
  //       attack: 80,
  //       defense: 40,
  //       health: 200,
  //       speed: 100,
  //       criticalChance: 0,
  //       agility: 50,
  //       skills: {
  //         simpleAttack: {
  //           damageRate: 1.0,
  //         },
  //         others: [
  //           {
  //             debuffType: 'attack',
  //             duration: 2,
  //             debuffRate: 0.2,
  //             trigger: 'turn-end',
  //             targetingStrategy: 'position-based',
  //           },
  //           {
  //             debuffType: 'attack',
  //             duration: 3,
  //             debuffRate: 0.1,
  //             trigger: 'after-simple-attack',
  //             targetingStrategy: 'position-based',
  //           },
  //         ],
  //       },
  //     });

  //     player1 = new Player('Player 1', [card1]);
  //     fight = new Fight(
  //       player1,
  //       player2,
  //       new PlayerByPlayerCardSelector(player1, player2),
  //     );
  //   });

  //   it('stacks debuffs of the same type', () => {
  //     const initialAttack = card2.actualAttack;

  //     fight.start();

  //     expect(card2.actualAttack).toBe(initialAttack - 36); // 20% of 120 + 10% of 120
  //   });
  // });
});

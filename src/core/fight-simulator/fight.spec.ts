import { Fight } from './fight';
import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { DamageReport } from '../card-attack/@types/damage-report';
import { FightResult } from './@types/fight-result';
import { PlayerByPlayerCardSelector } from './card-selectors/player-by-player';
import { SpecialAttack } from '../cards/skills/special-attack';
import { TargetedFromPosition } from '../targeting-card-strategies/targeted-from-position';
import { SimpleAttack } from '../cards/skills/simple-attack';
import { createFightingCard } from '../../../test/helpers/fighting-card';

describe('fight', () => {
  describe('with a determined process', () => {
    describe('with only one card each', () => {
      describe('when the first player has the strongest card', () => {
        const card1 = createFightingCard({
          damage: 100,
          defense: 100,
          health: 100,
          speed: 100,
          criticalChance: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            specialAttack: {
              damageRate: 0,
              energy: 10,
            },
          },
        });
        const card2 = new FightingCard(
          'Sword',
          {
            damage: 1,
            defense: 1,
            health: 1,
            speed: 1,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
          },
        );
        const player1 = new Player('Player 1', [card1]);
        const player2 = new Player('Player 2', [card2]);
        const fight = new Fight(
          player1,
          player2,
          new PlayerByPlayerCardSelector(player1, player2),
        );

        it('should return the fight steps', () => {
          expect(fight.start()).toEqual({
            1: {
              kind: 'attack',
              attacker: card1.displayName,
              defender: card2.displayName,
              damage: 99,
              isCritical: false,
            },
            2: {
              kind: 'status_change',
              card: card2.displayName,
              status: 'dead',
            },
            3: { kind: 'fight_end', winner: player1.name },
          });
        });
      });

      describe('when the first player has the weakest card', () => {
        const card1 = new FightingCard(
          'Axe',
          {
            damage: 1,
            defense: 1,
            health: 1,
            speed: 1,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
          },
        );
        const card2 = new FightingCard(
          'Sword',
          {
            damage: 60,
            defense: 60,
            health: 60,
            speed: 60,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
          },
        );
        const player1 = new Player('Player 1', [card1]);
        const player2 = new Player('Player 2', [card2]);
        const fight = new Fight(
          player1,
          player2,
          new PlayerByPlayerCardSelector(player1, player2),
        );

        it('should return the fight steps', () => {
          expect(fight.start()).toEqual({
            1: {
              kind: 'attack',
              attacker: card2.displayName,
              defender: card1.displayName,
              damage: 59,
              isCritical: false,
            },
            2: {
              kind: 'status_change',
              card: card1.displayName,
              status: 'dead',
            },
            3: { kind: 'fight_end', winner: player2.name },
          });
        });
      });

      describe('when the cards have the same strength, health and speed', () => {
        const damage = 50;
        const card1 = new FightingCard(
          'Axe',
          {
            damage,
            defense: 20,
            health: 1,
            speed: 50,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
          },
        );
        const card2 = new FightingCard(
          'Sword',
          {
            damage,
            defense: 25,
            health: 1,
            speed: 50,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
          },
        );
        const player1 = new Player('Player 1', [card1]);
        const player2 = new Player('Player 2', [card2]);
        const fight = new Fight(
          player1,
          player2,
          new PlayerByPlayerCardSelector(player1, player2),
        );

        it('should return the fight steps', () => {
          expect(fight.start()).toEqual({
            1: {
              kind: 'attack',
              attacker: card1.displayName,
              defender: card2.displayName,
              damage: 25,
              isCritical: false,
            },
            2: {
              kind: 'attack',
              attacker: card2.displayName,
              defender: card1.displayName,
              damage: 30,
              isCritical: false,
            },
            3: {
              kind: 'status_change',
              card: card2.displayName,
              status: 'dead',
            },
            4: {
              kind: 'status_change',
              card: card1.displayName,
              status: 'dead',
            },
            5: { kind: 'fight_end', winner: null },
          });
        });
      });

      describe('when the cards have the same strength and defense', () => {
        const damage = 50;
        const card1 = new FightingCard(
          'Axe',
          {
            damage,
            defense: damage,
            health: 1,
            speed: 50,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const card2 = new FightingCard(
          'Sword',
          {
            damage,
            defense: damage,
            health: 1,
            speed: 25,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const player1 = new Player('Player 1', [card1]);
        const player2 = new Player('Player 2', [card2]);
        const fight = new Fight(
          player1,
          player2,
          new PlayerByPlayerCardSelector(player1, player2),
        );
        let fightResult: FightResult;

        beforeAll(() => {
          fightResult = fight.start();
        });

        it('iterates and end without winner', () => {
          expect(fightResult[101]).toEqual({ kind: 'fight_end', winner: null });
        });

        it('iterates 50 times for each card', () => {
          const counter = { card1: 0, card2: 0 };
          Object.values(fightResult)
            .filter((step) => step.kind === 'attack')
            .forEach((step) => {
              const attacker = (step as DamageReport).attacker;
              if (attacker === card1.displayName) {
                counter.card1++;
              } else {
                counter.card2++;
              }
            });

          expect(counter).toEqual({ card1: 50, card2: 50 });
        });
      });
    });

    describe('with five cards each', () => {
      describe('when the first player has the strongest cards', () => {
        const card1 = new FightingCard(
          'Axe',
          {
            damage: 100,
            defense: 100,
            health: 100,
            speed: 100,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const card2 = new FightingCard(
          'Sword',
          {
            damage: 1,
            defense: 1,
            health: 1,
            speed: 1,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const card3 = new FightingCard(
          'Elbow',
          {
            damage: 5,
            defense: 5,
            health: 5,
            speed: 5,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const card4 = new FightingCard(
          'Arrow',
          {
            damage: 10,
            defense: 10,
            health: 10,
            speed: 10,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const card5 = new FightingCard(
          'Pic',
          {
            damage: 20,
            defense: 20,
            health: 20,
            speed: 20,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const card6 = new FightingCard(
          'Dragon',
          {
            damage: 30,
            defense: 30,
            health: 30,
            speed: 30,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const card7 = new FightingCard(
          'Lizard',
          {
            damage: 40,
            defense: 40,
            health: 40,
            speed: 40,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const card8 = new FightingCard(
          'Lion',
          {
            damage: 50,
            defense: 50,
            health: 50,
            speed: 50,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const card9 = new FightingCard(
          'Elephant',
          {
            damage: 60,
            defense: 60,
            health: 60,
            speed: 60,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const card10 = new FightingCard(
          'Phoenix',
          {
            damage: 70,
            defense: 70,
            health: 70,
            speed: 70,
            criticalChance: 0,
          },
          {
            simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
            specialAttack: new SpecialAttack(
              0,
              1000,
              new TargetedFromPosition(),
            ),
          },
        );
        const player1 = new Player('Player 1', [
          card1,
          card2,
          card3,
          card4,
          card5,
        ]); // Pass name
        const player2 = new Player('Player 2', [
          card6,
          card7,
          card8,
          card9,
          card10,
        ]); // Pass name
        const fight = new Fight(
          player1,
          player2,
          new PlayerByPlayerCardSelector(player1, player2),
        );

        it('should return the fight steps', () => {
          const steps = fight.start();
          expect(steps).toEqual({
            1: {
              kind: 'attack',
              attacker: card1.displayName,
              defender: card6.displayName,
              damage: 70,
              isCritical: false,
            },
            2: {
              kind: 'status_change',
              card: card6.displayName,
              status: 'dead',
            },
            3: {
              kind: 'attack',
              attacker: card10.displayName,
              defender: card5.displayName,
              damage: 50,
              isCritical: false,
            },
            4: {
              kind: 'status_change',
              card: card5.displayName,
              status: 'dead',
            },
            5: {
              kind: 'attack',
              attacker: card4.displayName,
              defender: card9.displayName,
              damage: 0,
              isCritical: false,
            },
            6: {
              kind: 'attack',
              attacker: card9.displayName,
              defender: card4.displayName,
              damage: 50,
              isCritical: false,
            },
            7: {
              kind: 'status_change',
              card: card4.displayName,
              status: 'dead',
            },
            8: {
              kind: 'attack',
              attacker: card3.displayName,
              defender: card8.displayName,
              damage: 0,
              isCritical: false,
            },
            9: {
              kind: 'attack',
              attacker: card8.displayName,
              defender: card3.displayName,
              damage: 45,
              isCritical: false,
            },
            10: {
              kind: 'status_change',
              card: card3.displayName,
              status: 'dead',
            },
            11: {
              kind: 'attack',
              attacker: card2.displayName,
              defender: card7.displayName,
              damage: 0,
              isCritical: false,
            },
            12: {
              kind: 'attack',
              attacker: card7.displayName,
              defender: card2.displayName,
              damage: 39,
              isCritical: false,
            },
            13: {
              kind: 'status_change',
              card: card2.displayName,
              status: 'dead',
            },
            14: {
              kind: 'attack',
              attacker: card1.displayName,
              defender: card7.displayName,
              damage: 60,
              isCritical: false,
            },
            15: {
              kind: 'status_change',
              card: card7.displayName,
              status: 'dead',
            },
            16: {
              kind: 'attack',
              attacker: card10.displayName,
              defender: card1.displayName,
              damage: 0,
              isCritical: false,
            },
            17: {
              kind: 'attack',
              attacker: card1.displayName,
              defender: card8.displayName,
              damage: 50,
              isCritical: false,
            },
            18: {
              kind: 'status_change',
              card: card8.displayName,
              status: 'dead',
            },
            19: {
              kind: 'attack',
              attacker: card9.displayName,
              defender: card1.displayName,
              damage: 0,
              isCritical: false,
            },
            20: {
              kind: 'attack',
              attacker: card1.displayName,
              defender: card9.displayName,
              damage: 40,
              isCritical: false,
            },
            21: {
              kind: 'attack',
              attacker: card10.displayName,
              defender: card1.displayName,
              damage: 0,
              isCritical: false,
            },
            22: {
              kind: 'attack',
              attacker: card1.displayName,
              defender: card9.displayName,
              damage: 40,
              isCritical: false,
            },
            23: {
              kind: 'status_change',
              card: card9.displayName,
              status: 'dead',
            },
            24: {
              kind: 'attack',
              attacker: card10.displayName,
              defender: card1.displayName,
              damage: 0,
              isCritical: false,
            },
            25: {
              kind: 'attack',
              attacker: card1.displayName,
              defender: card10.displayName,
              damage: 30,
              isCritical: false,
            },
            26: {
              kind: 'attack',
              attacker: card10.displayName,
              defender: card1.displayName,
              damage: 0,
              isCritical: false,
            },
            27: {
              kind: 'attack',
              attacker: card1.displayName,
              defender: card10.displayName,
              damage: 30,
              isCritical: false,
            },
            28: {
              kind: 'attack',
              attacker: card10.displayName,
              defender: card1.displayName,
              damage: 0,
              isCritical: false,
            },
            29: {
              kind: 'attack',
              attacker: card1.displayName,
              defender: card10.displayName,
              damage: 30,
              isCritical: false,
            },
            30: {
              kind: 'status_change',
              card: card10.displayName,
              status: 'dead',
            },
            31: { kind: 'fight_end', winner: player1.name },
          });
        });
      });
    });
  });
});

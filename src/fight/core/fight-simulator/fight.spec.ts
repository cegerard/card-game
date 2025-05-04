import { Fight } from './fight';
import { Player } from '../player';
import { DamageReport } from './@types/damage-report';
import { FightResult } from './@types/fight-result';
import { PlayerByPlayerCardSelector } from './card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { CardStatePoisoned } from '../cards/@types/state/card-state-poisoned';

describe('fight', () => {
  describe('with a determined process', () => {
    describe('with only one card each', () => {
      describe('when the first player has the strongest card', () => {
        const card1 = createFightingCard({
          attack: 100,
          defense: 100,
          health: 100,
          speed: 100,
          criticalChance: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
          },
        });
        const card2 = createFightingCard({
          attack: 1,
          defense: 1,
          health: 1,
          speed: 1,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
          },
        });
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
              attacker: card1.identityInfo,
              damages: [
                {
                  defender: card2.identityInfo,
                  damage: 99,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
              energy: 10,
            },
            2: {
              kind: 'status_change',
              card: card2.identityInfo,
              status: 'dead',
            },
            3: { kind: 'fight_end', winner: player1.name },
          });
        });
      });

      describe('when the first player has the weakest card', () => {
        const card1 = createFightingCard({
          attack: 1,
          defense: 1,
          health: 1,
          speed: 1,
          agility: 0,
          criticalChance: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
          },
        });
        const card2 = createFightingCard({
          attack: 60,
          defense: 60,
          health: 60,
          speed: 60,
          criticalChance: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              damageRate: 0,
              energy: 10,
            },
          },
        });
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
              attacker: card2.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card1.identityInfo,
                  damage: 59,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            2: {
              kind: 'status_change',
              card: card1.identityInfo,
              status: 'dead',
            },
            3: { kind: 'fight_end', winner: player2.name },
          });
        });
      });

      describe('when the cards have the same strength, health and speed', () => {
        const damage = 50;
        const card1 = createFightingCard({
          attack: damage,
          defense: 20,
          health: 1,
          speed: 50,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              damageRate: 0,
              energy: 10,
            },
          },
        });
        const card2 = createFightingCard({
          attack: damage,
          defense: 25,
          health: 1,
          speed: 50,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              damageRate: 0,
              energy: 10,
            },
          },
        });
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
              attacker: card1.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card2.identityInfo,
                  damage: 25,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            2: {
              kind: 'attack',
              attacker: card2.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card1.identityInfo,
                  damage: 30,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            3: {
              kind: 'status_change',
              card: card2.identityInfo,
              status: 'dead',
            },
            4: {
              kind: 'status_change',
              card: card1.identityInfo,
              status: 'dead',
            },
            5: { kind: 'fight_end', winner: null },
          });
        });
      });

      describe('when the cards have the same strength and defense', () => {
        const damage = 50;
        const card1 = createFightingCard({
          attack: damage,
          defense: damage,
          health: 1,
          speed: 50,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
        const card2 = createFightingCard({
          attack: damage,
          defense: damage,
          health: 1,
          speed: 25,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
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
              if (attacker.deckIdentity === card1.identityInfo.deckIdentity) {
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
        const card1 = createFightingCard({
          attack: 100,
          defense: 100,
          health: 100,
          speed: 100,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
        const card2 = createFightingCard({
          attack: 1,
          defense: 1,
          health: 1,
          speed: 1,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
        const card3 = createFightingCard({
          attack: 5,
          defense: 5,
          health: 5,
          speed: 5,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
        const card4 = createFightingCard({
          attack: 10,
          defense: 10,
          health: 10,
          speed: 10,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
        const card5 = createFightingCard({
          attack: 20,
          defense: 20,
          health: 20,
          speed: 20,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
        const card6 = createFightingCard({
          attack: 30,
          defense: 30,
          health: 30,
          speed: 30,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
        const card7 = createFightingCard({
          attack: 40,
          defense: 40,
          health: 40,
          speed: 40,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
        const card8 = createFightingCard({
          attack: 50,
          defense: 50,
          health: 50,
          speed: 50,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
        const card9 = createFightingCard({
          attack: 60,
          defense: 60,
          health: 60,
          speed: 60,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
        const card10 = createFightingCard({
          attack: 70,
          defense: 70,
          health: 70,
          speed: 70,
          criticalChance: 0,
          agility: 0,
          skills: {
            simpleAttack: {
              damageRate: 1.0,
            },
            special: {
              kind: 'specialAttack',
              damageRate: 0,
              energy: 1000,
            },
          },
        });
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
              attacker: card1.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card6.identityInfo,
                  damage: 70,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            2: {
              kind: 'status_change',
              card: card6.identityInfo,
              status: 'dead',
            },
            3: {
              kind: 'attack',
              attacker: card10.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card5.identityInfo,
                  damage: 50,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            4: {
              kind: 'status_change',
              card: card5.identityInfo,
              status: 'dead',
            },
            5: {
              kind: 'attack',
              attacker: card4.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card9.identityInfo,
                  damage: 0,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 60,
                },
              ],
            },
            6: {
              kind: 'attack',
              attacker: card9.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card4.identityInfo,
                  damage: 50,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            7: {
              kind: 'status_change',
              card: card4.identityInfo,
              status: 'dead',
            },
            8: {
              kind: 'attack',
              attacker: card3.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card8.identityInfo,
                  damage: 0,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 50,
                },
              ],
            },
            9: {
              kind: 'attack',
              attacker: card8.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card3.identityInfo,
                  damage: 45,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            10: {
              kind: 'status_change',
              card: card3.identityInfo,
              status: 'dead',
            },
            11: {
              kind: 'attack',
              attacker: card2.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card7.identityInfo,
                  damage: 0,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 40,
                },
              ],
            },
            12: {
              kind: 'attack',
              attacker: card7.identityInfo,
              energy: 10,
              damages: [
                {
                  defender: card2.identityInfo,
                  damage: 39,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            13: {
              kind: 'status_change',
              card: card2.identityInfo,
              status: 'dead',
            },
            14: {
              kind: 'attack',
              attacker: card1.identityInfo,
              energy: 20,
              damages: [
                {
                  defender: card7.identityInfo,
                  damage: 60,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            15: {
              kind: 'status_change',
              card: card7.identityInfo,
              status: 'dead',
            },
            16: {
              kind: 'attack',
              attacker: card10.identityInfo,
              energy: 20,
              damages: [
                {
                  defender: card1.identityInfo,
                  damage: 0,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 100,
                },
              ],
            },
            17: {
              kind: 'attack',
              attacker: card1.identityInfo,
              energy: 30,
              damages: [
                {
                  defender: card8.identityInfo,
                  damage: 50,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            18: {
              kind: 'status_change',
              card: card8.identityInfo,
              status: 'dead',
            },
            19: {
              kind: 'attack',
              attacker: card9.identityInfo,
              energy: 20,
              damages: [
                {
                  defender: card1.identityInfo,
                  damage: 0,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 100,
                },
              ],
            },
            20: {
              kind: 'attack',
              attacker: card1.identityInfo,
              energy: 40,
              damages: [
                {
                  defender: card9.identityInfo,
                  damage: 40,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 20,
                },
              ],
            },
            21: {
              kind: 'attack',
              attacker: card10.identityInfo,
              energy: 30,
              damages: [
                {
                  defender: card1.identityInfo,
                  damage: 0,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 100,
                },
              ],
            },
            22: {
              kind: 'attack',
              attacker: card1.identityInfo,
              energy: 50,
              damages: [
                {
                  defender: card9.identityInfo,
                  damage: 40,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            23: {
              kind: 'status_change',
              card: card9.identityInfo,
              status: 'dead',
            },
            24: {
              kind: 'attack',
              attacker: card10.identityInfo,
              energy: 40,
              damages: [
                {
                  defender: card1.identityInfo,
                  damage: 0,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 100,
                },
              ],
            },
            25: {
              kind: 'attack',
              attacker: card1.identityInfo,
              energy: 60,
              damages: [
                {
                  defender: card10.identityInfo,
                  damage: 30,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 40,
                },
              ],
            },
            26: {
              kind: 'attack',
              attacker: card10.identityInfo,
              energy: 50,
              damages: [
                {
                  defender: card1.identityInfo,
                  damage: 0,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 100,
                },
              ],
            },
            27: {
              kind: 'attack',
              attacker: card1.identityInfo,
              energy: 70,
              damages: [
                {
                  defender: card10.identityInfo,
                  damage: 30,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 10,
                },
              ],
            },
            28: {
              kind: 'attack',
              attacker: card10.identityInfo,
              energy: 60,
              damages: [
                {
                  defender: card1.identityInfo,
                  damage: 0,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 100,
                },
              ],
            },
            29: {
              kind: 'attack',
              attacker: card1.identityInfo,
              energy: 80,
              damages: [
                {
                  defender: card10.identityInfo,
                  damage: 30,
                  isCritical: false,
                  dodge: false,
                  remainingHealth: 0,
                },
              ],
            },
            30: {
              kind: 'status_change',
              card: card10.identityInfo,
              status: 'dead',
            },
            31: { kind: 'fight_end', winner: player1.name },
          });
        });
      });
    });
  });

  describe('Trigger card skill at turn end', () => {
    const card1 = createFightingCard({
      attack: 100,
      defense: 100,
      health: 100,
      speed: 100,
      criticalChance: 0,
      skills: {
        simpleAttack: {
          damageRate: 1.0,
        },
        others: [
          {
            effectRate: 0,
            trigger: 'turn-end',
            targetingStrategy: 'self',
          },
        ],
      },
    });
    const card2 = createFightingCard({
      attack: 1,
      defense: 1,
      health: 1,
      speed: 1,
      criticalChance: 0,
      agility: 0,
      skills: {
        simpleAttack: {
          damageRate: 1.0,
        },
      },
    });
    const player1 = new Player('Player 1', [card1]);
    const player2 = new Player('Player 2', [card2]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    it('should return skill step', () => {
      expect(fight.start()).toEqual({
        1: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 99,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        2: {
          card: card2.identityInfo,
          kind: 'status_change',
          status: 'dead',
        },
        3: {
          kind: 'healing',
          source: card1.identityInfo,
          heal: [
            {
              target: card1.identityInfo,
              healed: 0,
              remainingHealth: 100,
            },
          ],
          energy: 10,
        },
        4: {
          kind: 'fight_end',
          winner: 'Player 1',
        },
      });
    });
  });

  describe('Trigger card skill at turn end from opponent', () => {
    const card1 = createFightingCard({
      attack: 100,
      defense: 100,
      health: 100,
      speed: 1,
      criticalChance: 0,
      agility: 0,
      skills: {
        simpleAttack: {
          damageRate: 1.0,
        },
      },
    });
    const card2 = createFightingCard({
      attack: 1,
      defense: 1,
      health: 1,
      speed: 2,
      criticalChance: 0,
      agility: 0,
      skills: {
        simpleAttack: {
          damageRate: 1.0,
        },
        others: [
          {
            effectRate: 0,
            trigger: 'turn-end',
            targetingStrategy: 'all-owner-cards',
          },
        ],
      },
    });
    const player1 = new Player('Player 1', [card1]);
    const player2 = new Player('Player 2', [card2]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    it('should return skill step', () => {
      const res = fight.start();
      expect(res).toEqual({
        1: {
          attacker: card2.identityInfo,
          damages: [
            {
              damage: 0,
              defender: card1.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 100,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        2: {
          kind: 'healing',
          source: card2.identityInfo,
          heal: [
            {
              target: card2.identityInfo,
              healed: 0,
              remainingHealth: 1,
            },
          ],
          energy: 10,
        },
        3: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 99,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        4: {
          card: card2.identityInfo,
          kind: 'status_change',
          status: 'dead',
        },
        5: {
          kind: 'fight_end',
          winner: 'Player 1',
        },
      });
    });
  });

  describe('Trigger card attack with poison effect', () => {
    const card1 = createFightingCard({
      attack: 100,
      defense: 100,
      health: 100,
      speed: 100,
      criticalChance: 0,
      agility: 0,
      skills: {
        simpleAttack: {
          damageRate: 1.0,
          effect: {
            type: 'poison',
            rate: 0.5,
            level: 2,
          },
        },
      },
    });

    const card2 = createFightingCard({
      attack: 1,
      defense: 0,
      health: 150,
      speed: 1,
      criticalChance: 0,
      agility: 0,
      skills: {
        simpleAttack: {
          damageRate: 1.0,
        },
      },
    });

    const player1 = new Player('Player 1', [card1]);
    const player2 = new Player('Player 2', [card2]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    it('should return skill step', () => {
      expect(fight.start()).toEqual({
        1: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 100,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 50,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        2: {
          kind: 'status_change',
          status: 'poisoned',
          card: card2.identityInfo,
        },
        3: {
          attacker: card2.identityInfo,
          damages: [
            {
              damage: 0,
              defender: card1.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 100,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        4: {
          kind: 'state_effect',
          type: 'poison',
          card: card2.identityInfo,
          remainingTurns: 2,
          damage: 50,
          remainingHealth: 0,
        },
        5: {
          card: card2.identityInfo,
          kind: 'status_change',
          status: 'dead',
        },
        6: {
          kind: 'fight_end',
          winner: 'Player 1',
        },
      });
    });
  });

  describe('Trigger card special attack with poison effect', () => {
    const card1 = createFightingCard({
      attack: 100,
      defense: 100,
      health: 100,
      speed: 100,
      criticalChance: 0,
      agility: 0,
      skills: {
        special: {
          kind: 'specialAttack',
          damageRate: 1.0,
          energy: 0,
          effect: {
            type: 'poison',
            rate: 0.5,
            level: 2,
          },
        },
      },
    });

    const card2 = createFightingCard({
      attack: 0,
      defense: 0,
      health: 150,
      speed: 1,
      criticalChance: 0,
      agility: 0,
    });

    const player1 = new Player('Player 1', [card1]);
    const player2 = new Player('Player 2', [card2]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    it('should return skill step', () => {
      expect(fight.start()).toEqual({
        1: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 100,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 50,
            },
          ],
          energy: 0,
          kind: 'special_attack',
        },
        2: {
          kind: 'status_change',
          status: 'poisoned',
          card: card2.identityInfo,
        },
        3: {
          attacker: card2.identityInfo,
          damages: [
            {
              damage: 0,
              defender: card1.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 100,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        4: {
          kind: 'state_effect',
          type: 'poison',
          card: card2.identityInfo,
          remainingTurns: 2,
          damage: 50,
          remainingHealth: 0,
        },
        5: {
          card: card2.identityInfo,
          kind: 'status_change',
          status: 'dead',
        },
        6: {
          kind: 'fight_end',
          winner: 'Player 1',
        },
      });
    });
  });
  describe('Process card state effect at turn end', () => {
    const card1 = createFightingCard({
      attack: 100,
      health: 100,
      speed: 100,
      criticalChance: 0,
      skills: {
        simpleAttack: {
          damageRate: 1.0,
        },
      },
    });
    card1.setState(new CardStatePoisoned(1, 30));

    const card2 = createFightingCard({
      defense: 0,
      health: 1,
      speed: 1,
      agility: 0,
    });

    const player1 = new Player('Player 1', [card1]);
    const player2 = new Player('Player 2', [card2]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    it('should return skill step', () => {
      expect(fight.start()).toEqual({
        1: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 100,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        2: {
          card: card2.identityInfo,
          kind: 'status_change',
          status: 'dead',
        },
        3: {
          kind: 'state_effect',
          type: 'poison',
          card: card1.identityInfo,
          remainingTurns: 0,
          damage: 30,
          remainingHealth: 70,
        },
        4: {
          kind: 'fight_end',
          winner: 'Player 1',
        },
      });
    });
  });
});

import { Fight } from '../fight-simulator/fight';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';

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
    const player1 = new Player('Player 1', [card1, card2, card3, card4, card5]); // Pass name
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

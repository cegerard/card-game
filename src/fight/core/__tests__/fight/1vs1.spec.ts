import { Fight } from '../../fight-simulator/fight';
import { Player } from '../../player';
import { DamageReport } from '../../fight-simulator/@types/damage-report';
import { FightResult } from '../../fight-simulator/@types/fight-result';
import { PlayerByPlayerCardSelector } from '../../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

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

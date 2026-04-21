import { Fight } from '../fight-simulator/fight';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';

describe('Trigger an attack without effect', () => {
  const attackerAccuracy = 40;

  let attacker: FightingCard;
  let player1: Player;

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 10,
      defense: 0,
      health: 10,
      criticalChance: 0,
      speed: 100,
      accuracy: attackerAccuracy,
      agility: 0,
      skills: {
        simpleAttack: {
          damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
        },
      },
    });
    player1 = new Player('player1', [attacker]);
  });

  describe('and the attack is not dodge', () => {
    let defenderWithoutDodge: FightingCard;
    let player2: Player;

    let fight: Fight;

    beforeEach(() => {
      defenderWithoutDodge = createFightingCard({
        defense: 0,
        health: 10,
        speed: 1,
        agility: attackerAccuracy,
      });
      player2 = new Player('player2', [defenderWithoutDodge]);

      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('kill the other card', () => {
      expect(fight.start()).toMatchObject({
        1: {
          attacker: attacker.identityInfo,
          damages: [
            {
              damage: 10,
              defender: defenderWithoutDodge.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        2: {
          card: defenderWithoutDodge.identityInfo,
          kind: 'status_change',
          status: 'dead',
        },
        3: {
          kind: 'fight_end',
          winner: 'player1',
        },
      });
    });
  });

  describe('and the attack is dodge', () => {
    let defenderWithDodge: FightingCard;

    let player2: Player;

    let fight: Fight;

    beforeEach(() => {
      defenderWithDodge = createFightingCard({
        attack: 10,
        defense: 0,
        health: 10,
        criticalChance: 0,
        speed: 1,
        accuracy: attackerAccuracy,
        agility: attackerAccuracy + 1,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
          },
        },
      });

      player2 = new Player('player2', [defenderWithDodge]);

      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('be killed by the opponent', () => {
      expect(fight.start()).toMatchObject({
        1: {
          attacker: attacker.identityInfo,
          damages: [
            {
              damage: 0,
              defender: defenderWithDodge.identityInfo,
              dodge: true,
              isCritical: false,
              remainingHealth: 10,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        2: {
          attacker: defenderWithDodge.identityInfo,
          damages: [
            {
              damage: 10,
              defender: attacker.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        3: {
          card: attacker.identityInfo,
          kind: 'status_change',
          status: 'dead',
        },
        4: {
          kind: 'fight_end',
          winner: 'player2',
        },
      });
    });
  });
});

describe('Trigger an attack with critical hit', () => {
  let attacker: FightingCard;
  let defender: FightingCard;
  let player1: Player;
  let player2: Player;
  let fight: Fight;

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      criticalChance: 100,
      speed: 100,
      agility: 0,
      skills: {
        simpleAttack: {
          damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
        },
      },
    });
    defender = createFightingCard({
      attack: 0,
      defense: 0,
      health: 100,
      speed: 0,
      criticalChance: 0,
      agility: 0,
      skills: {
        simpleAttack: {
          damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
        },
      },
    });
    player1 = new Player('Player 1', [attacker]);
    player2 = new Player('Player 2', [defender]);
    fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );
  });

  it('deal critical damage to the defender', () => {
    expect(fight.start()).toMatchObject({
      1: {
        attacker: attacker.identityInfo,
        damages: [
          {
            damage: 200,
            defender: defender.identityInfo,
            dodge: false,
            isCritical: true,
            remainingHealth: 0,
          },
        ],
        energy: 10,
        kind: 'attack',
      },
      2: {
        card: defender.identityInfo,
        kind: 'status_change',
        status: 'dead',
      },
      3: {
        kind: 'fight_end',
        winner: 'Player 1',
      },
    });
  });
});

import { Fight } from '../../fight-simulator/fight';
import { Player } from '../../player';
import { PlayerByPlayerCardSelector } from '../../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { CardStatePoisoned } from '../../cards/@types/state/card-state-poisoned';
import { FightingCard } from '../../cards/fighting-card';
import { CardStateBurned } from '../../cards/@types/state/card-state-burned';

describe('Trigger an attack without effect', () => {
  const attackerAccuracy = 40;

  describe('and the attack is not dodge', () => {
    const attacker = createFightingCard({
      attack: 10,
      defense: 0,
      health: 10,
      criticalChance: 0,
      speed: 100,
      accuracy: attackerAccuracy,
      agility: 0,
      skills: { simpleAttack: { damageRate: 1.0 } },
    });

    const defenderWithoutDodge = createFightingCard({
      defense: 0,
      health: 10,
      speed: 1,
      agility: attackerAccuracy,
    });

    const player1 = new Player('player1', [attacker]);
    const player2 = new Player('player2', [defenderWithoutDodge]);

    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    it('should kill the other card', () => {
      expect(fight.start()).toEqual({
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
    const attacker = createFightingCard({
      attack: 10,
      defense: 0,
      health: 10,
      criticalChance: 0,
      speed: 100,
      accuracy: attackerAccuracy,
      agility: 0,
      skills: { simpleAttack: { damageRate: 1.0 } },
    });

    const defenderWithDodge = createFightingCard({
      attack: 10,
      defense: 0,
      health: 10,
      criticalChance: 0,
      speed: 1,
      accuracy: attackerAccuracy,
      agility: attackerAccuracy + 1,
      skills: { simpleAttack: { damageRate: 1.0 } },
    });

    const player1 = new Player('player1', [attacker]);
    const player2 = new Player('player2', [defenderWithDodge]);

    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    it('should be killed by the opponent', () => {
      expect(fight.start()).toEqual({
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

describe('Trigger card attack with poison effect', () => {
  let card1: FightingCard;
  let firstPlayer: Player;

  beforeEach(() => {
    card1 = createFightingCard({
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
    firstPlayer = new Player('Player 1', [card1]);
  });

  describe('and the defender is not poisoned yet', () => {
    let card2: FightingCard;
    let player2: Player;
    let fight: Fight;

    beforeEach(() => {
      card2 = createFightingCard({
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
      player2 = new Player('Player 2', [card2]);

      fight = new Fight(
        firstPlayer,
        player2,
        new PlayerByPlayerCardSelector(firstPlayer, player2),
      );
    });

    it('should return poisoned attack effect steps', () => {
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

  describe('and the defender is already poisoned', () => {
    let card2: FightingCard;
    let player2: Player;
    let fight: Fight;

    beforeEach(() => {
      card2 = createFightingCard({
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
      player2 = new Player('Player 2', [card2]);

      fight = new Fight(
        firstPlayer,
        player2,
        new PlayerByPlayerCardSelector(firstPlayer, player2),
      );
      card2.setState(new CardStatePoisoned(1, 150));
    });

    it('should not change the poison state', () => {
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
        3: {
          kind: 'state_effect',
          type: 'poison',
          card: card2.identityInfo,
          remainingTurns: 0,
          damage: 150,
          remainingHealth: 0,
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

  describe('and the defender is already burned', () => {
    let card2: FightingCard;
    let player2: Player;
    let fight: Fight;

    beforeEach(() => {
      card2 = createFightingCard({
        attack: 1,
        defense: 0,
        health: 160,
        speed: 1,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: {
            damageRate: 1.0,
          },
        },
      });
      player2 = new Player('Player 2', [card2]);

      card2.setState(new CardStateBurned(1, 10));

      fight = new Fight(
        firstPlayer,
        player2,
        new PlayerByPlayerCardSelector(firstPlayer, player2),
      );
    });

    it('should add poison effect while keeping burn effect', () => {
      expect(fight.start()).toEqual({
        1: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 100,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 60,
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
          remainingHealth: 10,
        },
        5: {
          kind: 'state_effect',
          type: 'burn',
          card: card2.identityInfo,
          remainingTurns: 0,
          damage: 10,
          remainingHealth: 0,
        },
        6: {
          card: card2.identityInfo,
          kind: 'status_change',
          status: 'dead',
        },
        7: {
          kind: 'fight_end',
          winner: 'Player 1',
        },
      });
    });
  });
});

describe('Trigger card attack with burn effect', () => {
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
          type: 'burn',
          rate: 0.5,
          level: 3,
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
  });

  const player1 = new Player('Player 1', [card1]);
  const player2 = new Player('Player 2', [card2]);
  const fight = new Fight(
    player1,
    player2,
    new PlayerByPlayerCardSelector(player1, player2),
  );

  it('should return attack effect step', () => {
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
        status: 'burned',
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
        type: 'burn',
        card: card2.identityInfo,
        remainingTurns: 4,
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

describe('Trigger card attack with freeze effect', () => {
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
          type: 'freeze',
          rate: 0.2,
          level: 2,
        },
      },
    },
  });

  const card2 = createFightingCard({
    attack: 1,
    defense: 0,
    health: 220,
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

  it('should return attack effect step', () => {
    expect(fight.start()).toEqual({
      1: {
        attacker: card1.identityInfo,
        damages: [
          {
            damage: 100,
            defender: card2.identityInfo,
            dodge: false,
            isCritical: false,
            remainingHealth: 120,
          },
        ],
        energy: 10,
        kind: 'attack',
      },
      2: {
        kind: 'status_change',
        status: 'frozen',
        card: card2.identityInfo,
      },
      3: {
        kind: 'state_effect',
        type: 'freeze',
        card: card2.identityInfo,
        remainingTurns: 2,
        damage: 0,
        remainingHealth: 120,
      },
      4: {
        attacker: card1.identityInfo,
        damages: [
          {
            damage: 120,
            defender: card2.identityInfo,
            dodge: false,
            isCritical: false,
            remainingHealth: 0,
          },
        ],
        energy: 20,
        kind: 'attack',
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

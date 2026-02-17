import { Fight } from '../fight-simulator/fight';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { CardStatePoisoned } from '../cards/@types/state/card-state-poisoned';
import { FightingCard } from '../cards/fighting-card';
import { CardStateBurned } from '../cards/@types/state/card-state-burned';
import { CardStateFrozen } from '../cards/@types/state/card-state-frozen';

describe('Add Poison effect level 1', () => {
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
            level: 1,
          },
        },
      },
    });
    firstPlayer = new Player('Player 1', [card1]);
  });

  describe('and the target is already poisoned', () => {
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
      card2.setState(new CardStatePoisoned(1, 1, 150));
    });

    it('does not change the poison state', () => {
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

  describe('and the target is already burned', () => {
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

      card2.setState(new CardStateBurned(1, 1, 10));

      fight = new Fight(
        firstPlayer,
        player2,
        new PlayerByPlayerCardSelector(firstPlayer, player2),
      );
    });

    it('adds poison effect while keeping burn effect', () => {
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
          remainingTurns: 0,
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

  describe('and the defender is already frozen', () => {
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

      card2.setState(new CardStateFrozen(1, 2, 0.5));

      fight = new Fight(
        firstPlayer,
        player2,
        new PlayerByPlayerCardSelector(firstPlayer, player2),
      );
    });

    it('does not add the poison effect', () => {
      expect(fight.start()).toEqual({
        1: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 150,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 10,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        2: {
          kind: 'state_effect',
          type: 'freeze',
          card: card2.identityInfo,
          remainingTurns: 1,
          damage: 0,
          remainingHealth: 10,
        },
        3: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 150,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 20,
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
});

describe('Add Poison effect level 2', () => {
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

  describe('and the target is already poisoned with level 1', () => {
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
      card2.setState(new CardStatePoisoned(1, 1, 150));
    });

    it('replaces the poison state with the new one', () => {
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
  describe('and the target is already burned', () => {
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

      card2.setState(new CardStateBurned(1, 1, 10));

      fight = new Fight(
        firstPlayer,
        player2,
        new PlayerByPlayerCardSelector(firstPlayer, player2),
      );
    });

    it('adds poison effect while keeping burn effect', () => {
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
  describe('and the defender is already frozen', () => {
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

      card2.setState(new CardStateFrozen(1, 2, 0.5));

      fight = new Fight(
        firstPlayer,
        player2,
        new PlayerByPlayerCardSelector(firstPlayer, player2),
      );
    });

    it('does not add the poison effect', () => {
      expect(fight.start()).toEqual({
        1: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 150,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 10,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        2: {
          kind: 'state_effect',
          type: 'freeze',
          card: card2.identityInfo,
          remainingTurns: 1,
          damage: 0,
          remainingHealth: 10,
        },
        3: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 150,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 20,
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
});

describe('Add Poison effect level 3', () => {
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
            level: 3,
          },
        },
      },
    });
    firstPlayer = new Player('Player 1', [card1]);
  });

  describe('and the target is already poisoned with level 1', () => {
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
      card2.setState(new CardStatePoisoned(1, 1, 150));
    });

    it('replaces the poison state with the new one', () => {
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

  describe('and the target is already poisoned with level 2', () => {
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
      card2.setState(new CardStatePoisoned(2, 3, 150));
    });

    it('replaces the poison state with the new one', () => {
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

  describe('and the target is already burned', () => {
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

      card2.setState(new CardStateBurned(1, 1, 10));

      fight = new Fight(
        firstPlayer,
        player2,
        new PlayerByPlayerCardSelector(firstPlayer, player2),
      );
    });

    it('adds poison effect while keeping burn effect', () => {
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
          remainingTurns: 4,
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
  describe('and the defender is already frozen', () => {
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

      card2.setState(new CardStateFrozen(1, 2, 0.5));

      fight = new Fight(
        firstPlayer,
        player2,
        new PlayerByPlayerCardSelector(firstPlayer, player2),
      );
    });

    it('does not add the poison effect', () => {
      expect(fight.start()).toEqual({
        1: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 150,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 10,
            },
          ],
          energy: 10,
          kind: 'attack',
        },
        2: {
          kind: 'state_effect',
          type: 'freeze',
          card: card2.identityInfo,
          remainingTurns: 1,
          damage: 0,
          remainingHealth: 10,
        },
        3: {
          attacker: card1.identityInfo,
          damages: [
            {
              damage: 150,
              defender: card2.identityInfo,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 20,
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
});

describe('Trigger card attack after poison dissipation', () => {
  let card1: FightingCard;
  let card2: FightingCard;
  let player1: Player;
  let player2: Player;
  let fight: Fight;

  beforeEach(() => {
    card1 = createFightingCard({
      attack: 50,
      defense: 100,
      health: 100,
      speed: 100,
      criticalChance: 0,
      agility: 0,
      skills: {
        simpleAttack: {
          damageRate: 1.0,
        },
      },
    });
    card2 = createFightingCard({
      attack: 1,
      defense: 0,
      health: 100,
      speed: 1,
      criticalChance: 0,
      agility: 0,
    });

    player1 = new Player('Player 1', [card1]);
    player2 = new Player('Player 2', [card2]);

    card1.setState(new CardStatePoisoned(1, 1, 10));

    fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );
  });

  it('kill the opponent', () => {
    expect(fight.start()).toEqual({
      1: {
        attacker: card1.identityInfo,
        damages: [
          {
            damage: 50,
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
        kind: 'state_effect',
        type: 'poison',
        card: card1.identityInfo,
        remainingTurns: 0,
        damage: 10,
        remainingHealth: 90,
      },
      3: {
        attacker: card2.identityInfo,
        damages: [
          {
            damage: 0,
            defender: card1.identityInfo,
            dodge: false,
            isCritical: false,
            remainingHealth: 90,
          },
        ],
        energy: 10,
        kind: 'attack',
      },
      4: {
        attacker: card1.identityInfo,
        damages: [
          {
            damage: 50,
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

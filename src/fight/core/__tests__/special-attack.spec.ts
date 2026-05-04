import { Fight } from '../fight-simulator/fight';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';

describe('Trigger card special attack without effect', () => {
  const attackerAccuracy = 25;
  const attacker = createFightingCard({
    attack: 10,
    criticalChance: 0,
    health: 5,
    accuracy: attackerAccuracy,
    agility: 0,
    speed: 100,
    defense: 0,
    skills: {
      special: {
        damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
        energy: 0,
        kind: 'specialAttack',
      },
    },
  });
  const player1 = new Player('Player 1', [attacker]);

  describe('and the attack is not dodge', () => {
    const defenderWithoutDodge = createFightingCard({
      defense: 0,
      health: 10,
      speed: 0,
      agility: attackerAccuracy,
    });
    const player2 = new Player('Player 2', [defenderWithoutDodge]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    it('compute the damage with the special attack', () => {
      expect(fight.start()).toMatchObject({
        1: {
          attacker: attacker.identityInfo,
          damages: [
            {
              damage: 10,
              isCritical: false,
              dodge: false,
              defender: defenderWithoutDodge.identityInfo,
              remainingHealth: defenderWithoutDodge.actualHealth,
            },
          ],
          energy: 0,
          kind: 'special_attack',
        },
        2: {
          card: defenderWithoutDodge.identityInfo,
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

  describe('and the attack is dodge', () => {
    const defenderWithDodge = createFightingCard({
      attack: 10,
      defense: 0,
      speed: 0,
      criticalChance: 0,
      agility: attackerAccuracy + 1,
      skills: {
        special: {
          damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
          energy: 0,
          kind: 'specialAttack',
        },
      },
    });
    const player2 = new Player('Player 2', [defenderWithDodge]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    it('not deal any damage', () => {
      expect(fight.start()).toMatchObject({
        1: {
          attacker: attacker.identityInfo,
          damages: [
            {
              damage: 0,
              isCritical: false,
              dodge: true,
              defender: defenderWithDodge.identityInfo,
              remainingHealth: defenderWithDodge.actualHealth,
            },
          ],
          energy: 0,
          kind: 'special_attack',
        },
        2: {
          attacker: defenderWithDodge.identityInfo,
          damages: [
            {
              damage: 10,
              isCritical: false,
              dodge: false,
              defender: attacker.identityInfo,
              remainingHealth: 0,
            },
          ],
          energy: 0,
          kind: 'special_attack',
        },
        3: {
          card: attacker.identityInfo,
          kind: 'status_change',
          status: 'dead',
        },
        4: {
          kind: 'fight_end',
          winner: 'Player 2',
        },
      });
    });
  });
});

describe('Trigger card special attack with critical hit', () => {
  const attackerAccuracy = 25;
  const attacker = createFightingCard({
    attack: 10,
    criticalChance: 100,
    health: 5,
    accuracy: attackerAccuracy,
    agility: 0,
    speed: 100,
    defense: 0,
    skills: {
      special: {
        damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
        energy: 0,
        kind: 'specialAttack',
      },
    },
  });
  const player1 = new Player('Player 1', [attacker]);

  const defenderWithoutDodge = createFightingCard({
    defense: 0,
    health: 13,
    speed: 0,
    agility: attackerAccuracy,
  });
  const player2 = new Player('Player 2', [defenderWithoutDodge]);
  const fight = new Fight(
    player1,
    player2,
    new PlayerByPlayerCardSelector(player1, player2),
  );

  it('compute the damage with the special attack', () => {
    expect(fight.start()).toMatchObject({
      1: {
        attacker: attacker.identityInfo,
        damages: [
          {
            damage: 13,
            isCritical: true,
            dodge: false,
            defender: defenderWithoutDodge.identityInfo,
            remainingHealth: defenderWithoutDodge.actualHealth,
          },
        ],
        energy: 0,
        kind: 'special_attack',
      },
      2: {
        card: defenderWithoutDodge.identityInfo,
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
        damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
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

  const player1 = new Player('Player 1', [card2]);
  const player2 = new Player('Player 2', [card1]);
  const fight = new Fight(
    player1,
    player2,
    new PlayerByPlayerCardSelector(player1, player2),
  );

  it('return the special attack effect step', () => {
    expect(fight.start()).toMatchObject({
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
        status: 'poison',
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
        winner: 'Player 2',
      },
    });
  });
});

describe('Trigger card special attack with buff', () => {
  let attacker: ReturnType<typeof createFightingCard>;
  let defender: ReturnType<typeof createFightingCard>;
  let result: ReturnType<Fight['start']>;

  beforeEach(() => {
    defender = createFightingCard({
      attack: 100,
      defense: 0,
      health: 50,
      speed: 1,
      criticalChance: 0,
      agility: 25,
    });

    attacker = createFightingCard({
      attack: 50,
      defense: 0,
      health: 100,
      speed: 100,
      criticalChance: 0,
      accuracy: 25,
      agility: 25,
      skills: {
        special: {
          kind: 'specialAttack',
          damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
          energy: 100,
          targetingStrategy: 'target-all',
          buffs: [
            {
              buffType: 'attack',
              buffRate: 0.2,
              buffDuration: 3,
              buffTargetingStrategy: 'all-owner-cards',
            },
          ],
        },
      },
    });

    for (let i = 0; i < 10; i++) {
      attacker.increaseSpecialEnergy();
    }

    const player1 = new Player('Player 1', [attacker]);
    const player2 = new Player('Player 2', [defender]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    result = fight.start();
  });

  it('applies special_attack as first action', () => {
    expect(result[1]).toMatchObject({
      attacker: attacker.identityInfo,
      damages: [
        {
          damage: 50,
          defender: defender.identityInfo,
          dodge: false,
          isCritical: false,
          remainingHealth: 0,
        },
      ],
      energy: 0,
      kind: 'special_attack',
    });
  });

  it('applies buff as second step', () => {
    expect(result[2]).toMatchObject({
      kind: 'buff',
      source: attacker.identityInfo,
      buffs: [
        {
          target: attacker.identityInfo,
          kind: 'attack',
          value: 10,
          remainingTurns: 3,
        },
      ],
      energy: 0,
    });
  });

  it('marks defender as dead', () => {
    expect(result[3]).toMatchObject({
      card: defender.identityInfo,
      kind: 'status_change',
      status: 'dead',
    });
  });

  it('ends fight with Player 1 winning', () => {
    expect(result[4]).toMatchObject({
      kind: 'fight_end',
      winner: 'Player 1',
    });
  });
});

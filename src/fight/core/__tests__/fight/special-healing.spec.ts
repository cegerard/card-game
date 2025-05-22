import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { Fight } from '../../fight-simulator/fight';
import { PlayerByPlayerCardSelector } from '../../fight-simulator/card-selectors/player-by-player';

describe('Trigger card special healing', () => {
  let healer: FightingCard;
  let player1: Player;

  beforeEach(() => {
    healer = createFightingCard({
      attack: 100,
      defense: 0,
      health: 200,
      agility: 0,
      speed: 1,
      skills: {
        special: { kind: 'specialHealing', damageRate: 2.5, energy: 0 },
      },
    });
    player1 = new Player('player1', [healer]);
  });

  describe('and the target is not full health', () => {
    let target: FightingCard;
    let player2: Player;
    let fight: Fight;

    beforeEach(() => {
      target = createFightingCard({
        health: 500,
        defense: 0,
        accuracy: 1,
        speed: 0,
        attack: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: { damageRate: 2.0 },
        },
      });
      player2 = new Player('player2', [target]);

      target.collectsDamages(400);

      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('heals the target', () => {
      expect(fight.start()).toEqual({
        1: {
          kind: 'healing',
          source: healer.identityInfo,
          heal: [
            {
              target: target.identityInfo,
              healed: 250,
              remainingHealth: 350,
            },
          ],
          energy: 0,
        },
        2: {
          kind: 'attack',
          attacker: target.identityInfo,
          damages: [
            {
              defender: healer.identityInfo,
              damage: 200,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 10,
        },
        3: {
          card: healer.identityInfo,
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

  describe('and the target is full health', () => {
    let target: FightingCard;
    let player2: Player;
    let fight: Fight;

    beforeEach(() => {
      target = createFightingCard({
        health: 500,
        defense: 0,
        accuracy: 1,
        speed: 0,
        attack: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: { damageRate: 2.0 },
        },
      });
      player2 = new Player('player2', [target]);

      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('does not add health to the target', () => {
      expect(fight.start()).toEqual({
        1: {
          kind: 'healing',
          source: healer.identityInfo,
          heal: [
            {
              target: target.identityInfo,
              healed: 0,
              remainingHealth: 500,
            },
          ],
          energy: 0,
        },
        2: {
          kind: 'attack',
          attacker: target.identityInfo,
          damages: [
            {
              defender: healer.identityInfo,
              damage: 200,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 10,
        },
        3: {
          card: healer.identityInfo,
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

  describe('and the heal is more than the card max health', () => {
    let target: FightingCard;
    let player2: Player;
    let fight: Fight;

    beforeEach(() => {
      target = createFightingCard({
        health: 500,
        defense: 0,
        accuracy: 1,
        speed: 0,
        attack: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: { damageRate: 2.0 },
        },
      });
      player2 = new Player('player2', [target]);

      target.collectsDamages(100);

      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('heals the target', () => {
      expect(fight.start()).toEqual({
        1: {
          kind: 'healing',
          source: healer.identityInfo,
          heal: [
            {
              target: target.identityInfo,
              healed: 100,
              remainingHealth: 500,
            },
          ],
          energy: 0,
        },
        2: {
          kind: 'attack',
          attacker: target.identityInfo,
          damages: [
            {
              defender: healer.identityInfo,
              damage: 200,
              dodge: false,
              isCritical: false,
              remainingHealth: 0,
            },
          ],
          energy: 10,
        },
        3: {
          card: healer.identityInfo,
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

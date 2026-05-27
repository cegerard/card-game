import { Fight } from '../fight-simulator/fight';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';
describe('Trigger-healing-skill', () => {
  let card1: FightingCard;
  let player1: Player;
  let card2: FightingCard;
  let player2: Player;
  let fight: Fight;

  beforeEach(() => {
    card1 = createFightingCard({
      attack: 100,
      defense: 100,
      health: 100,
      speed: 100,
      criticalChance: 0,
      skills: {
        simpleAttack: {
          damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
        },
        others: [
          {
            effectRate: 0.2,
            trigger: 'turn-end',
            targetingStrategy: 'self',
          },
        ],
      },
    });
    card2 = createFightingCard({
      attack: 1,
      defense: 1,
      health: 1,
      speed: 1,
      criticalChance: 0,
      agility: 0,
      skills: {
        simpleAttack: {
          damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
        },
      },
    });

    player1 = new Player('Player 1', [card1]);
    player2 = new Player('Player 2', [card2]);

    fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );
  });
  describe('and the card is full health', () => {
    let card2: FightingCard;
    let player2: Player;
    let fight: Fight;

    beforeEach(() => {
      card2 = createFightingCard({
        attack: 1,
        defense: 1,
        health: 1,
        speed: 1,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
          },
        },
      });
      player2 = new Player('Player 2', [card2]);
      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('not heal the target', () => {
      expect(fight.start()).toMatchObject({
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

  describe('and the card is not full health', () => {
    beforeEach(() => {
      card1.applyFinalDamage(50);
    });

    it('heal as much as he can', () => {
      expect(fight.start()).toMatchObject({
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
              healed: 20,
              remainingHealth: 70,
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

  describe('and the healing is more than the card max health', () => {
    beforeEach(() => {
      card1.applyFinalDamage(10);
    });

    it('heal to the max health', () => {
      expect(fight.start()).toMatchObject({
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
              healed: 10,
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
});

import { Fight } from '../../fight-simulator/fight';
import { Player } from '../../player';
import { PlayerByPlayerCardSelector } from '../../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
describe('Trigger-healing-skill', () => {
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

  it('should return the healing skill step', () => {
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

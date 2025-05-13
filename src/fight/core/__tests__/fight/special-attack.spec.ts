import { Fight } from '../../fight-simulator/fight';
import { Player } from '../../player';
import { PlayerByPlayerCardSelector } from '../../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

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

  it('should return the special attack effect step', () => {
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

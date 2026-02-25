import { Fight } from '../fight-simulator/fight';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { CardStatePoisoned } from '../cards/@types/state/card-state-poisoned';

describe('Process card poisoned effect at turn end', () => {
  const card1 = createFightingCard({
    attack: 100,
    health: 100,
    speed: 100,
    criticalChance: 0,
    skills: {
      simpleAttack: {
        damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
      },
    },
  });
  card1.setState(new CardStatePoisoned(1, 1, 30));

  const card2 = createFightingCard({
    defense: 0,
    health: 1,
    speed: 1,
    agility: 0,
  });

  const player1 = new Player('Player 1', [card1]);
  const player2 = new Player('Player 2', [card2]);
  const fight = new Fight(
    player1,
    player2,
    new PlayerByPlayerCardSelector(player1, player2),
  );

  it('return the poisoned effect step', () => {
    expect(fight.start()).toEqual({
      1: {
        attacker: card1.identityInfo,
        damages: [
          {
            damage: 100,
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
        kind: 'state_effect',
        type: 'poison',
        card: card1.identityInfo,
        remainingTurns: 0,
        damage: 30,
        remainingHealth: 70,
      },
      4: {
        kind: 'fight_end',
        winner: 'Player 1',
      },
    });
  });
});

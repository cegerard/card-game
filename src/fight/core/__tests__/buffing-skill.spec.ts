import { Fight } from '../fight-simulator/fight';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';

describe('Buffing-skill', () => {
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
      agility: 0,
      skills: {
        simpleAttack: {
          damageRate: 1.0,
        },
        others: [
          {
            buffType: 'attack',
            duration: 3,
            buffRate: 0.5,
            trigger: 'turn-end',
            targetingStrategy: 'self',
          },
        ],
      },
    });
    card2 = createFightingCard({
      attack: 1,
      defense: 0,
      health: 250,
      speed: 1,
      criticalChance: 0,
      agility: 0,
      skills: {
        simpleAttack: {
          damageRate: 1.0,
        },
        others: [],
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

  it('should apply attack buff to self when triggered at turn end', () => {
    expect(fight.start()).toEqual({
      1: {
        attacker: card1.identityInfo,
        damages: [
          {
            damage: 100,
            defender: card2.identityInfo,
            dodge: false,
            isCritical: false,
            remainingHealth: 150,
          },
        ],
        energy: 10,
        kind: 'attack',
      },
      2: {
        kind: 'buff',
        source: card1.identityInfo,
        buffs: [
          {
            target: card1.identityInfo,
            kind: 'attack',
            value: 50,
            remainingTurns: 3,
          },
        ],
        energy: 10,
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
      5: {
        card: card2.identityInfo,
        kind: 'status_change',
        status: 'dead',
      },
      6: {
        kind: 'buff',
        source: card1.identityInfo,
        buffs: [
          {
            target: card1.identityInfo,
            kind: 'attack',
            value: 50,
            remainingTurns: 3,
          },
        ],
        energy: 20,
      },
      7: {
        kind: 'fight_end',
        winner: 'Player 1',
      },
    });
  });

  it('should remove expired buffs and restore original stats', () => {
    const initialAttack = card1.actualAttack;

    fight.start();

    // Attack should be buffed
    expect(card1.actualAttack).toBe(initialAttack + 2 * 50);

    // Expire the buff
    card1.decreaseBuffAndDebuffDuration();
    card1.decreaseBuffAndDebuffDuration();
    card1.decreaseBuffAndDebuffDuration();

    // Attack should return to original value
    expect(card1.actualAttack).toBe(initialAttack);
  });
});

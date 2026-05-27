import { Fight } from '../fight-simulator/fight';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { CardStateStunted } from '../cards/@types/state/card-state-stunted';
import { CardStateFrozen } from '../cards/@types/state/card-state-frozen';
import { FightingCard } from '../cards/fighting-card';

describe('Stunt effect increases damage received by 20%', () => {
  let card1: FightingCard;
  let card2: FightingCard;
  let player1: Player;
  let player2: Player;
  let fight: Fight;

  beforeEach(() => {
    card1 = createFightingCard({
      attack: 100,
      defense: 0,
      health: 1000,
      speed: 100,
      criticalChance: 0,
      agility: 0,
      accuracy: 9999,
      skills: {
        simpleAttack: {
          damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
        },
      },
    });

    card2 = createFightingCard({
      attack: 1,
      defense: 0,
      health: 1000,
      speed: 1,
      criticalChance: 0,
      agility: 0,
    });

    player1 = new Player('Player 1', [card1]);
    player2 = new Player('Player 2', [card2]);

    card2.setState(new CardStateStunted(1, 1));

    fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );
  });

  it('applies 20% extra damage to the stunted defender', () => {
    const result = fight.start();
    expect(result[1]).toMatchObject({
      kind: 'attack',
      damages: [
        {
          damage: 120,
          defender: card2.identityInfo,
          dodge: false,
          isCritical: false,
        },
      ],
    });
  });

  it('returns to normal damage after stunt expires', () => {
    const result = fight.start();
    expect(result[3]).toMatchObject({
      kind: 'attack',
      damages: [
        {
          damage: 100,
          defender: card2.identityInfo,
        },
      ],
    });
  });
});

describe('Stunt paused by freeze, resumes after freeze expires', () => {
  let card1: FightingCard;
  let card2: FightingCard;
  let player1: Player;
  let player2: Player;
  let fight: Fight;

  beforeEach(() => {
    card1 = createFightingCard({
      attack: 100,
      defense: 0,
      health: 10000,
      speed: 100,
      criticalChance: 0,
      agility: 0,
      accuracy: 9999,
      skills: {
        simpleAttack: {
          damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
        },
      },
    });

    card2 = createFightingCard({
      attack: 1,
      defense: 0,
      health: 10000,
      speed: 1,
      criticalChance: 0,
      agility: 0,
    });

    player1 = new Player('Player 1', [card1]);
    player2 = new Player('Player 2', [card2]);

    card2.setState(new CardStateStunted(1, 1));
    card2.setState(new CardStateFrozen(1, 1, 0));

    fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );
  });

  it('still deals 20% extra damage on the turn after freeze expires', () => {
    const result = fight.start();
    expect(result[3]).toMatchObject({
      kind: 'attack',
      damages: [{ damage: 120, defender: card2.identityInfo }],
    });
  });

  it('deals normal damage once stunt expires after freeze', () => {
    const result = fight.start();
    expect(result[5]).toMatchObject({
      kind: 'attack',
      damages: [{ damage: 100, defender: card2.identityInfo }],
    });
  });
});

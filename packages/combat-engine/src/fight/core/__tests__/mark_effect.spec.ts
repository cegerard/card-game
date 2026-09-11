import { Fight } from '../fight-simulator/fight';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';
import { Element } from '../cards/@types/damage/element';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';
import { FightResult } from '../fight-simulator/@types/fight-result';

describe('Elemental mark amplifies the marked damage type', () => {
  let card1: FightingCard;
  let card2: FightingCard;
  let result: FightResult;

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
          damages: [new DamageComposition(DamageType.WATER, 1.0)],
          effect: {
            type: 'mark',
            rate: 0.05,
            damageType: DamageType.WATER,
            maxStacks: 5,
          },
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
      element: Element.PHYSICAL,
    });

    const player1 = new Player('Player 1', [card1]);
    const player2 = new Player('Player 2', [card2]);
    result = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    ).start();
  });

  it('deals unamplified damage on the marking hit', () => {
    expect(result[1]).toMatchObject({
      kind: 'attack',
      damages: [{ damage: 100, defender: card2.identityInfo }],
    });
  });

  it('reports the applied mark', () => {
    expect(result[2]).toEqual({
      kind: 'mark_applied',
      card: card2.identityInfo,
      damageType: DamageType.WATER,
      stacks: 1,
    });
  });

  it('amplifies the next attack by the accumulated stacks', () => {
    expect(result[4]).toMatchObject({
      kind: 'attack',
      damages: [{ damage: 105, defender: card2.identityInfo }],
    });
  });
});

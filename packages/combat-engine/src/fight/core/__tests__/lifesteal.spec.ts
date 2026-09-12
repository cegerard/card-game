import { Fight } from '../fight-simulator/fight';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';
import { Element } from '../cards/@types/damage/element';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';
import { FightResult } from '../fight-simulator/@types/fight-result';

describe('Lifesteal heals the attacker on every landed hit', () => {
  let stealer: FightingCard;
  let target: FightingCard;
  let result: FightResult;

  beforeEach(() => {
    stealer = createFightingCard({
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
    target = createFightingCard({
      attack: 1,
      defense: 0,
      health: 100000,
      speed: 1,
      criticalChance: 0,
      agility: 0,
      accuracy: 9999,
      element: Element.PHYSICAL,
    });

    const player1 = new Player('Player 1', [stealer]);
    const player2 = new Player('Player 2', [target]);
    stealer.addRealDamage(500);
    stealer.applyLifesteal('Frénésie', 0.1, 1);

    result = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    ).start();
  });

  it('emits a healing step right after the attack', () => {
    expect(result[2]).toMatchObject({
      kind: 'healing',
      name: 'Frénésie',
      heal: [{ target: stealer.identityInfo, healed: 100 }],
    });
  });

  it('stops healing once the lifesteal duration runs out', () => {
    const healingSteps = Object.values(result).filter(
      (s: any) => s.kind === 'healing',
    );

    expect(healingSteps).toHaveLength(2);
  });
});

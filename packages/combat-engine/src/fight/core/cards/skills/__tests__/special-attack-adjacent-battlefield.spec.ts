import { SpecialAttack } from '../special-attack';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { Element } from '../../@types/damage/element';
import { Battlefield } from '../../@types/battlefield/battlefield';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { Player } from '../../../player';
import { FightingCard } from '../../fighting-card';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';

const WATER_ZONE = new Battlefield({
  name: "Zone d'eau",
  duration: 2,
  element: Element.WATER,
  enemies: {
    alterations: [{ type: 'agility', rate: 0.3, polarity: 'debuff' }],
  },
});

describe('SpecialAttack laying a battlefield between adjacent targets', () => {
  let caster: FightingCard;
  let enemies: FightingCard[];

  const castOn = (positions: number[]) => {
    const targeting: TargetingCardStrategy = {
      id: 'fixed',
      targetedCards: () => positions.map((p) => enemies[p]),
    };
    return new SpecialAttack(
      'Prison des Huit Courants',
      [new DamageComposition(DamageType.WATER, 0)],
      40,
      targeting,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      [],
      undefined,
      undefined,
      undefined,
      true,
      WATER_ZONE,
    ).launch(caster, {
      sourcePlayer: new Player('p1', [caster]),
      opponentPlayer: new Player('p2', enemies),
    });
  };

  beforeEach(() => {
    caster = createFightingCard({});
    enemies = [1, 2, 3].map(() =>
      createFightingCard({ agility: 100, resistance: 0 }),
    );
  });

  it('lays it on two targets standing side by side', () => {
    castOn([0, 1]);

    expect(enemies.map((e) => e.standsInBattlefield(Element.WATER))).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('debuffs only the adjacent targets', () => {
    castOn([0, 1]);

    expect(enemies.map((e) => e.actualAgility)).toEqual([70, 70, 100]);
  });

  it('lays nothing on targets apart', () => {
    expect(castOn([0, 2]).battlefield).toBeUndefined();
  });
});

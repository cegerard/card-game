import { DamageType } from '../@types/damage/damage-type';
import { Element } from '../@types/damage/element';

export class ElementalMatrix {
  private static readonly matrix: Record<DamageType, Record<Element, number>> =
    {
      [DamageType.PHYSICAL]: {
        [Element.PHYSICAL]: 1.0,
        [Element.FIRE]: 1.0,
        [Element.WATER]: 1.0,
        [Element.EARTH]: 1.0,
        [Element.AIR]: 1.0,
      },
      [DamageType.FIRE]: {
        [Element.PHYSICAL]: 1.0,
        [Element.FIRE]: 1.0,
        [Element.WATER]: 0.35,
        [Element.EARTH]: 1.5,
        [Element.AIR]: 1.65,
      },
      [DamageType.WATER]: {
        [Element.PHYSICAL]: 1.0,
        [Element.FIRE]: 1.8,
        [Element.WATER]: 1.0,
        [Element.EARTH]: 0.5,
        [Element.AIR]: 0.7,
      },
      [DamageType.EARTH]: {
        [Element.PHYSICAL]: 1.0,
        [Element.FIRE]: 1.0,
        [Element.WATER]: 1.5,
        [Element.EARTH]: 1.0,
        [Element.AIR]: 0.5,
      },
      [DamageType.AIR]: {
        [Element.PHYSICAL]: 1.0,
        [Element.FIRE]: 0.5,
        [Element.WATER]: 1.0,
        [Element.EARTH]: 1.5,
        [Element.AIR]: 1.0,
      },
    };

  public static getMultiplier(
    attackType: DamageType,
    defenderElement: Element,
  ): number {
    return this.matrix[attackType][defenderElement];
  }
}

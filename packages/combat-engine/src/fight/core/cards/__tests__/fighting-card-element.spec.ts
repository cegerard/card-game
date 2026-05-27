import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Element } from '../@types/damage/element';

describe('FightingCard element property', () => {
  it('default to PHYSICAL element when not specified', () => {
    const card = createFightingCard({ name: 'TestCard' });
    expect(card.cardElement).toBe(Element.PHYSICAL);
  });

  it('set element to FIRE when specified', () => {
    const card = createFightingCard({
      name: 'FireCard',
      element: Element.FIRE,
    });
    expect(card.cardElement).toBe(Element.FIRE);
  });

  it('set element to WATER when specified', () => {
    const card = createFightingCard({
      name: 'WaterCard',
      element: Element.WATER,
    });
    expect(card.cardElement).toBe(Element.WATER);
  });

  it('set element to EARTH when specified', () => {
    const card = createFightingCard({
      name: 'EarthCard',
      element: Element.EARTH,
    });
    expect(card.cardElement).toBe(Element.EARTH);
  });

  it('set element to AIR when specified', () => {
    const card = createFightingCard({
      name: 'AirCard',
      element: Element.AIR,
    });
    expect(card.cardElement).toBe(Element.AIR);
  });
});

import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

describe('FightingCard transformation', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ health: 1000 });
    card.startTransformation('Frenzy', 1, 0.1);
  });

  it('flags the card as transformed', () => {
    expect(card.isTransformed).toBe(true);
  });

  it('keeps running while the duration holds', () => {
    expect(card.decreaseTransformationDuration()).toBeNull();
  });

  it('ends once the duration runs out', () => {
    card.decreaseTransformationDuration();

    expect(card.decreaseTransformationDuration()).toEqual({
      name: 'Frenzy',
      healthCost: 100,
    });
  });

  it('charges the health cost on its owner', () => {
    card.decreaseTransformationDuration();
    card.decreaseTransformationDuration();

    expect(card.actualHealth).toBe(900);
  });

  it('does not end twice', () => {
    card.decreaseTransformationDuration();
    card.decreaseTransformationDuration();

    expect(card.decreaseTransformationDuration()).toBeNull();
  });
});

describe('Transformation health cost', () => {
  it('never kills its owner', () => {
    const card = createFightingCard({ health: 1000 });
    card.addRealDamage(950);
    card.startTransformation('Frenzy', 0, 0.1);

    card.decreaseTransformationDuration();

    expect(card.actualHealth).toBe(1);
  });

  it('costs nothing when the transformation has no cost', () => {
    const card = createFightingCard({ health: 1000 });
    card.startTransformation('Frenzy', 0);

    expect(card.decreaseTransformationDuration()).toEqual({
      name: 'Frenzy',
      healthCost: 0,
    });
  });
});

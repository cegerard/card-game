import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { MathRandomizer } from '../../../tools/math-randomizer';
import { Player } from '../../player';
import { Battlefield } from '../@types/battlefield/battlefield';
import { DamageReductionSkill } from '../skills/damage-reduction';
import { FightingCard } from '../fighting-card';

/*
 * The order of the defensive layers of a hit: the damage reduction, then the
 * damage sharing circle, then the shield. Each case stacks two of them.
 */
describe('FightingCard — order of the damage layers', () => {
  let card: FightingCard;
  let partner: FightingCard;

  const halving = () =>
    new DamageReductionSkill('Carapace', 0.5, new MathRandomizer());

  const circle = () =>
    new Battlefield({
      name: 'Cercle',
      duration: 2,
      allies: { damageSharing: { rate: 0.5, maxShareRate: 1 } },
    }).deploy(card, {
      sourcePlayer: new Player('p1', [card, partner]),
      opponentPlayer: new Player('p2', [createFightingCard({})]),
    });

  beforeEach(() => {
    partner = createFightingCard({ health: 1000 });
  });

  it('shields the hit once reduced', () => {
    card = createFightingCard({ health: 1000, damageReduction: halving() });
    card.applyShieldPoints(100, 2);

    expect(card.applyFinalDamage(100).shieldAbsorbed).toBe(50);
  });

  it('shares the hit once reduced', () => {
    card = createFightingCard({ health: 1000, damageReduction: halving() });
    circle();

    expect(card.applyFinalDamage(100).damageShared.shares[0].damage).toBe(25);
  });

  it('shields what the circle left of the hit', () => {
    card = createFightingCard({ health: 1000 });
    circle();
    card.applyShieldPoints(100, 2);

    expect(card.applyFinalDamage(100).shieldAbsorbed).toBe(50);
  });
});

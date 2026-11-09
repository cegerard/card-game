import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';
import { WeakPoint, WeakPointSpec } from '../@types/weak-point/weak-point';
import { Player } from '../../player';
import { FightingContext } from '../@types/fighting-context';
import { HypothermiaAttackEffect } from '../@types/attack/attack-hypothermia-effect';
import { MathRandomizer } from '../../../tools/math-randomizer';

describe('FightingCard weak points', () => {
  let revealer: FightingCard;
  let ally: FightingCard;
  let bearer: FightingCard;
  let context: FightingContext;

  const reveal = (spec: WeakPointSpec) =>
    bearer.revealWeakPoint(new WeakPoint(spec, revealer));
  const critical = (): WeakPointSpec => ({
    name: 'Point Faible Critique',
    consumable: true,
    exploitEffect: new HypothermiaAttackEffect(0.15, 3, new MathRandomizer()),
  });

  beforeEach(() => {
    revealer = createFightingCard({ accuracy: 80, criticalChance: 0.07 });
    ally = createFightingCard({ attack: 100, criticalChance: 0.07 });
    bearer = createFightingCard({ health: 1000 });
    context = {
      sourcePlayer: new Player('p1', [revealer, ally]),
      opponentPlayer: new Player('p2', [bearer]),
    };
  });

  it('raises the critical chance of every attacker of the bearer', () => {
    reveal({ name: 'Marque Thermique', criticalChanceBonus: 0.1 });

    expect(ally.criticalChanceAgainst(bearer)).toBeCloseTo(0.17);
  });

  it('raises the revealer accuracy by a share of its base accuracy', () => {
    reveal({ name: 'Point Faible', revealerBonus: { accuracyRate: 0.4 } });

    expect(revealer.accuracyAgainst(bearer)).toBe(112);
  });

  it('raises the revealer attack against the bearer', () => {
    reveal({ name: 'Point Faible', revealerBonus: { attackRate: 0.3 } });

    expect(revealer.targetBonusAgainst(bearer)).toBe(1.3);
  });

  it('amplifies the damage of a hit on the bearer', () => {
    reveal({ name: 'Point Faible Critique', damageMultiplier: 1.6 });

    expect(bearer.exposedDamage(50, ally)).toBe(80);
  });

  it('reports a consumable weak point struck by a landed hit', () => {
    reveal(critical());

    expect(bearer.strikeWeakPoints(context, true)[0]).toMatchObject({
      name: 'Point Faible Critique',
      reason: 'struck',
    });
  });

  it('lays the exploit effect of a weak point struck by a landed hit', () => {
    reveal(critical());
    bearer.strikeWeakPoints(context, true);

    expect(bearer.applyStateEffects()[0]).toMatchObject({
      type: 'hypothermia',
      damage: 150,
    });
  });

  it('loses a consumable weak point to a dodged hit', () => {
    reveal(critical());
    bearer.strikeWeakPoints(context, false);

    expect(bearer.hasWeakPoint()).toBe(false);
  });

  it('lays no exploit effect on a dodged hit', () => {
    reveal(critical());
    bearer.strikeWeakPoints(context, false);

    expect(bearer.applyStateEffects()).toEqual([]);
  });

  it('keeps a weak point that is not consumable', () => {
    reveal({ name: 'Point Faible' });
    bearer.strikeWeakPoints(context, true);

    expect(bearer.hasWeakPoint()).toBe(true);
  });

  it('reports the weak points that ran out at turn end', () => {
    reveal({ name: 'Marque Thermique', duration: 1 });
    bearer.decreaseWeakPointDurations();

    expect(bearer.decreaseWeakPointDurations()[0]).toMatchObject({
      name: 'Marque Thermique',
      reason: 'expired',
    });
  });

  it('makes the weak points of one revealer permanent', () => {
    reveal({ name: 'Marque Thermique', duration: 1 });
    bearer.persistWeakPointsOf(revealer, 0.25);
    bearer.decreaseWeakPointDurations();

    expect(bearer.decreaseWeakPointDurations()).toEqual([]);
  });

  it('reveals nothing on a dead card', () => {
    bearer.addRealDamage(1000);

    expect(reveal({ name: 'Marque' })).toBeUndefined();
  });
});

describe('FightingCard critical multiplier', () => {
  it('keeps the base multiplier outside a transformation', () => {
    expect(createFightingCard().criticalMultiplier(2)).toBe(2);
  });

  it('raises it during a transformation granting critical damage', () => {
    const card = createFightingCard();
    card.startTransformation('Valse', 3, undefined, 0.3);

    expect(card.criticalMultiplier(2)).toBe(2.6);
  });
});

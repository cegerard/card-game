import { WeakPoint } from '../weak-point';
import { WeakPoints } from '../weak-points';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { HypothermiaAttackEffect } from '../../attack/attack-hypothermia-effect';
import { WeakPointAttackEffect } from '../../attack/attack-weak-point-effect';
import { MathRandomizer } from '../../../../../tools/math-randomizer';

describe('WeakPoint', () => {
  let revealer: FightingCard;
  let ally: FightingCard;

  beforeEach(() => {
    revealer = createFightingCard();
    ally = createFightingCard();
  });

  it('amplifies the hits of every attacker', () => {
    const weakPoint = new WeakPoint(
      { name: 'Critique', damageMultiplier: 1.6 },
      revealer,
    );

    expect(weakPoint.damageMultiplierFor(ally)).toBe(1.6);
  });

  it('amplifies the hits of its revealer a little more', () => {
    const weakPoint = new WeakPoint(
      { name: 'Omniscience', revealerBonus: { damageRate: 0.15 } },
      revealer,
    );

    expect(weakPoint.damageMultiplierFor(revealer)).toBe(1.15);
  });

  it('grants its revealer bonus to nobody else', () => {
    const weakPoint = new WeakPoint(
      { name: 'Point Faible', revealerBonus: { attackRate: 0.3 } },
      revealer,
    );

    expect(weakPoint.bonusOf(ally, 'attackRate')).toBe(0);
  });

  it('runs out once its turns are spent', () => {
    const weakPoint = new WeakPoint({ name: 'Marque', duration: 1 }, revealer);
    weakPoint.tick();

    expect(weakPoint.tick()).toBe(true);
  });

  it('never runs out without a duration', () => {
    const weakPoint = new WeakPoint({ name: 'Point Faible' }, revealer);

    expect(weakPoint.tick()).toBe(false);
  });

  it('loses its duration once persisted', () => {
    const weakPoint = new WeakPoint({ name: 'Marque', duration: 2 }, revealer);
    weakPoint.persist(0.25);

    expect(weakPoint.remainingTurns).toBeUndefined();
  });

  it('amplifies every hit once persisted', () => {
    const weakPoint = new WeakPoint(
      { name: 'Marque', damageMultiplier: 2 },
      revealer,
    );
    weakPoint.persist(0.25);

    expect(weakPoint.damageMultiplierFor(ally)).toBe(2.5);
  });

  it('refuses an exploit effect on a weak point never consumed', () => {
    const exploitEffect = new HypothermiaAttackEffect(
      0.15,
      3,
      new MathRandomizer(),
    );

    expect(
      () => new WeakPoint({ name: 'Marque', exploitEffect }, revealer),
    ).toThrow('consumable');
  });

  it('refuses a duration below one turn', () => {
    expect(
      () => new WeakPoint({ name: 'Marque', duration: 0 }, revealer),
    ).toThrow('duration');
  });

  it('refuses a damage multiplier that is not positive', () => {
    expect(
      () => new WeakPoint({ name: 'Marque', damageMultiplier: 0 }, revealer),
    ).toThrow('damageMultiplier');
  });
});

describe('WeakPointAttackEffect', () => {
  it('rejects an invalid weak point when built, not at the first hit', () => {
    expect(
      () =>
        new WeakPointAttackEffect(
          { name: 'Marque', duration: 0 },
          new MathRandomizer(),
        ),
    ).toThrow('duration');
  });
});

describe('WeakPoints', () => {
  let revealer: FightingCard;
  let weakPoints: WeakPoints;

  beforeEach(() => {
    revealer = createFightingCard();
    weakPoints = new WeakPoints();
  });

  it('replaces a weak point revealed again under the same name', () => {
    weakPoints.reveal(
      new WeakPoint({ name: 'Marque', damageMultiplier: 2 }, revealer),
    );
    weakPoints.reveal(
      new WeakPoint({ name: 'Marque', damageMultiplier: 3 }, revealer),
    );

    expect(weakPoints.damageMultiplierFor(revealer)).toBe(3);
  });

  it('multiplies the damage multipliers of different weak points', () => {
    weakPoints.reveal(
      new WeakPoint({ name: 'A', damageMultiplier: 2 }, revealer),
    );
    weakPoints.reveal(
      new WeakPoint({ name: 'B', damageMultiplier: 3 }, revealer),
    );

    expect(weakPoints.damageMultiplierFor(revealer)).toBe(6);
  });

  it('adds the critical chance bonuses', () => {
    weakPoints.reveal(
      new WeakPoint({ name: 'A', criticalChanceBonus: 0.1 }, revealer),
    );
    weakPoints.reveal(
      new WeakPoint({ name: 'B', criticalChanceBonus: 0.2 }, revealer),
    );

    expect(weakPoints.criticalChanceBonus).toBeCloseTo(0.3);
  });

  it('only gives up its consumable weak points', () => {
    weakPoints.reveal(new WeakPoint({ name: 'A', consumable: true }, revealer));
    weakPoints.reveal(new WeakPoint({ name: 'B' }, revealer));

    expect(weakPoints.consume().map((p) => p.name)).toEqual(['A']);
  });

  it('keeps the weak points a consumption left', () => {
    weakPoints.reveal(new WeakPoint({ name: 'A', consumable: true }, revealer));
    weakPoints.reveal(new WeakPoint({ name: 'B' }, revealer));
    weakPoints.consume();

    expect(weakPoints.isEmpty).toBe(false);
  });

  it('gives up the weak points that ran out', () => {
    weakPoints.reveal(new WeakPoint({ name: 'A', duration: 1 }, revealer));
    weakPoints.tick();

    expect(weakPoints.tick().map((p) => p.name)).toEqual(['A']);
  });

  it('lists the weak points one revealer laid', () => {
    weakPoints.reveal(new WeakPoint({ name: 'A' }, revealer));
    weakPoints.reveal(new WeakPoint({ name: 'B' }, createFightingCard()));

    expect(weakPoints.revealedBy(revealer).map((p) => p.name)).toEqual(['A']);
  });
});

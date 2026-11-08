import { AftershockSkill } from '../aftershock';
import { WeakPointLegacySkill } from '../weak-point-legacy';
import { AfflictionSkillResults } from '../skill';
import { Splash } from '../../@types/attack/splash';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { AfterAttackTrigger } from '../../../trigger/after-attack';
import { SelfDeathTrigger } from '../../../trigger/self-death';
import { WeakPoint } from '../../@types/weak-point/weak-point';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../../@types/fighting-context';

describe('AftershockSkill', () => {
  let source: FightingCard;
  let enemies: FightingCard[];
  let context: FightingContext;

  const aftershock = () =>
    new AftershockSkill(
      'Tempête de Cristaux',
      new Splash(
        'Tempête de Cristaux',
        [new DamageComposition(DamageType.AIR, 0.6)],
        undefined,
        false,
      ),
      new AfterAttackTrigger(),
    );

  beforeEach(() => {
    source = createFightingCard({ attack: 100, accuracy: 9999 });
    enemies = [1, 2, 3].map(() =>
      createFightingCard({ defense: 0, agility: 0 }),
    );
    context = {
      sourcePlayer: new Player('p1', [source]),
      opponentPlayer: new Player('p2', enemies),
      attackTarget: enemies[1],
    };
  });

  it('strikes the neighbors of the card the attack was aimed at', () => {
    const { results } = aftershock().launch(source, context);

    expect(results.map((r) => r.defender)).toEqual([enemies[0], enemies[2]]);
  });

  it('strikes nobody without an attack target', () => {
    const { results } = aftershock().launch(source, {
      ...context,
      attackTarget: undefined,
    });

    expect(results).toEqual([]);
  });
});

describe('WeakPointLegacySkill', () => {
  let revealer: FightingCard;
  let enemy: FightingCard;
  let results: AfflictionSkillResults;

  beforeEach(() => {
    revealer = createFightingCard();
    enemy = createFightingCard({ health: 1000 });
    enemy.revealWeakPoint(
      new WeakPoint({ name: 'Marque', duration: 1 }, revealer),
    );
    enemy.revealWeakPoint(
      new WeakPoint({ name: 'Autre', duration: 1 }, createFightingCard()),
    );
    results = new WeakPointLegacySkill(
      'Héritage du Cygne',
      0.25,
      new SelfDeathTrigger(revealer.id),
    ).launch(revealer, {
      sourcePlayer: new Player('p1', [revealer]),
      opponentPlayer: new Player('p2', [enemy]),
    });
  });

  it('reports the weak points of its owner made permanent', () => {
    expect(results.results).toEqual([
      expect.objectContaining({
        card: enemy,
        weakPoint: expect.objectContaining({ name: 'Marque' }),
      }),
    ]);
  });

  it('amplifies the hits through them', () => {
    expect(enemy.exposedDamage(100, createFightingCard())).toBe(125);
  });

  it('leaves the weak points of another revealer on their clock', () => {
    enemy.decreaseWeakPointDurations();

    expect(enemy.decreaseWeakPointDurations()).toEqual([
      expect.objectContaining({ name: 'Autre', reason: 'expired' }),
    ]);
  });

  it('rejects a rate that is not positive', () => {
    expect(
      () => new WeakPointLegacySkill('Héritage', 0, new SelfDeathTrigger('x')),
    ).toThrow('rate');
  });
});

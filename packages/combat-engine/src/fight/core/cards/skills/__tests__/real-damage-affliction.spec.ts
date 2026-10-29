import { RealDamageSkill } from '../real-damage';
import { AfflictionSkill } from '../affliction';
import { AttackSkillResults, AfflictionSkillResults } from '../skill';
import { TurnEnd } from '../../../trigger/turn-end';
import { TargetedAll } from '../../../targeting-card-strategies/targeted-all';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { StackedPoisonAttackEffect } from '../../@types/attack/attack-stacked-poison-effect';
import { MathRandomizer } from '../../../../tools/math-randomizer';

describe('RealDamageSkill', () => {
  let source: FightingCard;
  let enemy: FightingCard;

  const launch = (skill: RealDamageSkill) =>
    skill.launch(source, {
      sourcePlayer: new Player('p1', [source]),
      opponentPlayer: new Player('p2', [enemy]),
    }) as AttackSkillResults;

  beforeEach(() => {
    source = createFightingCard({ attack: 80 });
    enemy = createFightingCard({ health: 600, defense: 500, agility: 9999 });
  });

  it('takes a share of the target max health past defense and dodge', () => {
    launch(
      new RealDamageSkill(
        'Zone toxique',
        0.05,
        'target-max-health',
        new TurnEnd(),
        new TargetedAll(),
      ),
    );

    expect(enemy.actualHealth).toBe(570);
  });

  it('reports the damage as an attack result', () => {
    const results = launch(
      new RealDamageSkill(
        'Zone',
        0.5,
        'source-attack',
        new TurnEnd(),
        new TargetedAll(),
      ),
    );

    expect(results.results[0].damage).toBe(40);
  });

  it('rejects a non positive rate', () => {
    expect(
      () =>
        new RealDamageSkill(
          'Zone',
          0,
          'source-attack',
          new TurnEnd(),
          new TargetedAll(),
        ),
    ).toThrow('rate');
  });
});

describe('AfflictionSkill', () => {
  let source: FightingCard;
  let enemies: FightingCard[];
  let results: AfflictionSkillResults;

  beforeEach(() => {
    source = createFightingCard();
    enemies = [createFightingCard(), createFightingCard()];
    results = new AfflictionSkill(
      'Explosion de venin',
      new StackedPoisonAttackEffect(0.03, 3, 5, 2, new MathRandomizer(), {
        stacks: 5,
      }),
      new TurnEnd(),
      new TargetedAll(),
    ).launch(source, {
      sourcePlayer: new Player('p1', [source]),
      opponentPlayer: new Player('p2', enemies),
    }) as AfflictionSkillResults;
  });

  it('lays its effect on every target', () => {
    expect(enemies.map((e) => e.poisonStacks())).toEqual([5, 5]);
  });

  it('reports one effect result per target', () => {
    expect(results.results).toHaveLength(2);
  });
});

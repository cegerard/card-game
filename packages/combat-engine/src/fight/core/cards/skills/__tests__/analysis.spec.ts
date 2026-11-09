import { AnalysisSkill } from '../analysis';
import { AnalysisSkillResults, SkillKind } from '../skill';
import { TransformationSkill } from '../transformation';
import { EnemyAttackTrigger } from '../../../trigger/enemy-attack';
import { EnemiesAnalysedTrigger } from '../../../trigger/enemies-analysed';
import { WeakPointAttackEffect } from '../../@types/attack/attack-weak-point-effect';
import { HealthThresholdCondition } from '../../@types/skill-activation-conditions/health-threshold-condition';
import { MathRandomizer } from '../../../../tools/math-randomizer';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { skillResultsToSteps } from '../../../fight-simulator/skill-results-to-steps';
import { StepKind } from '../../../fight-simulator/@types/step';

describe('AnalysisSkill', () => {
  let analyst: FightingCard;
  let enemies: FightingCard[];
  let skill: AnalysisSkill;

  const attackedBy = (enemy: FightingCard) =>
    skill.launch(analyst, {
      sourcePlayer: new Player('p1', [analyst]),
      opponentPlayer: new Player('p2', enemies),
      lastAttacker: enemy,
    });
  const attackedTimes = (enemy: FightingCard, times: number) =>
    Array.from({ length: times }, () => attackedBy(enemy)).pop();

  beforeEach(() => {
    analyst = createFightingCard({ health: 1000 });
    enemies = [createFightingCard(), createFightingCard()];
    skill = new AnalysisSkill(
      'Analyse Aérienne',
      3,
      new WeakPointAttackEffect({ name: 'Point Faible' }, new MathRandomizer()),
      new EnemyAttackTrigger(),
    );
  });

  it('lays one charge on the enemy that attacked', () => {
    expect(attackedTimes(enemies[0], 2).results).toEqual([
      { target: enemies[0], charges: 2 },
    ]);
  });

  it('reveals no weak point before the enemy is full', () => {
    attackedTimes(enemies[0], 2);

    expect(enemies[0].hasWeakPoint()).toBe(false);
  });

  it('reveals the weak point with the charge that fills the enemy', () => {
    attackedTimes(enemies[0], 3);

    expect(enemies[0].hasWeakPoint()).toBe(true);
  });

  it('lays nothing more on a full enemy', () => {
    expect(attackedTimes(enemies[0], 4).results).toEqual([]);
  });

  it('lays nothing on a dead enemy', () => {
    enemies[0].addRealDamage(enemies[0].maxHealth);

    expect(attackedBy(enemies[0]).results).toEqual([]);
  });

  it('reports the charge then the weak point', () => {
    const steps = skillResultsToSteps(analyst, [attackedTimes(enemies[0], 3)]);

    expect(steps.map((s) => s.kind)).toEqual([
      StepKind.AnalysisCharged,
      StepKind.WeakPointRevealed,
    ]);
  });

  it('rejects a cap below one charge', () => {
    const effect = new WeakPointAttackEffect(
      { name: 'Point' },
      new MathRandomizer(),
    );

    expect(
      () => new AnalysisSkill('Analyse', 0, effect, new EnemyAttackTrigger()),
    ).toThrow('maxCharges');
  });

  describe('once every living enemy is full', () => {
    let results: AnalysisSkillResults;

    beforeEach(() => {
      analyst = createFightingCard({
        health: 1000,
        extraSkills: [
          skill,
          new TransformationSkill({
            name: 'Valse du Cygne Noir',
            activationCondition: new HealthThresholdCondition('below', 0.2),
            duration: 3,
            activationTrigger: new EnemiesAnalysedTrigger(),
          }),
        ],
      });
      attackedTimes(enemies[0], 3);
      results = attackedTimes(enemies[1], 3);
    });

    it('sets off the skills waiting for it', () => {
      expect(results.followUps.map((r) => r.skillKind)).toEqual([
        SkillKind.Transformation,
      ]);
    });

    it('fires a transformation once only', () => {
      expect(analyst.launchSkills('enemies-analysed', null)).toEqual([]);
    });
  });
});

import { TransformationSkill } from '../transformation';
import { AfflictionSkill } from '../affliction';
import { SkillKind, TransformationSkillResults } from '../skill';
import { HealthThresholdCondition } from '../../@types/skill-activation-conditions/health-threshold-condition';
import { EnemiesAnalysedTrigger } from '../../../trigger/enemies-analysed';
import { TransformedTrigger } from '../../../trigger/transformed';
import { FreezeAttackEffect } from '../../@types/attack/attack-freeze-effect';
import { TargetedAll } from '../../../targeting-card-strategies/targeted-all';
import { MathRandomizer } from '../../../../tools/math-randomizer';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../../@types/fighting-context';
import { skillResultsToSteps } from '../../../fight-simulator/skill-results-to-steps';
import { StepKind } from '../../../fight-simulator/@types/step';

describe('TransformationSkill set off by an event', () => {
  let owner: FightingCard;
  let enemy: FightingCard;
  let skill: TransformationSkill;
  let context: FightingContext;

  beforeEach(() => {
    skill = new TransformationSkill({
      name: 'Valse du Cygne Noir',
      activationCondition: new HealthThresholdCondition('below', 0.2),
      duration: 3,
      activationTrigger: new EnemiesAnalysedTrigger(),
      criticalDamageRate: 0.3,
    });
    owner = createFightingCard({
      extraSkills: [
        skill,
        new AfflictionSkill(
          'Gel de Masse',
          new FreezeAttackEffect(0.2, 1, new MathRandomizer()),
          new TransformedTrigger(),
          new TargetedAll(),
        ),
      ],
    });
    enemy = createFightingCard();
    context = {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [enemy]),
    };
  });

  it('fires on its activation event', () => {
    expect(skill.isTriggered('enemies-analysed')).toBe(true);
  });

  it('does not fire on any other event', () => {
    expect(skill.isTriggered('turn-end')).toBe(false);
  });

  it('does not fire again once spent', () => {
    skill.launch(owner, context);

    expect(skill.isTriggered('enemies-analysed')).toBe(false);
  });

  it('lets its owner hear it transformed', () => {
    skill.launch(owner, context);

    expect(enemy.isFrozen).toBe(true);
  });

  it('reports what the transformation set off after it', () => {
    const results = skill.launch(owner, context) as TransformationSkillResults;
    const kinds = skillResultsToSteps(owner, [results]).map((s) => s.kind);

    expect(kinds).toEqual([
      StepKind.TransformationStarted,
      StepKind.StatusChange,
    ]);
  });

  it('keeps the follow ups apart from the transformation results', () => {
    const results = skill.launch(owner, context) as TransformationSkillResults;

    expect(results.followUps.map((r) => r.skillKind)).toEqual([
      SkillKind.Affliction,
    ]);
  });

  it('raises its owner critical damage while it runs', () => {
    skill.launch(owner, context);

    expect(owner.criticalMultiplier(2)).toBe(2.6);
  });
});

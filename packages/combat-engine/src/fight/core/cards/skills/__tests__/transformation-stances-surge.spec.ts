import { TransformationSkill } from '../transformation';
import { HealthThresholdCondition } from '../../@types/skill-activation-conditions/health-threshold-condition';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { TransformationSkillResults } from '../skill';
import { StackedPoisonAttackEffect } from '../../@types/attack/attack-stacked-poison-effect';
import { MathRandomizer } from '../../../../tools/math-randomizer';
import { skillResultsToSteps } from '../../../fight-simulator/skill-results-to-steps';
import { StepKind } from '../../../fight-simulator/@types/step';

const venom = new StackedPoisonAttackEffect(
  0.03,
  3,
  3,
  2,
  new MathRandomizer(),
);

describe('TransformationSkill stances and poison surge', () => {
  let queen: FightingCard;
  let poisoned: FightingCard;
  let healthy: FightingCard;
  let results: TransformationSkillResults;

  beforeEach(() => {
    queen = createFightingCard({ health: 1000 });
    poisoned = createFightingCard({ health: 1000 });
    healthy = createFightingCard({ health: 1000 });
    venom.applyEffect(poisoned, queen, null);
    results = new TransformationSkill({
      name: 'Reine du Crépuscule',
      activationCondition: new HealthThresholdCondition('below', 0.5),
      duration: 4,
      stanceActivations: [
        { name: 'reine', duration: 4 },
        { name: 'intouchable', duration: 1, evasionChance: 1 },
      ],
      poisonSurge: { stacks: 3, damageMultiplier: 2 },
    }).launch(queen, {
      sourcePlayer: new Player('p1', [queen]),
      opponentPlayer: new Player('p2', [poisoned, healthy]),
    });
  });

  it('opens every stance on its owner', () => {
    expect(queen.hasStance('reine') && queen.hasStance('intouchable')).toBe(
      true,
    );
  });

  it('raises the poisoned cards to the surge stacks', () => {
    expect(poisoned.poisonStacks()).toBe(3);
  });

  it('surges only the cards already poisoned', () => {
    expect(results.poisonSurged).toEqual([poisoned]);
  });

  it('reports the stances then the surged poisons', () => {
    const kinds = skillResultsToSteps(queen, [results]).map((s) => s.kind);

    expect(kinds).toEqual([
      StepKind.TransformationStarted,
      StepKind.StanceStarted,
      StepKind.StanceStarted,
      StepKind.StatusChange,
    ]);
  });
});

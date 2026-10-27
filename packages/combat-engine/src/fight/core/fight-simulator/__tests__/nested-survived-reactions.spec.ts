import { Player } from '../../player';
import { TurnEnd } from '../../trigger/turn-end';
import { SurvivedTrigger } from '../../trigger/survived';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { FightingCard } from '../../cards/fighting-card';
import { SurviveSkill } from '../../cards/skills/survive';
import { ConditionalAttack } from '../../cards/skills/conditional-attack';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { AlwaysTrueAttackCondition } from '../../cards/@types/attack/conditions/always-true-attack-condition';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { Step, StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Healing } from '../../cards/skills/healing';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { Skill } from '../../cards/skills/skill';
import { Trigger } from '../../trigger/trigger';

const sturdyStriker = (
  id: string,
  trigger: Trigger,
  extraSkills: Skill[] = [],
): FightingCard =>
  createFightingCard({
    id,
    health: 100,
    defense: 0,
    agility: 0,
    attack: 1000,
    accuracy: 9999,
    survive: new SurviveSkill('Last Stand'),
    extraSkills: [
      ...extraSkills,
      new ConditionalAttack(
        'Strike',
        new SimpleAttack(
          'Strike',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          new TargetedAll(),
        ),
        new AlwaysTrueAttackCondition(),
        trigger,
      ),
    ],
  });

const endTurn = (attacker: FightingCard, defender: FightingCard): Step[] => {
  const player1 = new Player('p1', [attacker]);
  const player2 = new Player('p2', [defender]);
  const endEventProcessor = new EndEventProcessor(player1, player2);
  const handler = new DeathSkillHandler(player1, player2, endEventProcessor);
  const turnManager = new TurnManager(
    player1,
    player2,
    { onCardDeath: [handler] },
    handler,
    endEventProcessor,
  );

  return turnManager.endTurn([attacker]);
};

describe('A survived reaction striking another SURVIVE holder', () => {
  const nestedSteps = (): Step[] =>
    endTurn(
      sturdyStriker('first', new TurnEnd(), [
        new Healing('Second Wind', 0.1, new SurvivedTrigger(), new Launcher()),
      ]),
      sturdyStriker('second', new SurvivedTrigger()),
    );

  it('reports the survival of the second holder', () => {
    expect(nestedSteps().map((s) => s.kind)).toContain(StepKind.Survived);
  });

  it('runs the survived skills of the struck holder right after', () => {
    expect(nestedSteps().map((s) => s.kind)).toEqual([
      StepKind.Attack,
      StepKind.Survived,
      StepKind.Attack,
      StepKind.Survived,
      StepKind.Healing,
    ]);
  });
});

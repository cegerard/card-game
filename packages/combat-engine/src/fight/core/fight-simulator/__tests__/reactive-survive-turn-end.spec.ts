import { Player } from '../../player';
import { TurnEnd } from '../../trigger/turn-end';
import { SurvivedTrigger } from '../../trigger/survived';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { FightingCard } from '../../cards/fighting-card';
import { SurviveSkill } from '../../cards/skills/survive';
import { Healing } from '../../cards/skills/healing';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { ConditionalAttack } from '../../cards/skills/conditional-attack';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { AlwaysTrueAttackCondition } from '../../cards/@types/attack/conditions/always-true-attack-condition';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { Execution } from '../../cards/@types/attack/execution';
import { Step, StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { executioner } from '../../../../../test/helpers/reactive-kill';

const survivor = (): FightingCard =>
  createFightingCard({
    id: 'survivor',
    health: 100,
    defense: 0,
    agility: 0,
    survive: new SurviveSkill('Last Stand'),
    extraSkills: [
      new Healing('Second Wind', 0.1, new SurvivedTrigger(), new Launcher()),
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

const kinds = (steps: Step[]): StepKind[] => steps.map((s) => s.kind);

describe('TurnManager attack at turn end on a SURVIVE holder', () => {
  it('reports survived right after the attack step', () => {
    const steps = endTurn(executioner(new TurnEnd()), survivor());

    expect(kinds(steps).slice(0, 2)).toEqual([
      StepKind.Attack,
      StepKind.Survived,
    ]);
  });

  it('reports the survived reactions right after survived', () => {
    const steps = endTurn(executioner(new TurnEnd()), survivor());

    expect(kinds(steps).slice(0, 3)).toEqual([
      StepKind.Attack,
      StepKind.Survived,
      StepKind.Healing,
    ]);
  });

  it('does not report the holder as dead', () => {
    const steps = endTurn(executioner(new TurnEnd()), survivor());

    expect(kinds(steps)).not.toContain(StepKind.StatusChange);
  });
});

describe('TurnManager execution at turn end held by SURVIVE', () => {
  const executingAttacker = (): FightingCard =>
    createFightingCard({
      id: 'executor',
      attack: 20,
      accuracy: 9999,
      extraSkills: [
        new ConditionalAttack(
          'Verdict',
          new SimpleAttack(
            'Verdict',
            [new DamageComposition(DamageType.PHYSICAL, 1)],
            new TargetedAll(),
          ),
          new AlwaysTrueAttackCondition(),
          new TurnEnd(),
          { execution: new Execution(0.99) },
        ),
      ],
    });

  it('reports executed, survived, then the reactions', () => {
    const steps = endTurn(executingAttacker(), survivor());

    expect(kinds(steps)).toEqual([
      StepKind.Attack,
      StepKind.Executed,
      StepKind.Survived,
      StepKind.Healing,
    ]);
  });
});

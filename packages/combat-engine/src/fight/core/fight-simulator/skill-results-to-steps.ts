import { FightingCard } from '../cards/fighting-card';
import {
  BuffSkillResults,
  DebuffSkillResults,
  SkillKind,
  SkillResults,
  TransformationSkillResults,
} from '../cards/skills/skill';

type AlterationSkillResults =
  BuffSkillResults | DebuffSkillResults | TransformationSkillResults;
import { Step, StepKind } from './@types/step';
import { EndEventProcessor } from './end-event-processor';
import { status } from './@types/status-change-report';

export function skillResultsToSteps(
  card: FightingCard,
  skillResults: SkillResults[],
  endEventProcessor?: EndEventProcessor,
): Step[] {
  const steps: Step[] = [];

  for (const skillResult of skillResults) {
    switch (skillResult.skillKind) {
      case SkillKind.Healing:
        steps.push({
          kind: StepKind.Healing,
          name: skillResult.name,
          source: card.identityInfo,
          heal: skillResult.results.map((heal) => ({
            target: heal.target,
            healed: heal.healAmount,
            remainingHealth: heal.remainingHealth,
          })),
          energy: card.actualEnergy,
          powerId: skillResult.powerId,
        });
        break;
      case SkillKind.Buff:
      case SkillKind.Debuff:
        pushAlterationStep(
          steps,
          card,
          skillResult.skillKind === SkillKind.Buff
            ? StepKind.Buff
            : StepKind.Debuff,
          skillResult,
        );
        break;
      case SkillKind.Attack: {
        steps.push({
          kind: StepKind.Attack,
          name: skillResult.name,
          attacker: card.identityInfo,
          damages: skillResult.results.map((r) => ({
            defender: r.defender.identityInfo,
            damage: r.damage,
            isCritical: r.isCritical,
            dodge: r.dodge,
            remainingHealth: r.remainingHealth,
            kind: r.kind,
          })),
          energy: card.actualEnergy,
          powerId: skillResult.powerId,
        });

        // Same per-hit order as ActionStage.handleAttackResult: what happened
        // on the way to the health pool first, then the outcome.
        const hitSteps: Step[] = skillResult.results.flatMap((r): Step[] => {
          const perHit: Step[] = [];

          if (r.mitigated) {
            perHit.push({
              kind: StepKind.DamageMitigated,
              name: r.mitigatedSkillName,
              card: r.defender.identityInfo,
            });
          }

          if (r.shieldBroken) {
            perHit.push({
              kind: StepKind.ShieldBroken,
              card: r.defender.identityInfo,
            });
          }

          if (r.defender.isDead()) {
            perHit.push({
              kind: StepKind.StatusChange,
              card: r.defender.identityInfo,
              status: 'dead',
            });
            return perHit;
          }

          if (r.effects?.length) {
            perHit.push(
              ...r.effects.map((effect) => ({
                kind: StepKind.StatusChange as const,
                status: effect.type as status,
                card: effect.card.identityInfo,
              })),
            );
          }

          return perHit;
        });
        steps.push(...hitSteps);
        break;
      }
      case SkillKind.TargetingOverride:
        skillResult.results.forEach((report) =>
          steps.push({
            name: skillResult.name,
            ...report,
          }),
        );
        break;
      case SkillKind.Transformation:
        steps.push({
          kind: StepKind.TransformationStarted,
          name: skillResult.name,
          card: card.identityInfo,
          remainingTurns: skillResult.remainingTurns,
        });
        pushAlterationStep(steps, card, StepKind.Buff, skillResult);
        break;
      case SkillKind.Shield:
        if (skillResult.results.length > 0) {
          steps.push({
            kind: StepKind.ShieldApplied,
            name: skillResult.name,
            source: card.identityInfo,
            targets: skillResult.results.map((r) => ({
              target: r.target,
              points: r.shield.points,
            })),
          });
        }
        break;
      default:
        throw new Error(`Unknown SkillKind: ${(skillResult as any).skillKind}`);
    }

    if (skillResult.endEvent && endEventProcessor) {
      steps.push(
        ...endEventProcessor.processEndEvent(
          skillResult.endEvent,
          card.identityInfo,
          skillResult.powerId,
        ),
      );
    }
  }

  return steps;
}

function pushAlterationStep(
  steps: Step[],
  card: FightingCard,
  kind: StepKind.Buff | StepKind.Debuff,
  skillResult: AlterationSkillResults,
): void {
  if (skillResult.results.length === 0) return;

  steps.push({
    kind,
    name: skillResult.name,
    source: card.identityInfo,
    alterations: skillResult.results.map((result) => ({
      target: result.target,
      kind: result.alteration.type,
      value: result.alteration.value,
      remainingTurns: result.alteration.duration,
    })),
    energy: card.actualEnergy,
    powerId: skillResult.powerId,
  });
}

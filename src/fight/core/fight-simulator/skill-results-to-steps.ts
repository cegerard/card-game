import { FightingCard } from '../cards/fighting-card';
import { SkillKind, SkillResults } from '../cards/skills/skill';
import { Step, StepKind } from './@types/step';
import { EndEventProcessor } from './end-event-processor';

export function skillResultsToSteps(
  card: FightingCard,
  skillResults: SkillResults[],
  endEventProcessor?: EndEventProcessor,
): Step[] {
  const steps: Step[] = [];

  for (const skillResult of skillResults) {
    if (skillResult.skillKind === SkillKind.Healing) {
      steps.push({
        kind: StepKind.Healing,
        source: card.identityInfo,
        heal: skillResult.results.map((heal) => ({
          target: heal.target,
          healed: heal.healAmount,
          remainingHealth: heal.remainingHealth,
        })),
        energy: card.actualEnergy,
        powerId: skillResult.powerId,
      });
    }

    if (skillResult.skillKind === SkillKind.Buff) {
      if (skillResult.results.length > 0) {
        steps.push({
          kind: StepKind.Buff,
          source: card.identityInfo,
          buffs: skillResult.results.map((result) => ({
            target: result.target,
            kind: result.buff.type,
            value: result.buff.value,
            remainingTurns: result.buff.duration,
          })),
          energy: card.actualEnergy,
          powerId: skillResult.powerId,
        });
      }
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

    if (skillResult.skillKind === SkillKind.Debuff) {
      if (skillResult.results.length > 0) {
        steps.push({
          kind: StepKind.Debuff,
          source: card.identityInfo,
          debuffs: skillResult.results.map((result) => ({
            target: result.target,
            kind: result.debuff.type,
            value: result.debuff.value,
            remainingTurns: result.debuff.duration,
          })),
          energy: card.actualEnergy,
          powerId: skillResult.powerId,
        });
      }
    }

    if (skillResult.skillKind === SkillKind.TargetingOverride) {
      skillResult.results.forEach((report) => steps.push(report));
    }
  }

  return steps;
}

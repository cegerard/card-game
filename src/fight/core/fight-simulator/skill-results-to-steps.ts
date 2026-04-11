import {
  BuffResult,
  BuffResults,
} from '../cards/@types/action-result/buff-results';
import {
  DebuffResult,
  DebuffResults,
} from '../cards/@types/action-result/debuff-results';
import { FightingCard } from '../cards/fighting-card';
import { SkillKind, SkillResults } from '../cards/skills/skill';
import { Step, StepKind } from './@types/step';
import { TargetingOverrideReport } from './@types/targeting-override-report';
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
      const buffResults = skillResult.results as BuffResults;
      if (buffResults.length > 0) {
        steps.push({
          kind: StepKind.Buff,
          source: card.identityInfo,
          buffs: buffResults.map((result: BuffResult) => ({
            target: result.target,
            kind: result.buff.type,
            value: result.buff.value,
            remainingTurns: result.buff.duration,
          })),
          energy: card.actualEnergy,
          powerId: skillResult.powerId,
        });
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

    if (skillResult.skillKind === SkillKind.Debuff) {
      const debuffResults = skillResult.results as DebuffResults;
      if (debuffResults.length > 0) {
        steps.push({
          kind: StepKind.Debuff,
          source: card.identityInfo,
          debuffs: debuffResults.map((result: DebuffResult) => ({
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
      const reports =
        skillResult.results as unknown as TargetingOverrideReport[];
      reports.forEach((report) => steps.push(report));
    }
  }

  return steps;
}

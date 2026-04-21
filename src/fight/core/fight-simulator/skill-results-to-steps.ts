import { FightingCard } from '../cards/fighting-card';
import { SkillKind, SkillResults } from '../cards/skills/skill';
import { Step, StepKind } from './@types/step';
import { EndEventProcessor } from './end-event-processor';
import { StatusChangeReport, status } from './@types/status-change-report';

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
        if (skillResult.results.length > 0) {
          steps.push({
            kind: StepKind.Buff,
            name: skillResult.name,
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
        break;
      case SkillKind.Debuff:
        if (skillResult.results.length > 0) {
          steps.push({
            kind: StepKind.Debuff,
            name: skillResult.name,
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
            remainingHealth: r.defender.actualHealth,
          })),
          energy: card.actualEnergy,
        });

        const statusChanges: StatusChangeReport[] = skillResult.results.flatMap(
          (r): StatusChangeReport[] => {
            if (r.defender.isDead()) {
              return [
                {
                  kind: StepKind.StatusChange,
                  card: r.defender.identityInfo,
                  status: 'dead',
                },
              ];
            }
            if (r.effect) {
              return [
                {
                  kind: StepKind.StatusChange,
                  status: r.effect.type as status,
                  card: r.effect.card.identityInfo,
                },
              ];
            }
            return [];
          },
        );
        steps.push(...statusChanges);
        break;
      }
      case SkillKind.TargetingOverride:
        skillResult.results.forEach((report) => steps.push(report));
        break;
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

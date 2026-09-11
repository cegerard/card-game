import { FightingCard } from '../cards/fighting-card';
import { FightingContext } from '../cards/@types/fighting-context';
import { SkillResults } from '../cards/skills/skill';

export function triggerReactiveSkills(
  card: FightingCard,
  context: FightingContext,
): SkillResults[] {
  return card
    .getHealthReactiveSkills()
    .filter((s) => s.onHealthChanged(card))
    .map((s) => s.launch(card, context));
}

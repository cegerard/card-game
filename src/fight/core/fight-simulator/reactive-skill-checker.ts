import { FightingCard } from '../cards/fighting-card';
import { FightingContext } from '../cards/@types/fighting-context';
import { ShieldSkillResults } from '../cards/skills/skill';

export function triggerReactiveSkills(
  card: FightingCard,
  context: FightingContext,
): ShieldSkillResults[] {
  return card
    .getHealthReactiveSkills()
    .filter((s) => s.onHealthChanged(card))
    .map((s) => s.launch(card, context) as ShieldSkillResults);
}

import { FightingCard } from '../cards/fighting-card';
import { FightingContext } from '../cards/@types/fighting-context';
import { ShieldSkillResults } from '../cards/skills/skill';

export function checkReactiveSkills(
  card: FightingCard,
  context: FightingContext,
): ShieldSkillResults[] {
  return card
    .getReactiveSkills()
    .filter((s) => s.onHealthChanged(card))
    .map((s) => s.launch(card, context) as ShieldSkillResults);
}

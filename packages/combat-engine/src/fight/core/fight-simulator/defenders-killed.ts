import { FightingCard } from '../cards/fighting-card';
import { SkillKind, SkillResults } from '../cards/skills/skill';

/**
 * Cards left dead by the attacks among `skillResults`: main strike, splash and
 * executions alike. Each card once, so the caller can run its death cascade.
 */
export function defendersKilled(skillResults: SkillResults[]): FightingCard[] {
  const struck = skillResults.flatMap((result) =>
    result.skillKind === SkillKind.Attack
      ? [
          ...result.results.map((r) => r.defender),
          ...(result.splash?.results ?? []).map((r) => r.defender),
          ...(result.executions?.results ?? []).map((r) => r.card),
        ]
      : [],
  );

  return [...new Set(struck)].filter((card) => card.isDead());
}

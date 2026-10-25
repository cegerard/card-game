import { FightingCard } from '../cards/fighting-card';
import { SkillResults } from '../cards/skills/skill';
import { CardDeathSubscriber } from './card-death-subscriber';
import { DeathSkillHandler } from './death-skill-handler';
import { defendersKilled } from './defenders-killed';
import { Step } from './@types/step';

/**
 * Runs the death cascade of every card the attacks among `skillResults` left
 * dead, credited to `killer`, and returns the steps each cascade produced.
 * `skillResultsToSteps()` already reported their `dead` status.
 */
export function reactiveKillSteps(
  skillResults: SkillResults[],
  killer: FightingCard,
  eventBroker: { onCardDeath: CardDeathSubscriber[] },
  deathSkillHandler: DeathSkillHandler,
): Step[] {
  return defendersKilled(skillResults).flatMap((killed) => {
    eventBroker.onCardDeath.forEach((subscriber) =>
      subscriber.notifyDeath(killed, killer),
    );
    return deathSkillHandler.drainSteps();
  });
}

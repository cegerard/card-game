import { FightingCard } from '../cards/fighting-card';
import { FightingContext } from '../cards/@types/fighting-context';
import { SkillResults } from '../cards/skills/skill';
import { Step } from './@types/step';
import { CardDeathSubscriber } from './card-death-subscriber';
import { DeathSkillHandler } from './death-skill-handler';
import { EndEventProcessor } from './end-event-processor';
import { reactiveKillSteps } from './reactive-kill-steps';
import { skillResultsToSteps } from './skill-results-to-steps';

/** What a card does after a SURVIVE skill kept it alive, as steps. */
export type SurvivedReactor = (card: FightingCard) => Step[];

/**
 * Launches the `survived` skills of `card` and reports them, followed by
 * whatever `afterReactions` adds (the death cascade of the cards they killed).
 * A reaction that strikes another SURVIVE holder goes through
 * `nestedReactor`, and the end events of a limited skill through
 * `endEventProcessor`.
 */
export function survivedReactions(
  card: FightingCard,
  context: FightingContext,
  afterReactions: (reactions: SkillResults[]) => Step[],
  endEventProcessor?: EndEventProcessor,
  nestedReactor?: SurvivedReactor,
): Step[] {
  const reactions = card.launchSkills('survived', context);

  return [
    ...skillResultsToSteps(card, reactions, endEventProcessor, nestedReactor),
    ...afterReactions(reactions),
  ];
}

/**
 * The reactor of a fight: `survived` skills launched against the board of the
 * card, with the death cascade of the cards they kill credited to it.
 */
export function fightSurvivedReactor(
  contextOf: (card: FightingCard) => FightingContext,
  eventBroker: { onCardDeath: CardDeathSubscriber[] },
  deathSkillHandler: DeathSkillHandler,
  endEventProcessor?: EndEventProcessor,
): SurvivedReactor {
  const reactor: SurvivedReactor = (card) =>
    survivedReactions(
      card,
      contextOf(card),
      (reactions) =>
        reactiveKillSteps(reactions, card, eventBroker, deathSkillHandler),
      endEventProcessor,
      reactor,
    );
  return reactor;
}

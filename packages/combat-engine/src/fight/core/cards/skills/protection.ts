import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { Trigger } from '../../trigger/trigger';
import { ActivatableTrigger } from '../../trigger/activatable-trigger';
import { Skill, SkillKind, SkillResults } from './skill';

export type ProtectionResult = {
  protectedCard: FightingCard;
  remainingTurns: number;
};

/**
 * Steps in front of an ally for a number of turns: while it runs, attacks
 * aimed at that ally are resolved against the protector instead.
 *
 * It protects a single ally — the first its targeting strategy returns — so
 * pairing it with `most-wounded-ally` gives the guardian whoever is in the
 * worst shape at that moment. A strategy returning nobody is a no-op.
 */
export class ProtectionSkill implements Skill {
  public readonly id = 'protection-skill';

  private activationCount = 0;

  constructor(
    public readonly name: string,
    private readonly duration: number,
    private readonly trigger: Trigger,
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly activationLimit?: number,
    public readonly powerId?: string,
  ) {}

  launch(
    source: FightingCard,
    context: FightingContext,
    _targetingOverride?: TargetingCardStrategy,
  ): SkillResults {
    const [protectedCard] = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    // A skill that protects nobody must not burn its activation budget.
    if (!protectedCard) {
      return { skillKind: SkillKind.Protection, results: [], name: this.name };
    }

    this.activationCount++;
    source.protect(protectedCard, this.duration);

    return {
      skillKind: SkillKind.Protection,
      results: [{ protectedCard, remainingTurns: this.duration }],
      name: this.name,
      powerId: this.powerId,
    };
  }

  isTriggered(triggerName: string): boolean {
    if (this.isExhausted()) return false;

    return this.trigger.isTriggered(triggerName);
  }

  activate(triggerId: string, context: FightingContext): void {
    if ('activate' in this.trigger) {
      (this.trigger as ActivatableTrigger).activate(triggerId, context);
    }
  }

  private isExhausted(): boolean {
    return (
      this.activationLimit !== undefined &&
      this.activationCount >= this.activationLimit
    );
  }
}

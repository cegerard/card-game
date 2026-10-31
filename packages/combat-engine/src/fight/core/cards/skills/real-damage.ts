import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackResult } from '../@types/action-result/attack-result';
import { RATE_BASES, RateBasis } from '../@types/rate-basis';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { Trigger } from '../../trigger/trigger';
import { round2 } from '../../../tools/round';
import { Skill, SkillKind, SkillResults } from './skill';

/**
 * Takes `rate` of its basis from every card targeted when its event fires,
 * as real damage: no dodge, defense, shield or damage reduction stops it.
 * Reported as an attack, so the cards it kills run the death cascade.
 */
export class RealDamageSkill implements Skill {
  public readonly id = 'real-damage';

  constructor(
    public readonly name: string,
    private readonly rate: number,
    private readonly basis: RateBasis,
    private readonly trigger: Trigger,
    private readonly targetingStrategy: TargetingCardStrategy,
    public readonly requiredStance?: string,
  ) {
    if (rate <= 0) {
      throw new Error(
        `RealDamageSkill rate must be greater than 0, got ${rate}`,
      );
    }
    if (!RATE_BASES.includes(basis)) {
      throw new Error(`Unknown real damage basis: ${basis}`);
    }
  }

  launch(source: FightingCard, context: FightingContext): SkillResults {
    const targets = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    return {
      skillKind: SkillKind.Attack,
      name: this.name,
      results: targets.map((card): AttackResult => {
        const damage = round2(
          this.rate *
            (this.basis === 'target-max-health'
              ? card.maxHealth
              : source.attackPower(context)),
        );

        return {
          damage: card.addRealDamage(damage),
          isCritical: false,
          dodge: false,
          defender: card,
          remainingHealth: card.actualHealth,
        };
      }),
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}

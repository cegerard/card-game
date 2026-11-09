import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { Trigger } from '../../trigger/trigger';
import { AttackCondition } from '../@types/attack/attack-condition';
import { AlterationType } from '../@types/alteration/alteration-type';
import { StateEffectType } from '../@types/state/state-effect-type';
import {
  BuffResult,
  DebuffResult,
} from '../@types/action-result/alteration-result';
import { Skill, SkillKind, SupportSkillResults } from './skill';

export type SupportConfig = {
  /** Shield of `rate` of the caster max health, for `duration` turns. */
  shield?: { rate: number; duration: number };
  /** Statuses removed from each target, picked at random. */
  cleanse?: number;
  alterations?: {
    type: AlterationType;
    rate: number;
    duration: number;
    polarity: 'buff' | 'debuff';
  }[];
};

/**
 * A helping hand that strikes nobody: shields, cleanses and alters its targets.
 * On `next-action` it takes the action of its owner, every `interval` turns
 * when its condition is a cooldown; with nobody to help, the owner attacks.
 */
export class SupportSkill implements Skill {
  public readonly id = 'support';

  constructor(
    public readonly name: string,
    private readonly trigger: Trigger,
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly condition: AttackCondition,
    private readonly config: SupportConfig,
    public readonly requiredStance?: string,
  ) {
    const { shield, cleanse, alterations } = config;
    if (!shield && !cleanse && !alterations?.length) {
      throw new Error(
        'SUPPORT skill requires a shield, a cleanse or alterations',
      );
    }
    if (cleanse !== undefined && (!Number.isInteger(cleanse) || cleanse < 1)) {
      throw new Error(
        `SUPPORT cleanse must be an integer >= 1, got ${cleanse}`,
      );
    }
    if (shield && (shield.rate <= 0 || shield.duration < 0)) {
      throw new Error('SUPPORT shield needs a rate above 0 and a duration');
    }
  }

  launch(source: FightingCard, context: FightingContext): SupportSkillResults {
    const targets = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );
    if (targets.length > 0) this.condition.reset();

    return {
      skillKind: SkillKind.Support,
      name: this.name,
      results: targets.map((target) => ({
        target,
        shield: this.shieldOf(source, target),
        cleansed: this.cleanse(target),
        alterations: this.alter(target),
      })),
    };
  }

  isTriggered(triggerName: string): boolean {
    return (
      this.trigger.isTriggered(triggerName) && this.condition.isTriggered()
    );
  }

  tick(): void {
    this.condition.tick();
  }

  private shieldOf(source: FightingCard, target: FightingCard) {
    const shield = this.config.shield;
    if (!shield) return undefined;

    return target.applyShieldPoints(
      Math.round(shield.rate * source.maxHealth),
      shield.duration,
    );
  }

  private cleanse(target: FightingCard): StateEffectType[] {
    return Array.from({ length: this.config.cleanse ?? 0 })
      .map(() => target.cleanseRandomStatus())
      .filter((type) => type !== undefined);
  }

  private alter(target: FightingCard): (BuffResult | DebuffResult)[] {
    return (this.config.alterations ?? [])
      .map(({ type, rate, duration, polarity }) => ({
        target: target.identityInfo,
        alteration:
          polarity === 'debuff'
            ? target.applyDebuff(type, rate, duration)
            : target.applyBuff(type, rate, duration),
      }))
      .filter(
        (result): result is BuffResult | DebuffResult =>
          result.alteration !== undefined,
      );
  }
}

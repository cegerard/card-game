import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AlterationType } from '../@types/alteration/alteration-type';
import { Trigger } from '../../trigger/trigger';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { Skill, SkillKind, SkillResults } from './skill';

/**
 * Hands every buff of one type its owner holds to the first card its targeting
 * returns, value, remaining duration and stack pile unchanged. Nothing to
 * hand over, or nobody to receive it, and nothing happens.
 */
export class BuffTransferSkill implements Skill {
  public readonly id = 'buff-transfer-skill';

  constructor(
    public readonly name: string,
    private readonly buffType: AlterationType,
    private readonly trigger: Trigger,
    private readonly targetingStrategy: TargetingCardStrategy,
    public readonly requiredStance?: string,
    private readonly powerId?: string,
  ) {}

  launch(source: FightingCard, context: FightingContext): SkillResults {
    const [heir] = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );
    const buffs = heir ? source.takeBuffs(this.buffType) : [];
    heir?.receiveBuffs(buffs);

    return {
      skillKind: SkillKind.BuffTransfer,
      name: this.name,
      results: buffs.length > 0 ? [{ target: heir, buffs }] : [],
      powerId: this.powerId,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}

import { FightingCard } from '../../../fighting-card';
import { FightingContext } from '../../fighting-context';
import { ConditionedAlteration } from '../conditioned-alteration';

export class AllyPresenceCondition implements ConditionedAlteration {
  public readonly id = 'ally-presence';

  constructor(private readonly allyName: string) {}

  public evaluate(_source: FightingCard, context: FightingContext): boolean {
    return context.sourcePlayer.playableCards.some(
      (card) => card.name === this.allyName,
    );
  }
}

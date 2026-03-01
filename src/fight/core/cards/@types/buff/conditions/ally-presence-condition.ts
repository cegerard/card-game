import { FightingCard } from '../../../fighting-card';
import { FightingContext } from '../../fighting-context';
import { BuffCondition } from '../buff-condition';

export class AllyPresenceCondition implements BuffCondition {
  public readonly id = 'ally-presence';

  constructor(private readonly allyName: string) {}

  public evaluate(_source: FightingCard, context: FightingContext): boolean {
    return context.sourcePlayer.playableCards.some(
      (card) => card.name === this.allyName,
    );
  }
}

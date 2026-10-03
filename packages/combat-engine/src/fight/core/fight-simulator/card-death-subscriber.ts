import { FightingCard } from '../cards/fighting-card';
import { StateEffectType } from '../cards/@types/state/state-effect-type';

export interface CardDeathSubscriber {
  notifyDeath: (
    card: FightingCard,
    killerCard?: FightingCard,
    cause?: StateEffectType,
  ) => void;
}

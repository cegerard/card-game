import type { StateEffectType } from '@card-game/shared-types';
import { FightingCard } from '../cards/fighting-card';

export interface CardDeathSubscriber {
  notifyDeath: (
    card: FightingCard,
    killerCard?: FightingCard,
    cause?: StateEffectType,
  ) => void;
}

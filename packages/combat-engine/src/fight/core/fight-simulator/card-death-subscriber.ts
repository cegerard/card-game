import { FightingCard } from '../cards/fighting-card';

export interface CardDeathSubscriber {
  notifyDeath: (card: FightingCard, killerCard?: FightingCard) => void;
}

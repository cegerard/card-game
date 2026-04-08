import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';

export interface CardDeathSubscriber {
  notifyDeath: (
    player: Player,
    card: FightingCard,
    killerCard?: FightingCard,
  ) => void;
}

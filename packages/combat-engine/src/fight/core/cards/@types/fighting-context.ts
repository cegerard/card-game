import { FightingCard } from '../fighting-card';
import { Player } from '../../player';

export type FightingContext = {
  sourcePlayer: Player;
  opponentPlayer: Player;
  killerCard?: FightingCard;
  lastAttacker?: FightingCard;
};

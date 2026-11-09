import { FightingCard } from '../fighting-card';
import { Player } from '../../player';

export type FightingContext = {
  sourcePlayer: Player;
  opponentPlayer: Player;
  killerCard?: FightingCard;
  lastAttacker?: FightingCard;
  /** The card the attack that fired `after-attack` was aimed at. */
  attackTarget?: FightingCard;
};

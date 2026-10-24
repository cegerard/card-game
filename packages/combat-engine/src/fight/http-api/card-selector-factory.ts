import { CardSelectorStrategy } from './dto/fight-data.dto';
import { CardSelector } from '../core/fight-simulator/card-selectors/card-selector';
import { PlayerByPlayerCardSelector } from '../core/fight-simulator/card-selectors/player-by-player';
import { SpeedWeightedCardSelector } from '../core/fight-simulator/card-selectors/speed-weighted-card-pool';
import { Player } from '../core/player';

export function buildCardSelector(
  cardSelectorStrategy: CardSelectorStrategy,
  player1: Player,
  player2: Player,
): CardSelector {
  const STRATEGY_MAP = {
    [CardSelectorStrategy.PLAYER_BY_PLAYER]: new PlayerByPlayerCardSelector(
      player1,
      player2,
    ),
    [CardSelectorStrategy.SPEED_WEIGHTED]: new SpeedWeightedCardSelector(
      player1,
      player2,
    ),
  };

  const result = STRATEGY_MAP[cardSelectorStrategy];
  if (!result)
    throw new Error(`Unknown card selector strategy: ${cardSelectorStrategy}`);
  return result;
}

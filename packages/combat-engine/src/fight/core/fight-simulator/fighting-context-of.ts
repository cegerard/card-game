import { FightingCard } from '../cards/fighting-card';
import { FightingContext } from '../cards/@types/fighting-context';
import { Player } from '../player';

/** The board as `card` sees it: its own team and the opposing one. */
export function fightingContextOf(
  card: FightingCard,
  player1: Player,
  player2: Player,
): FightingContext {
  const [sourcePlayer, opponentPlayer] = player1.ownCard(card)
    ? [player1, player2]
    : [player2, player1];

  return { sourcePlayer, opponentPlayer };
}

import { Fight } from '../fight-simulator/fight';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';

describe('fight start', () => {
  const hero = createFightingCard({ id: 'hero', health: 300 });
  const ally = createFightingCard({ id: 'ally', health: 120 });
  const enemy = createFightingCard({ id: 'enemy', health: 220 });
  const player1 = new Player('Player 1', [hero, ally]);
  const player2 = new Player('Player 2', [enemy]);
  const result = new Fight(
    player1,
    player2,
    new PlayerByPlayerCardSelector(player1, player2),
  ).start();

  it('opens the report with every card and its maximum health', () => {
    expect(result[0]).toEqual({
      kind: 'fight_start',
      cards: [
        { card: hero.identityInfo, maxHealth: 300 },
        { card: ally.identityInfo, maxHealth: 120 },
        { card: enemy.identityInfo, maxHealth: 220 },
      ],
    });
  });
});

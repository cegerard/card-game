import { Player } from '../../player';
import { FightStart } from '../../trigger/fight-start';
import { Fight } from '../fight';
import { PlayerByPlayerCardSelector } from '../card-selectors/player-by-player';
import {
  executioner,
  fragileWithLastBreath,
  healingSources,
} from '../../../../../test/helpers/reactive-kill';

describe('Fight kill by a fight-start attack', () => {
  it('runs the self-death skills of the card killed', () => {
    const player1 = new Player('p1', [executioner(new FightStart())]);
    const player2 = new Player('p2', [fragileWithLastBreath()]);
    const result = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    ).start();

    expect(healingSources(Object.values(result) as any)).toContain('victim');
  });
});

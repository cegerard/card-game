import { Player } from '../../player';
import { FightStart } from '../../trigger/fight-start';
import { Fight } from '../fight';
import { PlayerByPlayerCardSelector } from '../card-selectors/player-by-player';
import {
  executioner,
  fragileWithLastBreath,
  attackers,
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

describe('Fight start skills of a card killed by an earlier fight-start attack', () => {
  it('does not launch them', () => {
    const player1 = new Player('p1', [executioner(new FightStart())]);
    const player2 = new Player('p2', [
      executioner(new FightStart(), 'late-bloomer', 1),
    ]);
    const result = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    ).start();

    expect(attackers(Object.values(result) as any)).not.toContain(
      'late-bloomer',
    );
  });
});

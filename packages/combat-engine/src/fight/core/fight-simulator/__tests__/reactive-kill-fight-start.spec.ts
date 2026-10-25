import { Player } from '../../player';
import { FightStart } from '../../trigger/fight-start';
import { Fight } from '../fight';
import { PlayerByPlayerCardSelector } from '../card-selectors/player-by-player';
import { Step } from '../@types/step';
import {
  attackers,
  executioner,
  fragileWithLastBreath,
  healingSources,
} from '../../../../../test/helpers/reactive-kill';
import { FightingCard } from '../../cards/fighting-card';

const fightSteps = (card1: FightingCard, card2: FightingCard): Step[] => {
  const player1 = new Player('p1', [card1]);
  const player2 = new Player('p2', [card2]);
  const fight = new Fight(
    player1,
    player2,
    new PlayerByPlayerCardSelector(player1, player2),
  );

  return Object.values(fight.start()) as Step[];
};

describe('Fight kill by a fight-start attack', () => {
  it('runs the self-death skills of the card killed', () => {
    const steps = fightSteps(
      executioner(new FightStart()),
      fragileWithLastBreath(),
    );

    expect(healingSources(steps)).toContain('victim');
  });
});

describe('Fight start skills of a card killed by an earlier fight-start attack', () => {
  it('does not launch them', () => {
    const steps = fightSteps(
      executioner(new FightStart()),
      executioner(new FightStart(), 'late-bloomer', 1),
    );

    expect(attackers(steps)).not.toContain('late-bloomer');
  });
});

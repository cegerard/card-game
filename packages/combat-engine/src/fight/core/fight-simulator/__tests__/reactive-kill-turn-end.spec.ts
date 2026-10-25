import { Player } from '../../player';
import { TurnEnd } from '../../trigger/turn-end';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import {
  executioner,
  fragileWithLastBreath,
  healingSources,
} from '../../../../../test/helpers/reactive-kill';

describe('TurnManager kill by a turn-end attack', () => {
  it('runs the self-death skills of the card killed', () => {
    const killer = executioner(new TurnEnd());
    const victim = fragileWithLastBreath();
    const player1 = new Player('p1', [killer]);
    const player2 = new Player('p2', [victim]);
    const endEventProcessor = new EndEventProcessor(player1, player2);
    const handler = new DeathSkillHandler(player1, player2, endEventProcessor);
    const turnManager = new TurnManager(
      player1,
      player2,
      { onCardDeath: [handler] },
      handler,
      endEventProcessor,
    );

    expect(healingSources(turnManager.endTurn([killer]))).toContain('victim');
  });
});

import { Player } from '../../player';
import { TurnEnd } from '../../trigger/turn-end';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { FightingCard } from '../../cards/fighting-card';
import { Step } from '../@types/step';
import {
  executioner,
  fragileWithLastBreath,
  healingSources,
} from '../../../../../test/helpers/reactive-kill';

describe('TurnManager kill by a turn-end attack', () => {
  let killer: FightingCard;
  let turnManager: TurnManager;

  beforeEach(() => {
    killer = executioner(new TurnEnd());
    const player1 = new Player('p1', [killer]);
    const player2 = new Player('p2', [fragileWithLastBreath()]);
    const endEventProcessor = new EndEventProcessor(player1, player2);
    const handler = new DeathSkillHandler(player1, player2, endEventProcessor);
    turnManager = new TurnManager(
      player1,
      player2,
      { onCardDeath: [handler] },
      handler,
      endEventProcessor,
    );
  });

  it('runs the self-death skills of the card killed', () => {
    const steps: Step[] = turnManager.endTurn([killer]);

    expect(healingSources(steps)).toContain('victim');
  });
});

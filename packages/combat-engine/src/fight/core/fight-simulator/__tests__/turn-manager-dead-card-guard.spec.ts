import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { StepKind } from '../@types/step';

describe('TurnManager dead card guard', () => {
  describe('when a card is already dead at start of endTurn', () => {
    let card: ReturnType<typeof createFightingCard>;
    let turnManager: TurnManager;

    beforeEach(() => {
      card = createFightingCard({ health: 0 });
      const player1 = new Player('p1', [card]);
      const player2 = new Player('p2', [createFightingCard()]);
      const endEventProcessor = new EndEventProcessor(player1, player2);
      const deathSkillHandler = new DeathSkillHandler(
        player1,
        player2,
        endEventProcessor,
      );
      turnManager = new TurnManager(
        player1,
        player2,
        { onCardDeath: [deathSkillHandler] },
        deathSkillHandler,
        endEventProcessor,
      );
    });

    it('does not emit any step for the dead card', () => {
      const steps = turnManager.endTurn([card]);

      expect(steps).toHaveLength(0);
    });
  });

  describe('when a card with a turn-end skill is already dead at start of endTurn', () => {
    let card: ReturnType<typeof createFightingCard>;
    let turnManager: TurnManager;

    beforeEach(() => {
      card = createFightingCard({
        health: 0,
        skills: {
          others: [
            {
              buffType: 'attack' as const,
              buffRate: 0.1,
              duration: 2,
              trigger: 'turn-end',
              targetingStrategy: 'self',
            },
          ],
        },
      });
      const player1 = new Player('p1', [card]);
      const player2 = new Player('p2', [createFightingCard()]);
      const endEventProcessor = new EndEventProcessor(player1, player2);
      const deathSkillHandler = new DeathSkillHandler(
        player1,
        player2,
        endEventProcessor,
      );
      turnManager = new TurnManager(
        player1,
        player2,
        { onCardDeath: [deathSkillHandler] },
        deathSkillHandler,
        endEventProcessor,
      );
    });

    it('does not emit a buff step for the dead card', () => {
      const steps = turnManager.endTurn([card]);

      expect(steps.find((s) => s.kind === StepKind.Buff)).toBeUndefined();
    });

    it('does not emit a dead status_change step', () => {
      const steps = turnManager.endTurn([card]);

      expect(
        steps.find((s) => s.kind === StepKind.StatusChange),
      ).toBeUndefined();
    });
  });
});

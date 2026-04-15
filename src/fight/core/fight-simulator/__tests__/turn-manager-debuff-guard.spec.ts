import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { StepKind } from '../@types/step';

describe('TurnManager debuff guard', () => {
  describe('when a debuff skill produces empty results', () => {
    let card: ReturnType<typeof createFightingCard>;
    let turnManager: TurnManager;

    beforeEach(() => {
      card = createFightingCard({
        id: 'card-1',
        attack: 100,
        health: 5000,
        skills: {
          others: [
            {
              debuffType: 'attack' as const,
              debuffRate: 0.2,
              duration: 2,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              activationCondition: { id: 'never', evaluate: () => false },
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

    it('does not emit a debuff step', () => {
      const steps = turnManager.endTurn([card]);

      expect(steps.find((s) => s.kind === StepKind.Debuff)).toBeUndefined();
    });
  });
});

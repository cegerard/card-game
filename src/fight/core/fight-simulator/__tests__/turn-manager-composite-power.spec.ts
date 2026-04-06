import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { StepKind } from '../@types/step';
import { BuffReport } from '../@types/buff-report';
import { HealingReport } from '../@types/healing-report';

describe('TurnManager composite power', () => {
  describe('grouped buff+healing skills with powerId', () => {
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
              buffType: 'attack',
              buffRate: 0.2,
              duration: 3,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              powerId: 'rage',
            },
            {
              effectRate: 0.1,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              powerId: 'rage',
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

    it('produces a buff step with powerId', () => {
      const steps = turnManager.endTurn([card]);
      const buffStep = steps.find(
        (s) => s.kind === StepKind.Buff,
      ) as BuffReport;

      expect(buffStep?.powerId).toBe('rage');
    });

    it('produces a healing step with powerId', () => {
      card.addRealDamage(100);
      const steps = turnManager.endTurn([card]);
      const healingStep = steps.find(
        (s) => s.kind === StepKind.Healing,
      ) as HealingReport;

      expect(healingStep?.powerId).toBe('rage');
    });
  });
});

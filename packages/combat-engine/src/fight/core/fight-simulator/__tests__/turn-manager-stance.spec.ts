import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { StepKind } from '../@types/step';

const STANCE = 'forteresse-des-ages';

function buildTurnManager(card) {
  const player1 = new Player('p1', [card]);
  const player2 = new Player('p2', [createFightingCard()]);
  const endEventProcessor = new EndEventProcessor(player1, player2);
  const deathSkillHandler = new DeathSkillHandler(
    player1,
    player2,
    endEventProcessor,
  );
  return new TurnManager(
    player1,
    player2,
    { onCardDeath: [deathSkillHandler] },
    deathSkillHandler,
    endEventProcessor,
  );
}

describe('TurnManager stance duration', () => {
  let card;
  let manager;

  beforeEach(() => {
    card = createFightingCard({ accuracy: 0, agility: 0 });
    card.activateStance(STANCE, 1);
    manager = buildTurnManager(card);
  });

  describe('while the stance still runs', () => {
    it('emits no stance_ended step', () => {
      const steps = manager.endTurn([card]);

      expect(steps.some((s) => s.kind === StepKind.StanceEnded)).toBe(false);
    });

    it('keeps the stance on the card', () => {
      manager.endTurn([card]);

      expect(card.hasStance(STANCE)).toBe(true);
    });
  });

  describe('when the stance runs out', () => {
    let steps;

    beforeEach(() => {
      manager.endTurn([card]);
      steps = manager.endTurn([card]);
    });

    it('emits a stance_ended step', () => {
      expect(steps.some((s) => s.kind === StepKind.StanceEnded)).toBe(true);
    });

    it('names the stance that ended', () => {
      const ended = steps.find((s) => s.kind === StepKind.StanceEnded);

      expect(ended.name).toBe(STANCE);
    });

    it('drops the stance from the card', () => {
      expect(card.hasStance(STANCE)).toBe(false);
    });
  });
});

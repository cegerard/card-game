import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { Step, StepKind } from '../@types/step';

function buildTurnManager(card: FightingCard): TurnManager {
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

describe('TurnManager regeneration', () => {
  describe('on a wounded card carrying the stat', () => {
    let card: FightingCard;
    let steps: Step[];

    beforeEach(() => {
      card = createFightingCard({ health: 1000, regeneration: 55 });
      card.addRealDamage(500);
      steps = buildTurnManager(card).endTurn([card]);
    });

    it('emits a regenerated step', () => {
      expect(steps.find((s) => s.kind === StepKind.Regenerated)).toBeDefined();
    });

    it('reports the healed points', () => {
      const step = steps.find((s) => s.kind === StepKind.Regenerated);

      expect(step).toMatchObject({ healed: 55, remainingHealth: 555 });
    });

    it('restores the health', () => {
      expect(card.actualHealth).toBe(555);
    });
  });

  describe('on a card at full health', () => {
    it('emits no regenerated step', () => {
      const card = createFightingCard({ health: 1000, regeneration: 55 });
      const steps = buildTurnManager(card).endTurn([card]);

      expect(steps.some((s) => s.kind === StepKind.Regenerated)).toBe(false);
    });
  });

  describe('on a card without the stat', () => {
    it('emits no regenerated step', () => {
      const card = createFightingCard({ health: 1000 });
      card.addRealDamage(500);
      const steps = buildTurnManager(card).endTurn([card]);

      expect(steps.some((s) => s.kind === StepKind.Regenerated)).toBe(false);
    });
  });
});

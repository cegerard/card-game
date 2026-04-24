import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';
import { TurnManager } from '../turn-manager';
import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { StepKind } from '../@types/step';

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

describe('TurnManager buff/debuff expiry steps', () => {
  describe('when a buff expires at end of turn', () => {
    let card;
    let steps;

    beforeEach(() => {
      card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyBuff('attack', 0.2, 1);
      steps = buildTurnManager(card).endTurn([card]);
    });

    it('emits a buff_expired step', () => {
      expect(steps.some((s) => s.kind === StepKind.BuffExpired)).toBe(true);
    });

    it('buff_expired step references the correct card', () => {
      const step = steps.find((s) => s.kind === StepKind.BuffExpired) as any;

      expect(step.card.id).toBe(card.id);
    });

    it('buff_expired step lists the expired buff kind', () => {
      const step = steps.find((s) => s.kind === StepKind.BuffExpired) as any;

      expect(step.expired[0].kind).toBe('attack');
    });
  });

  describe('when a buff is still active', () => {
    it('does not emit a buff_expired step', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyBuff('attack', 0.2, 2);
      const steps = buildTurnManager(card).endTurn([card]);

      expect(
        steps.find((s) => s.kind === StepKind.BuffExpired),
      ).toBeUndefined();
    });
  });

  describe('when a debuff expires at end of turn', () => {
    let card;
    let steps;

    beforeEach(() => {
      card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyDebuff('attack', 0.2, 1);
      steps = buildTurnManager(card).endTurn([card]);
    });

    it('emits a debuff_expired step', () => {
      expect(steps.some((s) => s.kind === StepKind.DebuffExpired)).toBe(true);
    });

    it('debuff_expired step references the correct card', () => {
      const step = steps.find((s) => s.kind === StepKind.DebuffExpired) as any;

      expect(step.card.id).toBe(card.id);
    });

    it('debuff_expired step lists the expired debuff kind', () => {
      const step = steps.find((s) => s.kind === StepKind.DebuffExpired) as any;

      expect(step.expired[0].kind).toBe('attack');
    });
  });

  describe('when a debuff is still active', () => {
    it('does not emit a debuff_expired step', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyDebuff('attack', 0.2, 2);
      const steps = buildTurnManager(card).endTurn([card]);

      expect(
        steps.find((s) => s.kind === StepKind.DebuffExpired),
      ).toBeUndefined();
    });
  });

  describe('when card has no buffs or debuffs', () => {
    it('does not emit buff_expired or debuff_expired steps', () => {
      const card = createFightingCard({});
      const steps = buildTurnManager(card).endTurn([card]);

      expect(
        steps.find((s) => s.kind === StepKind.BuffExpired),
      ).toBeUndefined();
      expect(
        steps.find((s) => s.kind === StepKind.DebuffExpired),
      ).toBeUndefined();
    });
  });
});

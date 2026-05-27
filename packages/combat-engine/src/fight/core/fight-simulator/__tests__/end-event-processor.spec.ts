import { EndEventProcessor } from '../end-event-processor';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { StepKind } from '../@types/step';

describe('EndEventProcessor.processEndEvent()', () => {
  const source = { id: 'src', name: 'Source', deckIdentity: '' };

  describe('when cards hold matching event-bound buffs', () => {
    let processor: EndEventProcessor;
    let card;

    beforeEach(() => {
      card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyBuff('attack', 0.4, Infinity, 'lions-end');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard({})]);
      processor = new EndEventProcessor(player1, player2);
    });

    it('produces a BuffRemoved step', () => {
      const steps = processor.processEndEvent('lions-end', source);

      expect(steps[0].kind).toBe(StepKind.BuffRemoved);
    });

    it('includes the eventName in the step', () => {
      const steps = processor.processEndEvent('lions-end', source);

      expect((steps[0] as any).eventName).toBe('lions-end');
    });

    it('includes the source in the step', () => {
      const steps = processor.processEndEvent('lions-end', source);

      expect((steps[0] as any).source).toEqual(source);
    });

    it('includes removed buff info in the step', () => {
      const steps = processor.processEndEvent('lions-end', source);

      expect((steps[0] as any).removed).toHaveLength(1);
    });
  });

  describe('when no card holds a matching event-bound buff', () => {
    it('returns empty array', () => {
      const player1 = new Player('P1', [createFightingCard({})]);
      const player2 = new Player('P2', [createFightingCard({})]);
      const processor = new EndEventProcessor(player1, player2);

      const steps = processor.processEndEvent('lions-end', source);

      expect(steps).toHaveLength(0);
    });
  });

  describe('when cards hold matching event-bound debuffs', () => {
    let processor: EndEventProcessor;
    let card;

    beforeEach(() => {
      card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyDebuff('attack', 0.4, Infinity, 'lions-end');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard({})]);
      processor = new EndEventProcessor(player1, player2);
    });

    it('produces a DebuffRemoved step', () => {
      const steps = processor.processEndEvent('lions-end', source);

      expect(steps.some((s) => s.kind === StepKind.DebuffRemoved)).toBe(true);
    });

    it('includes the eventName in the DebuffRemoved step', () => {
      const steps = processor.processEndEvent('lions-end', source);
      const step = steps.find((s) => s.kind === StepKind.DebuffRemoved) as any;

      expect(step.eventName).toBe('lions-end');
    });

    it('includes removed debuff info in the step', () => {
      const steps = processor.processEndEvent('lions-end', source);
      const step = steps.find((s) => s.kind === StepKind.DebuffRemoved) as any;

      expect(step.removed).toHaveLength(1);
    });

    it('removes the debuff from the card', () => {
      processor.processEndEvent('lions-end', source);

      expect(card.actualAttack).toBe(100);
    });
  });

  describe('when buffs span multiple cards', () => {
    it('produces one step aggregating all removed buffs', () => {
      const card1 = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      const card2 = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card1.applyBuff('attack', 0.4, Infinity, 'lions-end');
      card2.applyBuff('attack', 0.4, Infinity, 'lions-end');
      const player1 = new Player('P1', [card1]);
      const player2 = new Player('P2', [card2]);
      const processor = new EndEventProcessor(player1, player2);

      const steps = processor.processEndEvent('lions-end', source);

      expect((steps[0] as any).removed).toHaveLength(2);
    });
  });
});

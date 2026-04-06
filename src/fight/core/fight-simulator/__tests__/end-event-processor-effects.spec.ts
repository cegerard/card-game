import { EndEventProcessor } from '../end-event-processor';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { StepKind } from '../@types/step';
import { CardStateBurned } from '../../cards/@types/state/card-state-burned';
import { CardStatePoisoned } from '../../cards/@types/state/card-state-poisoned';

describe('EndEventProcessor.processEndEvent() with effects', () => {
  const source = { id: 'src', name: 'Source', deckIdentity: '' };

  describe('when a card has an event-bound burn effect', () => {
    let processor: EndEventProcessor;

    beforeEach(() => {
      const card = createFightingCard({});
      card.setState(new CardStateBurned(2, 3, 80, 'fire-end'));
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard({})]);
      processor = new EndEventProcessor(player1, player2);
    });

    it('produces an EffectRemoved step', () => {
      const steps = processor.processEndEvent('fire-end', source);

      expect(steps.some((s) => s.kind === StepKind.EffectRemoved)).toBe(true);
    });

    it('includes the eventName in the step', () => {
      const steps = processor.processEndEvent('fire-end', source);
      const effectStep = steps.find(
        (s) => s.kind === StepKind.EffectRemoved,
      ) as any;

      expect(effectStep.eventName).toBe('fire-end');
    });

    it('includes removed effect info', () => {
      const steps = processor.processEndEvent('fire-end', source);
      const effectStep = steps.find(
        (s) => s.kind === StepKind.EffectRemoved,
      ) as any;

      expect(effectStep.removed).toHaveLength(1);
    });

    it('includes the effect type in removed info', () => {
      const steps = processor.processEndEvent('fire-end', source);
      const effectStep = steps.find(
        (s) => s.kind === StepKind.EffectRemoved,
      ) as any;

      expect(effectStep.removed[0].effectType).toBe('burn');
    });
  });

  describe('when multiple cards have event-bound effects', () => {
    let processor: EndEventProcessor;

    beforeEach(() => {
      const card1 = createFightingCard({});
      const card2 = createFightingCard({});
      card1.setState(new CardStateBurned(1, 3, 50, 'purge'));
      card2.setState(new CardStatePoisoned(1, 3, 30, 'purge'));
      const player1 = new Player('P1', [card1]);
      const player2 = new Player('P2', [card2]);
      processor = new EndEventProcessor(player1, player2);
    });

    it('aggregates all removed effects into one step', () => {
      const steps = processor.processEndEvent('purge', source);
      const effectStep = steps.find(
        (s) => s.kind === StepKind.EffectRemoved,
      ) as any;

      expect(effectStep.removed).toHaveLength(2);
    });
  });

  describe('when no card has a matching event-bound effect', () => {
    it('does not produce an EffectRemoved step', () => {
      const player1 = new Player('P1', [createFightingCard({})]);
      const player2 = new Player('P2', [createFightingCard({})]);
      const processor = new EndEventProcessor(player1, player2);

      const steps = processor.processEndEvent('fire-end', source);

      expect(steps.every((s) => s.kind !== StepKind.EffectRemoved)).toBe(true);
    });
  });
});

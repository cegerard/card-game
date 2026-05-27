import { EndEventProcessor } from '../end-event-processor';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import {
  BuffRemovedReport,
  DebuffRemovedReport,
} from '../@types/alteration-removed-report';
import { StepKind } from '../@types/step';

const source = { id: 'src', name: 'Source', deckIdentity: '' };

describe('EndEventProcessor composite power', () => {
  describe('removes all buffs with matching terminationEvent and propagates powerId', () => {
    let card: ReturnType<typeof createFightingCard>;
    let processor: EndEventProcessor;

    beforeEach(() => {
      card = createFightingCard({ attack: 100, defense: 100 });
      card.applyBuff('attack', 0.3, Infinity, 'rage-end', 'rage-power');
      card.applyBuff('defense', 0.2, Infinity, 'rage-end', 'rage-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      processor = new EndEventProcessor(player1, player2);
    });

    it('includes powerId in the BuffRemoved step', () => {
      const steps = processor.processEndEvent('rage-end', source, 'rage-power');
      const step = steps[0] as BuffRemovedReport;

      expect(step.powerId).toBe('rage-power');
    });

    it('removes both buffs in a single step', () => {
      const steps = processor.processEndEvent('rage-end', source, 'rage-power');
      const step = steps[0] as BuffRemovedReport;

      expect(step.removed).toHaveLength(2);
    });
  });

  describe('removes composite debuff power with powerId', () => {
    let card: ReturnType<typeof createFightingCard>;
    let processor: EndEventProcessor;

    beforeEach(() => {
      card = createFightingCard({ attack: 100 });
      card.applyDebuff('attack', 0.2, Infinity, 'curse-end', 'curse-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      processor = new EndEventProcessor(player1, player2);
    });

    it('emits a DebuffRemoved step', () => {
      const steps = processor.processEndEvent(
        'curse-end',
        source,
        'curse-power',
      );

      expect(steps[0].kind).toBe(StepKind.DebuffRemoved);
    });

    it('includes powerId in the DebuffRemoved step', () => {
      const steps = processor.processEndEvent(
        'curse-end',
        source,
        'curse-power',
      );
      const step = steps[0] as DebuffRemovedReport;

      expect(step.powerId).toBe('curse-power');
    });

    it('includes the correct source card in the DebuffRemoved step', () => {
      const steps = processor.processEndEvent(
        'curse-end',
        source,
        'curse-power',
      );
      const step = steps[0] as DebuffRemovedReport;

      expect(step.source.id).toBe(source.id);
    });

    it('includes the removed debuff in the step', () => {
      const steps = processor.processEndEvent(
        'curse-end',
        source,
        'curse-power',
      );
      const step = steps[0] as DebuffRemovedReport;

      expect(step.removed).toHaveLength(1);
    });
  });

  describe('two composite powers on same card', () => {
    let card: ReturnType<typeof createFightingCard>;
    let processor: EndEventProcessor;

    beforeEach(() => {
      card = createFightingCard({ attack: 100, defense: 100 });
      card.applyBuff('attack', 0.3, Infinity, 'rage-end', 'rage-power');
      card.applyBuff('defense', 0.2, Infinity, 'shield-end', 'shield-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      processor = new EndEventProcessor(player1, player2);
    });

    it('expiring one does not affect the other', () => {
      processor.processEndEvent('rage-end', source, 'rage-power');
      const steps = processor.processEndEvent(
        'shield-end',
        source,
        'shield-power',
      );
      const step = steps[0] as BuffRemovedReport;

      expect(step.removed).toHaveLength(1);
    });

    it('the remaining power buff is still active after the first expires', () => {
      processor.processEndEvent('rage-end', source, 'rage-power');

      expect(card.actualDefense).toBeGreaterThan(100);
    });
  });
});

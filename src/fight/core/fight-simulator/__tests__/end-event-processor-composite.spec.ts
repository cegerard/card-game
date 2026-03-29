import { EndEventProcessor } from '../end-event-processor';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { BuffRemovedReport } from '../@types/buff-removed-report';

describe('EndEventProcessor composite power', () => {
  const source = { id: 'src', name: 'Source', deckIdentity: '' };

  describe('removes all buffs with matching terminationEvent and propagates powerId', () => {
    it('includes powerId in the BuffRemoved step', () => {
      const card = createFightingCard({ attack: 100 });
      card.applyBuff('attack', 0.3, Infinity, 'rage-end', 'rage-power');
      card.applyBuff('defense', 0.2, Infinity, 'rage-end', 'rage-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      const processor = new EndEventProcessor(player1, player2);

      const steps = processor.processEndEvent('rage-end', source, 'rage-power');
      const step = steps[0] as BuffRemovedReport;

      expect(step.powerId).toBe('rage-power');
    });

    it('removes both buffs in a single step', () => {
      const card = createFightingCard({ attack: 100, defense: 100 });
      card.applyBuff('attack', 0.3, Infinity, 'rage-end', 'rage-power');
      card.applyBuff('defense', 0.2, Infinity, 'rage-end', 'rage-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      const processor = new EndEventProcessor(player1, player2);

      const steps = processor.processEndEvent('rage-end', source, 'rage-power');
      const step = steps[0] as BuffRemovedReport;

      expect(step.removed).toHaveLength(2);
    });
  });

  describe('two composite powers on same card', () => {
    it('expiring one does not affect the other', () => {
      const card = createFightingCard({ attack: 100, defense: 100 });
      card.applyBuff('attack', 0.3, Infinity, 'rage-end', 'rage-power');
      card.applyBuff('defense', 0.2, Infinity, 'shield-end', 'shield-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      const processor = new EndEventProcessor(player1, player2);

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
      const card = createFightingCard({ attack: 100, defense: 100 });
      card.applyBuff('attack', 0.3, Infinity, 'rage-end', 'rage-power');
      card.applyBuff('defense', 0.2, Infinity, 'shield-end', 'shield-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      const processor = new EndEventProcessor(player1, player2);

      processor.processEndEvent('rage-end', source, 'rage-power');

      expect(card.actualDefense).toBeGreaterThan(100);
    });
  });
});

import { EndEventProcessor } from '../end-event-processor';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { StepKind } from '../@types/step';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { TargetingRevertedReport } from '../@types/targeting-override-report';

describe('EndEventProcessor targeting revert', () => {
  const source = { id: 'src', name: 'Source', deckIdentity: '' };

  describe('when a card has a targeting override matching the event', () => {
    it('emits a TargetingReverted step', () => {
      const card = createFightingCard({
        id: 'card-1',
        skills: { simpleAttack: { targetingStrategy: 'position-based' } },
      });
      card.overrideAttackTargeting(new TargetedAll(), 'rage-end', 'rage-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      const processor = new EndEventProcessor(player1, player2);

      const steps = processor.processEndEvent('rage-end', source, 'rage-power');
      const revertStep = steps.find(
        (s) => s.kind === StepKind.TargetingReverted,
      ) as TargetingRevertedReport;

      expect(revertStep).toBeDefined();
    });

    it('includes the reverted strategy id', () => {
      const card = createFightingCard({
        id: 'card-1',
        skills: { simpleAttack: { targetingStrategy: 'position-based' } },
      });
      card.overrideAttackTargeting(new TargetedAll(), 'rage-end', 'rage-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      const processor = new EndEventProcessor(player1, player2);

      const steps = processor.processEndEvent('rage-end', source, 'rage-power');
      const revertStep = steps.find(
        (s) => s.kind === StepKind.TargetingReverted,
      ) as TargetingRevertedReport;

      expect(revertStep.revertedStrategy).toBe('all');
    });

    it('includes the restored strategy id', () => {
      const card = createFightingCard({
        id: 'card-1',
        skills: { simpleAttack: { targetingStrategy: 'position-based' } },
      });
      card.overrideAttackTargeting(new TargetedAll(), 'rage-end', 'rage-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      const processor = new EndEventProcessor(player1, player2);

      const steps = processor.processEndEvent('rage-end', source, 'rage-power');
      const revertStep = steps.find(
        (s) => s.kind === StepKind.TargetingReverted,
      ) as TargetingRevertedReport;

      expect(revertStep.restoredStrategy).toBe('from-position');
    });

    it('propagates powerId in the revert step', () => {
      const card = createFightingCard({ id: 'card-1' });
      card.overrideAttackTargeting(new TargetedAll(), 'rage-end', 'rage-power');
      const player1 = new Player('P1', [card]);
      const player2 = new Player('P2', [createFightingCard()]);
      const processor = new EndEventProcessor(player1, player2);

      const steps = processor.processEndEvent('rage-end', source, 'rage-power');
      const revertStep = steps.find(
        (s) => s.kind === StepKind.TargetingReverted,
      ) as TargetingRevertedReport;

      expect(revertStep.powerId).toBe('rage-power');
    });
  });

  describe('when no card has a matching targeting override', () => {
    it('does not emit a TargetingReverted step', () => {
      const player1 = new Player('P1', [createFightingCard()]);
      const player2 = new Player('P2', [createFightingCard()]);
      const processor = new EndEventProcessor(player1, player2);

      const steps = processor.processEndEvent('unknown-event', source);

      expect(
        steps.filter((s) => s.kind === StepKind.TargetingReverted),
      ).toHaveLength(0);
    });
  });
});

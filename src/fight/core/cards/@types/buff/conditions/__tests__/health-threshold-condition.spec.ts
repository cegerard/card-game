import { HealthThresholdCondition } from '../health-threshold-condition';
import { createFightingCard } from '../../../../../../../../test/helpers/fighting-card';
import { Player } from '../../../../../player';

describe('HealthThresholdCondition', () => {
  describe('with operator "above" (default)', () => {
    const condition = new HealthThresholdCondition(0.5);

    describe('when health ratio is above threshold', () => {
      let result: boolean;

      beforeEach(() => {
        const source = createFightingCard({ health: 100 });
        const context = {
          sourcePlayer: new Player('P1', [source]),
          opponentPlayer: new Player('P2', []),
        };
        result = condition.evaluate(source, context);
      });

      it('returns true', () => {
        expect(result).toBe(true);
      });
    });

    describe('when health ratio is below threshold', () => {
      let result: boolean;

      beforeEach(() => {
        const source = createFightingCard({ health: 100 });
        source.addRealDamage(60);
        const context = {
          sourcePlayer: new Player('P1', [source]),
          opponentPlayer: new Player('P2', []),
        };
        result = condition.evaluate(source, context);
      });

      it('returns false', () => {
        expect(result).toBe(false);
      });
    });
  });

  describe('with operator "below"', () => {
    const condition = new HealthThresholdCondition(0.5, 'below');

    describe('when health ratio is below threshold', () => {
      let result: boolean;

      beforeEach(() => {
        const source = createFightingCard({ health: 100 });
        source.addRealDamage(60);
        const context = {
          sourcePlayer: new Player('P1', [source]),
          opponentPlayer: new Player('P2', []),
        };
        result = condition.evaluate(source, context);
      });

      it('returns true', () => {
        expect(result).toBe(true);
      });
    });

    describe('when health ratio is above threshold', () => {
      let result: boolean;

      beforeEach(() => {
        const source = createFightingCard({ health: 100 });
        const context = {
          sourcePlayer: new Player('P1', [source]),
          opponentPlayer: new Player('P2', []),
        };
        result = condition.evaluate(source, context);
      });

      it('returns false', () => {
        expect(result).toBe(false);
      });
    });
  });
});

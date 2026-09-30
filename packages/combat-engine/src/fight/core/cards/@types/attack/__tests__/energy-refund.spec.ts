import { EnergyRefund } from '../energy-refund';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';

describe('EnergyRefund', () => {
  const refund = new EnergyRefund(10, 20);
  const scythra = createFightingCard({ accuracy: 95 });

  it('refunds when the accuracy beats the target agility by more than the margin', () => {
    const target = createFightingCard({ agility: 65 });

    expect(refund.amountFor(scythra, target)).toBe(10);
  });

  it('refunds nothing at the exact margin', () => {
    const target = createFightingCard({ agility: 75 });

    expect(refund.amountFor(scythra, target)).toBe(0);
  });

  it('refunds nothing without a target', () => {
    expect(refund.amountFor(scythra, undefined)).toBe(0);
  });

  it.each([
    ['amount', () => new EnergyRefund(0, 20)],
    ['minAccuracyMargin', () => new EnergyRefund(10, -1)],
  ])('rejects an invalid %s', (_field, build) => {
    expect(build).toThrow();
  });
});

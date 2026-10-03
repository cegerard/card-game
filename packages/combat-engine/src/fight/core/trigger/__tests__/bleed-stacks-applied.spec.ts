import { BleedStacksAppliedTrigger } from '../bleed-stacks-applied';

describe('BleedStacksAppliedTrigger', () => {
  let trigger: BleedStacksAppliedTrigger;

  beforeEach(() => {
    trigger = new BleedStacksAppliedTrigger(10);
  });

  it('does not fire below the threshold', () => {
    expect(trigger.isTriggered('bleed-stacks-applied:9')).toBe(false);
  });

  it('fires when the count reaches the threshold', () => {
    expect(trigger.isTriggered('bleed-stacks-applied:10')).toBe(true);
  });

  it('fires when the count jumps over the threshold', () => {
    expect(trigger.isTriggered('bleed-stacks-applied:12')).toBe(true);
  });

  it('fires only once', () => {
    trigger.isTriggered('bleed-stacks-applied:10');

    expect(trigger.isTriggered('bleed-stacks-applied:11')).toBe(false);
  });

  it('ignores an unrelated event', () => {
    expect(trigger.isTriggered('turn-end')).toBe(false);
  });

  it('rejects a threshold below one', () => {
    expect(() => new BleedStacksAppliedTrigger(0)).toThrow();
  });
});

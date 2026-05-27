import { SurvivedTrigger } from '../survived';

describe('SurvivedTrigger', () => {
  let trigger: SurvivedTrigger;

  beforeEach(() => {
    trigger = new SurvivedTrigger();
  });

  it('has id survived', () => {
    expect(trigger.id).toBe('survived');
  });

  it('matches survived event', () => {
    expect(trigger.isTriggered('survived')).toBe(true);
  });

  it('rejects other events', () => {
    expect(trigger.isTriggered('turn-end')).toBe(false);
  });

  it('rejects partial match', () => {
    expect(trigger.isTriggered('survived:extra')).toBe(false);
  });
});

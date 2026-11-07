import { DodgeTrigger } from '../dodge';

describe('DodgeTrigger', () => {
  const trigger = new DodgeTrigger('vespera');

  it('fires when the monitored card dodges', () => {
    expect(trigger.isTriggered('dodge-vespera')).toBe(true);
  });

  it('ignores the dodges of another card', () => {
    expect(trigger.isTriggered('dodge-aegis')).toBe(false);
  });
});

import { SelfDeathTrigger } from '../self-death';

describe('SelfDeathTrigger', () => {
  const trigger = new SelfDeathTrigger('aegis');

  it('fires on its own death event', () => {
    expect(trigger.isTriggered('self-death:aegis')).toBe(true);
  });

  it('ignores another card death', () => {
    expect(trigger.isTriggered('self-death:kaito')).toBe(false);
  });

  it('ignores the ally death of the same card', () => {
    expect(trigger.isTriggered('ally-death:aegis')).toBe(false);
  });

  it('ignores the enemy death of the same card', () => {
    expect(trigger.isTriggered('enemy-death:aegis')).toBe(false);
  });

  it('ignores an unrelated event', () => {
    expect(trigger.isTriggered('turn-end')).toBe(false);
  });
});

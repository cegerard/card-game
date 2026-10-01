import { EnemyBleedDeathTrigger } from '../enemy-bleed-death';

describe('EnemyBleedDeathTrigger', () => {
  const trigger = new EnemyBleedDeathTrigger();

  it('fires on an enemy bleed death', () => {
    expect(trigger.isTriggered('enemy-bleed-death')).toBe(true);
  });

  it('ignores any other enemy death', () => {
    expect(trigger.isTriggered('enemy-death:kaito')).toBe(false);
  });

  it('ignores an unrelated event', () => {
    expect(trigger.isTriggered('turn-end')).toBe(false);
  });
});

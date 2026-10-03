import { TurnStart } from '../turn-start';

describe('TurnStart', () => {
  const trigger = new TurnStart();

  it('fires at the start of its owner turn', () => {
    expect(trigger.isTriggered('turn-start')).toBe(true);
  });

  it('ignores the end of the turn', () => {
    expect(trigger.isTriggered('turn-end')).toBe(false);
  });
});

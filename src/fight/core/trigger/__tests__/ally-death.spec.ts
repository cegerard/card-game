import { AllyDeath } from '../ally-death';

describe('AllyDeath', () => {
  let trigger: AllyDeath;

  beforeEach(() => {
    trigger = new AllyDeath('warrior-01');
  });

  it('has id ally-death', () => {
    expect(trigger.id).toBe('ally-death');
  });

  it('matches ally-death:<targetCardId>', () => {
    expect(trigger.isTriggered('ally-death:warrior-01')).toBe(true);
  });

  it('rejects different card id', () => {
    expect(trigger.isTriggered('ally-death:mage-02')).toBe(false);
  });

  it('rejects other trigger', () => {
    expect(trigger.isTriggered('other-trigger')).toBe(false);
  });

  it('rejects partial match', () => {
    expect(trigger.isTriggered('ally-death')).toBe(false);
  });
});

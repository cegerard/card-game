import { EnemyDeath } from '../enemy-death';

describe('EnemyDeath', () => {
  let trigger: EnemyDeath;

  beforeEach(() => {
    trigger = new EnemyDeath('goblin-03');
  });

  it('has id enemy-death', () => {
    expect(trigger.id).toBe('enemy-death');
  });

  it('matches enemy-death:<targetCardId>', () => {
    expect(trigger.isTriggered('enemy-death:goblin-03')).toBe(true);
  });

  it('rejects different card id', () => {
    expect(trigger.isTriggered('enemy-death:orc-01')).toBe(false);
  });

  it('rejects other trigger', () => {
    expect(trigger.isTriggered('ally-death:goblin-03')).toBe(false);
  });

  it('rejects partial match', () => {
    expect(trigger.isTriggered('enemy-death')).toBe(false);
  });
});

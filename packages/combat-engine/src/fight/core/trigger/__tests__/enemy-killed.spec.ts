import { EnemyKilledTrigger } from '../enemy-killed';

describe('EnemyKilledTrigger', () => {
  it('fires on every kill without a threshold', () => {
    expect(new EnemyKilledTrigger().isTriggered('enemy-killed:0.9')).toBe(true);
  });

  it('fires on a victim that was under the threshold', () => {
    expect(new EnemyKilledTrigger(0.3).isTriggered('enemy-killed:0.2')).toBe(
      true,
    );
  });

  it('does not fire on a victim exactly at the threshold', () => {
    expect(new EnemyKilledTrigger(0.3).isTriggered('enemy-killed:0.3')).toBe(
      false,
    );
  });

  it('does not fire on a victim above the threshold', () => {
    expect(new EnemyKilledTrigger(0.3).isTriggered('enemy-killed:0.5')).toBe(
      false,
    );
  });

  it('ignores another event', () => {
    expect(new EnemyKilledTrigger().isTriggered('enemy-death:x')).toBe(false);
  });

  it.each([0, 1.2])('rejects a threshold of %s', (threshold) => {
    expect(() => new EnemyKilledTrigger(threshold)).toThrow(
      'EnemyKilledTrigger threshold must be in ]0, 1]',
    );
  });
});

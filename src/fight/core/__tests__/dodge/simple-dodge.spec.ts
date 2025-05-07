import { SimpleDodge } from '../../cards/behaviors/simple-dodge';

describe('dodge', () => {
  it('should dodge the attack', () => {
    const dodgeBehavior = new SimpleDodge();

    expect(dodgeBehavior.dodge(10, 5)).toBe(true);
  });

  it('should not dodge the attack', () => {
    const dodgeBehavior = new SimpleDodge();

    expect(dodgeBehavior.dodge(5, 10)).toBe(false);
  });
});

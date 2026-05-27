import { SimpleDodge } from '../../simple-dodge';

describe('dodge', () => {
  it('dodge the attack', () => {
    const dodgeBehavior = new SimpleDodge();

    expect(dodgeBehavior.dodge(10, 5)).toBe(true);
  });

  it('not dodge the attack', () => {
    const dodgeBehavior = new SimpleDodge();

    expect(dodgeBehavior.dodge(5, 10)).toBe(false);
  });
});

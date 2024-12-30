import { RandomDodge } from './random-dodge';

describe('dodge', () => {
  it('should dodge the attack', () => {
    const dodgeBehavior = new RandomDodge();

    expect(dodgeBehavior.dodge(10, 5)).toBe(true);
  });

  it('should not dodge the attack', () => {
    const dodgeBehavior = new RandomDodge();

    expect(dodgeBehavior.dodge(5, 10)).toBe(false);
  });
});

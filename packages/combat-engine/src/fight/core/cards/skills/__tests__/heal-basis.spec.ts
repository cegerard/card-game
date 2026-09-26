import { applyHealing, HealBasis } from '../heal-basis';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';

const SOURCE_ATTACK = 50;
const TARGET_MAX_HEALTH = 1000;
const RATE = 0.1;

describe('applyHealing', () => {
  let source: FightingCard;
  let target: FightingCard;

  beforeEach(() => {
    source = createFightingCard({ attack: SOURCE_ATTACK, health: 300 });
    target = createFightingCard({ attack: 999, health: TARGET_MAX_HEALTH });
    target.addRealDamage(900);
  });

  describe('on the source attack basis', () => {
    it('heals a share of the healer attack', () => {
      expect(applyHealing(source, target, RATE, 'source-attack')).toBe(5);
    });

    it('is the default basis', () => {
      expect(applyHealing(source, target, RATE)).toBe(5);
    });
  });

  describe('on the target max health basis', () => {
    it('heals a share of the receiver maximum health', () => {
      expect(applyHealing(source, target, RATE, 'target-max-health')).toBe(100);
    });

    it('ignores the healer attack', () => {
      const weakling = createFightingCard({ attack: 1, health: 300 });

      expect(applyHealing(weakling, target, RATE, 'target-max-health')).toBe(
        100,
      );
    });

    it('never heals past the maximum health', () => {
      target.heal(890);

      expect(applyHealing(source, target, RATE, 'target-max-health')).toBe(10);
    });
  });

  describe('on an unknown basis', () => {
    it('throws instead of falling back silently', () => {
      expect(() =>
        applyHealing(source, target, RATE, 'whatever' as HealBasis),
      ).toThrow('Unknown healing basis: whatever');
    });
  });
});

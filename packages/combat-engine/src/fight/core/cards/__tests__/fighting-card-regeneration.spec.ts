import { createFightingCard } from '../../../../../test/helpers/fighting-card';

describe('FightingCard regeneration', () => {
  describe('actualRegeneration', () => {
    it('defaults to 0 when the card declares none', () => {
      const card = createFightingCard({ health: 100 });

      expect(card.actualRegeneration).toBe(0);
    });

    it('reports the declared stat', () => {
      const card = createFightingCard({ health: 100, regeneration: 55 });

      expect(card.actualRegeneration).toBe(55);
    });

    it('takes buffs into account', () => {
      const card = createFightingCard({ health: 100, regeneration: 40 });
      card.applyBuff('regeneration', 0.15, 1);

      expect(card.actualRegeneration).toBe(46);
    });
  });

  describe('regenerate()', () => {
    it('restores the stat as raw health points', () => {
      const card = createFightingCard({ health: 100, regeneration: 20 });
      card.addRealDamage(50);

      expect(card.regenerate()).toBe(20);
    });

    it('brings the health back up', () => {
      const card = createFightingCard({ health: 100, regeneration: 20 });
      card.addRealDamage(50);
      card.regenerate();

      expect(card.actualHealth).toBe(70);
    });

    it('never heals past the maximum health', () => {
      const card = createFightingCard({ health: 100, regeneration: 20 });
      card.addRealDamage(5);

      expect(card.regenerate()).toBe(5);
    });

    it('heals nothing at full health', () => {
      const card = createFightingCard({ health: 100, regeneration: 20 });

      expect(card.regenerate()).toBe(0);
    });

    it('heals nothing without the stat', () => {
      const card = createFightingCard({ health: 100 });
      card.addRealDamage(50);

      expect(card.regenerate()).toBe(0);
    });

    it('heals nothing once the card is dead', () => {
      const card = createFightingCard({ health: 100, regeneration: 20 });
      card.addRealDamage(100);

      expect(card.regenerate()).toBe(0);
    });
  });
});

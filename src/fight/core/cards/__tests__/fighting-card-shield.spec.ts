import { createFightingCard } from '../../../../../test/helpers/fighting-card';

describe('FightingCard shield', () => {
  describe('applyShield()', () => {
    it('sets shield points to 30% of maxHealth', () => {
      const card = createFightingCard({ health: 400 });

      const shield = card.applyShield(0.3, 1);

      expect(shield.points).toBe(120);
    });

    it('sets shield duration', () => {
      const card = createFightingCard({ health: 400 });

      const shield = card.applyShield(0.3, 2);

      expect(shield.duration).toBe(2);
    });

    it('activates the shield', () => {
      const card = createFightingCard({ health: 400 });
      card.applyShield(0.3, 1);

      expect(card.shielded).toBe(true);
    });
  });

  describe('applyFinalDamage() with shield', () => {
    it('absorbs damage into the shield before health', () => {
      const card = createFightingCard({ health: 400, defense: 0 });
      card.applyShield(0.3, 1);

      const { damageToHealth, shieldAbsorbed } = card.applyFinalDamage(50);

      expect(shieldAbsorbed).toBe(50);
      expect(damageToHealth).toBe(0);
    });

    it('reduces health only for damage exceeding shield points', () => {
      const card = createFightingCard({ health: 400, defense: 0 });
      card.applyShield(0.3, 1);

      const { damageToHealth, shieldAbsorbed } = card.applyFinalDamage(150);

      expect(shieldAbsorbed).toBe(120);
      expect(damageToHealth).toBe(30);
    });

    it('removes shield when fully depleted', () => {
      const card = createFightingCard({ health: 400, defense: 0 });
      card.applyShield(0.3, 1);

      card.applyFinalDamage(120);

      expect(card.shielded).toBe(false);
    });

    it('keeps partial shield when damage is below shield points', () => {
      const card = createFightingCard({ health: 400, defense: 0 });
      card.applyShield(0.3, 1);

      card.applyFinalDamage(50);
      const { shieldAbsorbed } = card.applyFinalDamage(80);

      expect(shieldAbsorbed).toBe(70);
    });
  });

  describe('decreaseShieldDuration()', () => {
    it('returns null when no shield is active', () => {
      const card = createFightingCard({ health: 400 });

      expect(card.decreaseShieldDuration()).toBeNull();
    });

    it('returns null when shield still has duration remaining', () => {
      const card = createFightingCard({ health: 400 });
      card.applyShield(0.3, 2);

      expect(card.decreaseShieldDuration()).toBeNull();
    });

    it('returns expired shield when duration reaches 0', () => {
      const card = createFightingCard({ health: 400 });
      card.applyShield(0.3, 1);

      const expired = card.decreaseShieldDuration();

      expect(expired).not.toBeNull();
    });

    it('deactivates shield after expiry', () => {
      const card = createFightingCard({ health: 400 });
      card.applyShield(0.3, 1);

      card.decreaseShieldDuration();

      expect(card.shielded).toBe(false);
    });
  });

  describe('applyFinalDamage() without shield', () => {
    it('returns shieldAbsorbed of 0 when no shield', () => {
      const card = createFightingCard({ health: 400, defense: 0 });

      const { shieldAbsorbed, damageToHealth } = card.applyFinalDamage(100);

      expect(shieldAbsorbed).toBe(0);
      expect(damageToHealth).toBe(100);
    });
  });
});

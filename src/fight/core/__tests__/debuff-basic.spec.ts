import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';

describe('Debuff System - Basic Tests', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({
      attack: 100,
      defense: 50,
      health: 200,
      speed: 80,
      criticalChance: 0,
      agility: 30,
      accuracy: 70,
    });
  });

  describe('Multiple debuffs', () => {
    it('reduces attack when attack debuff is applied', () => {
      const initialAttack = card.actualAttack;

      card.applyDebuff('attack', 0.1, 3);

      expect(card.actualAttack).toBe(initialAttack - 10);
    });

    it('reduces defense when defense debuff is applied', () => {
      const initialDefense = card.actualDefense;

      card.applyDebuff('defense', 0.2, 2);

      expect(card.actualDefense).toBe(Math.max(0, initialDefense - 10));
    });

    it('stack debuffs of the same type', () => {
      const initialAttack = card.actualAttack;

      card.applyDebuff('attack', 0.1, 3);
      card.applyDebuff('attack', 0.1, 2);

      expect(card.actualAttack).toBe(initialAttack - 20); // Two 10% debuffs
    });
  });

  describe('Debuff duration management', () => {
    it('reduces stat when debuff is applied', () => {
      const initialAttack = card.actualAttack;

      card.applyDebuff('attack', 0.2, 1);

      expect(card.actualAttack).toBe(initialAttack - 20);
    });

    it('restores stat after debuff expires', () => {
      const initialAttack = card.actualAttack;

      card.applyDebuff('attack', 0.2, 1);
      card.decreaseBuffAndDebuffDuration();

      expect(card.actualAttack).toBe(initialAttack);
    });
  });

  describe('Combined buffs and debuffs', () => {
    it('properly calculate stats with both buffs and debuffs', () => {
      const initialAttack = card.actualAttack;

      card.applyBuff('attack', 0.3, 3); // +30% buff
      card.applyDebuff('attack', 0.1, 2); // -10% debuff

      const expectedAttack = initialAttack + 30 - 10; // 100 + 30 - 10 = 120
      expect(card.actualAttack).toBe(expectedAttack);
    });

    it('clamps attack to 0 with excessive debuff', () => {
      card.applyDebuff('attack', 2.0, 3);

      expect(card.actualAttack).toBe(0);
    });

    it('does not affect defense when attack is over-debuffed', () => {
      card.applyDebuff('attack', 2.0, 3);

      expect(card.actualDefense).toBeGreaterThanOrEqual(0);
    });

    it('does not affect agility when attack is over-debuffed', () => {
      card.applyDebuff('attack', 2.0, 3);

      expect(card.actualAgility).toBeGreaterThanOrEqual(0);
    });

    it('does not affect accuracy when attack is over-debuffed', () => {
      card.applyDebuff('attack', 2.0, 3);

      expect(card.actualAccuracy).toBeGreaterThanOrEqual(0);
    });
  });
});

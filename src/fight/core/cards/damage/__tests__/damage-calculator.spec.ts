import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { Element } from '../../@types/damage/element';
import { DamageCalculator } from '../damage-calculator';

describe('DamageCalculator', () => {
  describe('calculateDamage', () => {
    describe('with empty damages array (default behavior)', () => {
      it('should default to 100% physical damage', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        const attackStat = 100;

        const result = DamageCalculator.calculateDamage(
          [],
          attackStat,
          defender,
        );

        expect(result.total).toBe(100);
        expect(result.breakdown).toHaveLength(1);
        expect(result.breakdown[0].type).toBe(DamageType.PHYSICAL);
        expect(result.breakdown[0].amount).toBe(100);
      });
    });

    describe('with single damage type', () => {
      it('should calculate physical damage with no elemental modifier', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.FIRE,
        });
        const attackStat = 100;
        const damages = [new DamageComposition(DamageType.PHYSICAL, 1)];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.total).toBe(100);
        expect(result.breakdown[0].type).toBe(DamageType.PHYSICAL);
        expect(result.breakdown[0].amount).toBe(100);
      });

      it('should apply strong elemental multiplier (1.5x)', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.EARTH,
        });
        const attackStat = 100;
        const damages = [new DamageComposition(DamageType.FIRE, 1)];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.total).toBe(150);
        expect(result.breakdown[0].type).toBe(DamageType.FIRE);
        expect(result.breakdown[0].amount).toBe(150);
      });

      it('should apply weak elemental multiplier (0.35x)', () => {
        const defender = createFightingCard({
          name: 'WaterDefender',
          defense: 0,
          element: Element.WATER,
        });
        const attackStat = 100;
        const damages = [new DamageComposition(DamageType.FIRE, 1)];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.total).toBe(35);
        expect(result.breakdown[0].type).toBe(DamageType.FIRE);
        expect(result.breakdown[0].amount).toBe(35);
      });

      it('should apply damage rate correctly', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        const attackStat = 100;
        const damages = [new DamageComposition(DamageType.PHYSICAL, 0.5)];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.total).toBe(50);
      });

      it('should subtract defense from damage per type', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 30,
          element: Element.PHYSICAL,
        });
        const attackStat = 100;
        const damages = [new DamageComposition(DamageType.PHYSICAL, 1)];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.total).toBe(70);
      });

      it('should not return negative damage when defense exceeds damage', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 200,
          element: Element.PHYSICAL,
        });
        const attackStat = 100;
        const damages = [new DamageComposition(DamageType.PHYSICAL, 1)];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.total).toBe(0);
        expect(result.breakdown[0].amount).toBe(0);
      });
    });

    describe('with dual damage types', () => {
      it('should calculate and sum both damage types', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        const attackStat = 100;
        const damages = [
          new DamageComposition(DamageType.PHYSICAL, 0.3),
          new DamageComposition(DamageType.FIRE, 0.2),
        ];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.total).toBe(50);
        expect(result.breakdown).toHaveLength(2);
        expect(result.breakdown[0].type).toBe(DamageType.PHYSICAL);
        expect(result.breakdown[0].amount).toBe(30);
        expect(result.breakdown[1].type).toBe(DamageType.FIRE);
        expect(result.breakdown[1].amount).toBe(20);
      });

      it('should apply different multipliers to each damage type', () => {
        const defender = createFightingCard({
          name: 'WaterDefender',
          defense: 0,
          element: Element.WATER,
        });
        const attackStat = 100;
        const damages = [
          new DamageComposition(DamageType.PHYSICAL, 0.3),
          new DamageComposition(DamageType.FIRE, 0.2),
        ];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.breakdown[0].type).toBe(DamageType.PHYSICAL);
        expect(result.breakdown[0].amount).toBe(30);
        expect(result.breakdown[1].type).toBe(DamageType.FIRE);
        expect(result.breakdown[1].amount).toBe(7);
        expect(result.total).toBe(37);
      });

      it('should apply defense to each damage type separately', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 25,
          element: Element.PHYSICAL,
        });
        const attackStat = 100;
        const damages = [
          new DamageComposition(DamageType.PHYSICAL, 0.3),
          new DamageComposition(DamageType.FIRE, 0.2),
        ];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.breakdown[0].amount).toBe(5);
        expect(result.breakdown[1].amount).toBe(0);
        expect(result.total).toBe(5);
      });
    });

    describe('edge cases', () => {
      it('should handle 0% damage rate', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        const attackStat = 100;
        const damages = [new DamageComposition(DamageType.PHYSICAL, 0)];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.total).toBe(0);
      });

      it('should handle >100% total damage rate', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        const attackStat = 100;
        const damages = [
          new DamageComposition(DamageType.PHYSICAL, 0.8),
          new DamageComposition(DamageType.FIRE, 0.5),
        ];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.total).toBe(130);
      });

      it('should round damage values', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        const attackStat = 100;
        const damages = [new DamageComposition(DamageType.PHYSICAL, 0.333)];

        const result = DamageCalculator.calculateDamage(
          damages,
          attackStat,
          defender,
        );

        expect(result.breakdown[0].amount).toBe(33);
      });
    });
  });
});

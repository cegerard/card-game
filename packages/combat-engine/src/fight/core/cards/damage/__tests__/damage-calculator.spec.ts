import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { Element } from '../../@types/damage/element';
import { DamageCalculator } from '../damage-calculator';

describe('DamageCalculator', () => {
  describe('calculateDamage', () => {
    describe('with empty damages array (default behavior)', () => {
      let result;

      beforeEach(() => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        result = DamageCalculator.calculateDamage([], 100, defender);
      });

      it('default to 100 total damage', () => {
        expect(result.total).toBe(100);
      });

      it('have a single breakdown entry', () => {
        expect(result.breakdown).toHaveLength(1);
      });

      it('default to physical damage type', () => {
        expect(result.breakdown[0].type).toBe(DamageType.PHYSICAL);
      });

      it('deal full attack stat as damage', () => {
        expect(result.breakdown[0].amount).toBe(100);
      });
    });

    describe('with single damage type', () => {
      it('calculate physical damage with no elemental modifier', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.FIRE,
        });
        const damages = [new DamageComposition(DamageType.PHYSICAL, 1)];

        const result = DamageCalculator.calculateDamage(damages, 100, defender);

        expect(result.total).toBe(100);
      });

      describe('strong elemental multiplier (fire vs earth)', () => {
        let result;

        beforeEach(() => {
          const defender = createFightingCard({
            name: 'Defender',
            defense: 0,
            element: Element.EARTH,
          });
          const damages = [new DamageComposition(DamageType.FIRE, 1)];
          result = DamageCalculator.calculateDamage(damages, 100, defender);
        });

        it('apply 1.5x total damage', () => {
          expect(result.total).toBe(150);
        });

        it('tag breakdown as fire type', () => {
          expect(result.breakdown[0].type).toBe(DamageType.FIRE);
        });

        it('apply 1.5x to breakdown amount', () => {
          expect(result.breakdown[0].amount).toBe(150);
        });
      });

      describe('weak elemental multiplier (fire vs water)', () => {
        let result;

        beforeEach(() => {
          const defender = createFightingCard({
            name: 'WaterDefender',
            defense: 0,
            element: Element.WATER,
          });
          const damages = [new DamageComposition(DamageType.FIRE, 1)];
          result = DamageCalculator.calculateDamage(damages, 100, defender);
        });

        it('apply 0.35x total damage', () => {
          expect(result.total).toBe(35);
        });

        it('tag breakdown as fire type', () => {
          expect(result.breakdown[0].type).toBe(DamageType.FIRE);
        });

        it('apply 0.35x to breakdown amount', () => {
          expect(result.breakdown[0].amount).toBe(35);
        });
      });

      it('apply damage rate correctly', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        const damages = [new DamageComposition(DamageType.PHYSICAL, 0.5)];

        const result = DamageCalculator.calculateDamage(damages, 100, defender);

        expect(result.total).toBe(50);
      });

      it('subtract defense from damage per type', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 30,
          element: Element.PHYSICAL,
        });
        const damages = [new DamageComposition(DamageType.PHYSICAL, 1)];

        const result = DamageCalculator.calculateDamage(damages, 100, defender);

        expect(result.total).toBe(70);
      });

      describe('when defense exceeds damage', () => {
        let result;

        beforeEach(() => {
          const defender = createFightingCard({
            name: 'Defender',
            defense: 200,
            element: Element.PHYSICAL,
          });
          const damages = [new DamageComposition(DamageType.PHYSICAL, 1)];
          result = DamageCalculator.calculateDamage(damages, 100, defender);
        });

        it('not return negative total damage', () => {
          expect(result.total).toBe(0);
        });

        it('not return negative breakdown amount', () => {
          expect(result.breakdown[0].amount).toBe(0);
        });
      });
    });

    describe('with dual damage types', () => {
      describe('physical 30% + fire 20% vs physical defender (no defense)', () => {
        let result;

        beforeEach(() => {
          const defender = createFightingCard({
            name: 'Defender',
            defense: 0,
            element: Element.PHYSICAL,
          });
          const damages = [
            new DamageComposition(DamageType.PHYSICAL, 0.3),
            new DamageComposition(DamageType.FIRE, 0.2),
          ];
          result = DamageCalculator.calculateDamage(damages, 100, defender);
        });

        it('sum both damage types for total', () => {
          expect(result.total).toBe(50);
        });

        it('have two breakdown entries', () => {
          expect(result.breakdown).toHaveLength(2);
        });

        it('calculate physical breakdown as 30', () => {
          expect(result.breakdown[0].amount).toBe(30);
        });

        it('tag first breakdown as physical', () => {
          expect(result.breakdown[0].type).toBe(DamageType.PHYSICAL);
        });

        it('calculate fire breakdown as 20', () => {
          expect(result.breakdown[1].amount).toBe(20);
        });

        it('tag second breakdown as fire', () => {
          expect(result.breakdown[1].type).toBe(DamageType.FIRE);
        });
      });

      describe('physical 30% + fire 20% vs water defender (fire is weak)', () => {
        let result;

        beforeEach(() => {
          const defender = createFightingCard({
            name: 'WaterDefender',
            defense: 0,
            element: Element.WATER,
          });
          const damages = [
            new DamageComposition(DamageType.PHYSICAL, 0.3),
            new DamageComposition(DamageType.FIRE, 0.2),
          ];
          result = DamageCalculator.calculateDamage(damages, 100, defender);
        });

        it('keep physical breakdown at 30', () => {
          expect(result.breakdown[0].amount).toBe(30);
        });

        it('reduce fire breakdown to 7', () => {
          expect(result.breakdown[1].amount).toBe(7);
        });

        it('sum to 37 total', () => {
          expect(result.total).toBe(37);
        });
      });

      describe('physical 30% + fire 20% vs physical defender with 25 defense', () => {
        let result;

        beforeEach(() => {
          const defender = createFightingCard({
            name: 'Defender',
            defense: 25,
            element: Element.PHYSICAL,
          });
          const damages = [
            new DamageComposition(DamageType.PHYSICAL, 0.3),
            new DamageComposition(DamageType.FIRE, 0.2),
          ];
          result = DamageCalculator.calculateDamage(damages, 100, defender);
        });

        it('reduce physical breakdown to 5', () => {
          expect(result.breakdown[0].amount).toBe(5);
        });

        it('clamp fire breakdown to 0', () => {
          expect(result.breakdown[1].amount).toBe(0);
        });

        it('sum to 5 total', () => {
          expect(result.total).toBe(5);
        });
      });
    });

    describe('edge cases', () => {
      it('handle 0% damage rate', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        const damages = [new DamageComposition(DamageType.PHYSICAL, 0)];

        const result = DamageCalculator.calculateDamage(damages, 100, defender);

        expect(result.total).toBe(0);
      });

      it('handle >100% total damage rate', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        const damages = [
          new DamageComposition(DamageType.PHYSICAL, 0.8),
          new DamageComposition(DamageType.FIRE, 0.5),
        ];

        const result = DamageCalculator.calculateDamage(damages, 100, defender);

        expect(result.total).toBe(130);
      });

      it('round damage values', () => {
        const defender = createFightingCard({
          name: 'Defender',
          defense: 0,
          element: Element.PHYSICAL,
        });
        const damages = [new DamageComposition(DamageType.PHYSICAL, 0.333)];

        const result = DamageCalculator.calculateDamage(damages, 100, defender);

        expect(result.breakdown[0].amount).toBe(33);
      });
    });
  });
});

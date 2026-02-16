import { DamageType } from '../../@types/damage/damage-type';
import { Element } from '../../@types/damage/element';
import { ElementalMatrix } from '../elemental-matrix';

describe('ElementalMatrix', () => {
  describe('getMultiplier', () => {
    describe('PHYSICAL damage type', () => {
      it('should return 1.0 against all elements', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.PHYSICAL, Element.PHYSICAL),
        ).toBe(1.0);
        expect(
          ElementalMatrix.getMultiplier(DamageType.PHYSICAL, Element.FIRE),
        ).toBe(1.0);
        expect(
          ElementalMatrix.getMultiplier(DamageType.PHYSICAL, Element.WATER),
        ).toBe(1.0);
        expect(
          ElementalMatrix.getMultiplier(DamageType.PHYSICAL, Element.EARTH),
        ).toBe(1.0);
        expect(
          ElementalMatrix.getMultiplier(DamageType.PHYSICAL, Element.AIR),
        ).toBe(1.0);
      });
    });

    describe('FIRE damage type', () => {
      it('should return 1.0 against PHYSICAL', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.FIRE, Element.PHYSICAL),
        ).toBe(1.0);
      });

      it('should return 1.0 against FIRE (same element)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.FIRE, Element.FIRE),
        ).toBe(1.0);
      });

      it('should return 0.35 against WATER (weak)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.FIRE, Element.WATER),
        ).toBe(0.35);
      });

      it('should return 1.5 against EARTH (strong)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.FIRE, Element.EARTH),
        ).toBe(1.5);
      });

      it('should return 1.65 against AIR (strong)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.FIRE, Element.AIR),
        ).toBe(1.65);
      });
    });

    describe('WATER damage type', () => {
      it('should return 1.0 against PHYSICAL', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.WATER, Element.PHYSICAL),
        ).toBe(1.0);
      });

      it('should return 1.8 against FIRE (strong)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.WATER, Element.FIRE),
        ).toBe(1.8);
      });

      it('should return 1.0 against WATER (same element)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.WATER, Element.WATER),
        ).toBe(1.0);
      });

      it('should return 0.5 against EARTH (weak)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.WATER, Element.EARTH),
        ).toBe(0.5);
      });

      it('should return 0.7 against AIR (weak)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.WATER, Element.AIR),
        ).toBe(0.7);
      });
    });

    describe('EARTH damage type', () => {
      it('should return 1.0 against PHYSICAL', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.EARTH, Element.PHYSICAL),
        ).toBe(1.0);
      });

      it('should return 1 against FIRE', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.EARTH, Element.FIRE),
        ).toBe(1);
      });

      it('should return 1.5 against WATER (strong)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.EARTH, Element.WATER),
        ).toBe(1.5);
      });

      it('should return 1.0 against EARTH (same element)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.EARTH, Element.EARTH),
        ).toBe(1.0);
      });

      it('should return 0.5 against AIR (weak)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.EARTH, Element.AIR),
        ).toBe(0.5);
      });
    });

    describe('AIR damage type', () => {
      it('should return 1.0 against PHYSICAL', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.AIR, Element.PHYSICAL),
        ).toBe(1.0);
      });

      it('should return 0.5 against FIRE (weak)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.AIR, Element.FIRE),
        ).toBe(0.5);
      });

      it('should return 1 against WATER', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.AIR, Element.WATER),
        ).toBe(1);
      });

      it('should return 1.5 against EARTH (strong)', () => {
        expect(
          ElementalMatrix.getMultiplier(DamageType.AIR, Element.EARTH),
        ).toBe(1.5);
      });

      it('should return 1.0 against AIR (same element)', () => {
        expect(ElementalMatrix.getMultiplier(DamageType.AIR, Element.AIR)).toBe(
          1.0,
        );
      });
    });
  });
});

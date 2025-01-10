import { createFightingCard } from '../../../test/helpers/fighting-card';

describe('FightingCard', () => {
  describe('when attacking', () => {
    const attackerAccuracy = 40;
    const attacker = createFightingCard({
      damage: 10,
      criticalChance: 0,
      accuracy: attackerAccuracy,
      skills: { simpleAttack: { damageRate: 1.0 } },
    });

    describe('and the attack is not dodge', () => {
      const defenderWithoutDodge = createFightingCard({
        defense: 0,
        agility: attackerAccuracy,
      });

      it('should compute the damage with the simple attack', () => {
        expect(attacker.attack(defenderWithoutDodge)).toEqual({
          damage: 10,
          isCritical: false,
          dodge: false,
        });
      });
    });

    describe('and the attack is dodge', () => {
      const defenderWithDodge = createFightingCard({
        defense: 0,
        agility: attackerAccuracy + 1,
      });
      it('should not deal any damage', () => {
        expect(attacker.attack(defenderWithDodge)).toEqual({
          damage: 0,
          isCritical: false,
          dodge: true,
        });
      });
    });
  });

  describe('when launching a special attack', () => {
    const attackerAccuracy = 25;
    const attacker = createFightingCard({
      damage: 10,
      criticalChance: 0,
      accuracy: attackerAccuracy,
      skills: { specialAttack: { damageRate: 1.0, energy: 0 } },
    });

    describe('and the attack is not dodge', () => {
      const defenderWithoutDodge = createFightingCard({
        defense: 0,
        agility: attackerAccuracy,
      });

      it('should compute the damage with the special attack', () => {
        expect(attacker.launchSpecial(defenderWithoutDodge)).toEqual({
          damage: 10,
          isCritical: false,
          dodge: false,
        });
      });
    });

    describe('and the attack is dodge', () => {
      const defenderWithDodge = createFightingCard({
        defense: 0,
        agility: attackerAccuracy + 1,
      });

      it('should not deal any damage', () => {
        expect(attacker.launchSpecial(defenderWithDodge)).toEqual({
          damage: 0,
          isCritical: false,
          dodge: true,
        });
      });
    });
  });
});

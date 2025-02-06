import { createFightingCard } from '../../../test/helpers/fighting-card';
import { FightingCard } from './fighting-card';

describe('FightingCard', () => {
  describe('when collecting damages', () => {
    let card: FightingCard;

    beforeEach(() => {
      card = createFightingCard({ health: 500, defense: 0 });
    });

    describe('and the card is alive', () => {
      it('should return the damages collected', () => {
        expect(card.collectsDamages(100)).toEqual(100);
      });

      it('should decrease the health of the card', () => {
        card.collectsDamages(100);

        expect(card.actualHealth).toEqual(400);
      });
    });

    describe('and the card is dead', () => {
      beforeEach(() => {
        card.collectsDamages(500);
      });

      it('should return 0', () => {
        expect(card.collectsDamages(100)).toEqual(0);
      });

      it('should not change the health of the card', () => {
        card.collectsDamages(100);

        expect(card.actualHealth).toEqual(0);
      });
    });
  });
  describe('when attacking', () => {
    const attackerAccuracy = 40;
    const attacker = createFightingCard({
      attack: 10,
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
        expect(attacker.launchAttack(defenderWithoutDodge)).toEqual({
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
        expect(attacker.launchAttack(defenderWithDodge)).toEqual({
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
      attack: 10,
      criticalChance: 0,
      accuracy: attackerAccuracy,
      skills: {
        special: { damageRate: 1.0, energy: 0, kind: 'specialAttack' },
      },
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

  describe('when launching a special healing', () => {
    const healer = createFightingCard({
      attack: 100,
      skills: {
        special: { kind: 'specialHealing', damageRate: 2.5, energy: 0 },
      },
    });
    let target: FightingCard;

    describe('and the target is not full health', () => {
      beforeEach(() => {
        target = createFightingCard({ health: 500, defense: 0 });
        target.collectsDamages(400);
      });

      it('should return the healing result', () => {
        const result = healer.launchSpecial(target);

        expect(result).toEqual({ healed: 250 });
      });

      it('should increase the health of the card', () => {
        healer.launchSpecial(target);

        expect(target.actualHealth).toEqual(350);
      });
    });

    describe('and the target is full health', () => {
      const maxHealth = 500;

      beforeEach(() => {
        target = createFightingCard({ health: maxHealth, defense: 0 });
      });

      it('should return a null healing result', () => {
        const result = healer.launchSpecial(target);

        expect(result).toEqual({ healed: 0 });
      });

      it('should not change the health of the card', () => {
        healer.launchSpecial(target);

        expect(target.actualHealth).toEqual(maxHealth);
      });
    });

    describe('and the target is dead', () => {
      const maxHealth = 500;

      beforeEach(() => {
        target = createFightingCard({ health: maxHealth, defense: 0 });
        target.collectsDamages(maxHealth);
      });

      it('should return a null healing result', () => {
        const result = healer.launchSpecial(target);

        expect(result).toEqual({ healed: 0 });
      });

      it('should not change the health of the card', () => {
        healer.launchSpecial(target);

        expect(target.actualHealth).toEqual(0);
      });
    });

    describe('when the healing if more than the card max health', () => {
      const maxHealth = 500;
      const damage = 100;

      beforeEach(() => {
        target = createFightingCard({ health: maxHealth, defense: 0 });
        target.collectsDamages(damage);
      });

      it('should return the healing result', () => {
        const result = healer.launchSpecial(target);

        expect(result).toEqual({ healed: damage });
      });

      it('should increase the health of the card to the max health', () => {
        healer.launchSpecial(target);

        expect(target.actualHealth).toEqual(maxHealth);
      });
    });
  });
});

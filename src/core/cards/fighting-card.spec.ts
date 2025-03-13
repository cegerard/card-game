import { createFightingCard } from '../../../test/helpers/fighting-card';
import { Player } from '../player';
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
    const player1 = new Player('player1', [attacker]);

    describe('and the attack is not dodge', () => {
      const defenderWithoutDodge = createFightingCard({
        defense: 0,
        agility: attackerAccuracy,
      });
      const player2 = new Player('player2', [defenderWithoutDodge]);

      it('should compute the damage with the simple attack', () => {
        expect(
          attacker.launchAttack({
            sourcePlayer: player1,
            opponentPlayer: player2,
          }),
        ).toEqual([
          {
            damage: 10,
            isCritical: false,
            dodge: false,
            defender: defenderWithoutDodge,
          },
        ]);
      });
    });

    describe('and the attack is dodge', () => {
      const defenderWithDodge = createFightingCard({
        defense: 0,
        agility: attackerAccuracy + 1,
      });
      const player2 = new Player('player2', [defenderWithDodge]);

      it('should not deal any damage', () => {
        expect(
          attacker.launchAttack({
            sourcePlayer: player1,
            opponentPlayer: player2,
          }),
        ).toEqual([
          {
            damage: 0,
            isCritical: false,
            dodge: true,
            defender: defenderWithDodge,
          },
        ]);
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
          defender: defenderWithoutDodge,
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
          defender: defenderWithDodge,
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

  describe('when launching a self healing skill', () => {
    const fightingContext = {
      sourcePlayer: null,
      opponentPlayer: null,
    };
    let healer: FightingCard;

    beforeEach(() => {
      healer = createFightingCard({
        attack: 100,
        defense: 0,
        health: 500,
        skills: {
          others: [
            {
              effectRate: 1.5,
              trigger: 'turn-end',
              targetingStrategy: 'self',
            },
          ],
        },
      });
    });

    describe('and the card is not full health', () => {
      beforeEach(() => {
        healer.collectsDamages(400);
      });

      it('should return the healing result', () => {
        const result = healer.launchSkill('turn-end', fightingContext);

        expect(result).toEqual([
          {
            healAmount: 150,
            remainingHealth: 250,
            target: healer.identityInfo,
          },
        ]);
      });
    });

    describe('and the card is full health', () => {
      it('should return a null healing result', () => {
        const result = healer.launchSkill('turn-end', fightingContext);

        expect(result).toEqual([
          {
            healAmount: 0,
            remainingHealth: 500,
            target: healer.identityInfo,
          },
        ]);
      });

      it('should not change the health of the card', () => {
        healer.launchSkill('turn-end', fightingContext);

        expect(healer.actualHealth).toEqual(500);
      });
    });

    describe('when the healing is more than the card max health', () => {
      const damage = 50;

      beforeEach(() => {
        healer.collectsDamages(damage);
      });

      it('should return the healing result', () => {
        const result = healer.launchSkill('turn-end', fightingContext);

        expect(result).toEqual([
          {
            healAmount: damage,
            remainingHealth: 500,
            target: healer.identityInfo,
          },
        ]);
      });
    });
  });
});

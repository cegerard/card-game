import { createEffect } from '../../../test/helpers/effect';
import { createFightingCard } from '../../../test/helpers/fighting-card';
import { Player } from '../player';
import { AttackEffect } from './@types/attack/attack-effect';
import { CardStatePoisoned } from './@types/state/card-state-poisoned';
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
    const player1 = new Player('player1', [attacker]);

    describe('and the attack is not dodge', () => {
      const defenderWithoutDodge = createFightingCard({
        defense: 0,
        agility: attackerAccuracy,
      });
      const player2 = new Player('player2', [defenderWithoutDodge]);

      it('should compute the damage with the special attack', () => {
        expect(
          attacker.launchSpecial({
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
          attacker.launchSpecial({
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

  describe('when launching a special healing', () => {
    const healer = createFightingCard({
      attack: 100,
      skills: {
        special: { kind: 'specialHealing', damageRate: 2.5, energy: 0 },
      },
    });
    const player1 = new Player('player1', [healer]);
    let target: FightingCard;
    let player2: Player;

    describe('and the target is not full health', () => {
      beforeEach(() => {
        target = createFightingCard({ health: 500, defense: 0 });
        player2 = new Player('player2', [target]);

        target.collectsDamages(400);
      });

      it('should return the healing result', () => {
        const result = healer.launchSpecial({
          sourcePlayer: player1,
          opponentPlayer: player2,
        });

        expect(result).toEqual([{ healed: 250, target }]);
      });

      it('should increase the health of the card', () => {
        healer.launchSpecial({
          sourcePlayer: player1,
          opponentPlayer: player2,
        });

        expect(target.actualHealth).toEqual(350);
      });
    });

    describe('and the target is full health', () => {
      const maxHealth = 500;

      beforeEach(() => {
        target = createFightingCard({ health: maxHealth, defense: 0 });
        player2 = new Player('player2', [target]);
      });

      it('should return a null healing result', () => {
        const result = healer.launchSpecial({
          sourcePlayer: player1,
          opponentPlayer: player2,
        });

        expect(result).toEqual([{ healed: 0, target }]);
      });

      it('should not change the health of the card', () => {
        healer.launchSpecial({
          sourcePlayer: player1,
          opponentPlayer: player2,
        });

        expect(target.actualHealth).toEqual(maxHealth);
      });
    });

    describe('and the target is dead', () => {
      const maxHealth = 500;

      beforeEach(() => {
        target = createFightingCard({ health: maxHealth, defense: 0 });
        player2 = new Player('player2', [target]);

        target.collectsDamages(maxHealth);
      });

      it('should return a null healing result', () => {
        const result = healer.launchSpecial({
          sourcePlayer: player1,
          opponentPlayer: player2,
        });

        expect(result).toEqual([]);
      });

      it('should not change the health of the card', () => {
        healer.launchSpecial({
          sourcePlayer: player1,
          opponentPlayer: player2,
        });

        expect(target.actualHealth).toEqual(0);
      });
    });

    describe('when the healing if more than the card max health', () => {
      const maxHealth = 500;
      const damage = 100;

      beforeEach(() => {
        target = createFightingCard({ health: maxHealth, defense: 0 });
        player2 = new Player('player2', [target]);

        target.collectsDamages(damage);
      });

      it('should return the healing result', () => {
        const result = healer.launchSpecial({
          sourcePlayer: player1,
          opponentPlayer: player2,
        });

        expect(result).toEqual([{ healed: damage, target }]);
      });

      it('should increase the health of the card to the max health', () => {
        healer.launchSpecial({
          sourcePlayer: player1,
          opponentPlayer: player2,
        });

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

  describe('when attacking with a poisoned effect', () => {
    const poisonRate = 0.1;
    const attacker = createFightingCard({
      accuracy: 1,
      skills: {
        simpleAttack: {
          effect: { type: 'poison', level: 1, rate: poisonRate },
        },
      },
    });
    const defender = createFightingCard({
      agility: 0,
    });
    const player1 = new Player('player1', [attacker]);
    const player2 = new Player('player2', [defender]);

    it('should add a poison effect to the defender', () => {
      attacker.launchAttack({ sourcePlayer: player1, opponentPlayer: player2 });

      expect(defender.states).toEqual([
        {
          type: 'poison',
          remainingTurns: 3,
          damageValue: attacker.actualAttack * poisonRate,
        },
      ]);
    });
  });

  describe('when applying a poison state', () => {
    const poisonRate = 0.1;

    let poisonedEffect: AttackEffect;
    let attacker: FightingCard;
    let defender: FightingCard;
    let player1: Player;
    let player2: Player;

    beforeEach(() => {
      poisonedEffect = createEffect({
        rate: poisonRate,
        level: 1,
        type: 'poison',
      });
      attacker = createFightingCard({ attack: 100 });
      defender = createFightingCard({ health: 500, defense: 0 });
      player1 = new Player('player1', [attacker]);
      player2 = new Player('player2', [defender]);
    });

    describe('and it is the first time to apply the state', () => {
      beforeEach(() => {
        poisonedEffect.applyEffect(defender, attacker, {
          sourcePlayer: player1,
          opponentPlayer: player2,
        });
      });

      it('should affect the defender with poison', () => {
        expect(defender.applyStateEffects()).toEqual([
          {
            type: 'poison',
            card: defender,
            damage: attacker.actualAttack * poisonRate,
            remainingTurns: 2,
          },
        ]);
      });
    });

    describe('and it is the last time to apply the state', () => {
      beforeEach(() => {
        poisonedEffect.applyEffect(defender, attacker, {
          sourcePlayer: player1,
          opponentPlayer: player2,
        });
        defender.applyStateEffects();
        defender.applyStateEffects();
      });

      it('should affect the defender with poison', () => {
        expect(defender.applyStateEffects()).toEqual([
          {
            type: 'poison',
            card: defender,
            damage: attacker.actualAttack * poisonRate,
            remainingTurns: 0,
          },
        ]);
      });
    });

    describe('and the defender is dead', () => {
      beforeEach(() => {
        defender.collectsDamages(500);
        poisonedEffect.applyEffect(defender, attacker, {
          sourcePlayer: player1,
          opponentPlayer: player2,
        });
      });

      it('should not affect the defender with poison', () => {
        expect(defender.applyStateEffects()).toEqual([]);
      });
    });

    describe('and the defender is no more poisoned', () => {
      beforeEach(() => {
        poisonedEffect.applyEffect(defender, attacker, {
          sourcePlayer: player1,
          opponentPlayer: player2,
        });
        defender.applyStateEffects();
        defender.applyStateEffects();
        defender.applyStateEffects();
      });

      it('should not affect the defender with poison', () => {
        expect(defender.applyStateEffects()).toEqual([]);
      });
    });
  });

  describe('when setting a card state on a dead card', () => {
    const card = createFightingCard({ health: 0 });

    it('should not set the state', () => {
      card.setState(new CardStatePoisoned(3, 10));

      expect(card.states).toEqual([]);
    });
  });
});

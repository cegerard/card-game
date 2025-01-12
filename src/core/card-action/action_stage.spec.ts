import { ActionStage } from './action_stage';
import { Player } from '../player';
import { createFightingCard } from '../../../test/helpers/fighting-card';

describe('ActionStage', () => {
  const eventBroker = {
    onCardDeath: [],
  };

  describe('computeNextAction', () => {
    describe('without critical hit', () => {
      const attacker = createFightingCard({
        damage: 10,
        criticalChance: 0,
        speed: 1,
        agility: 0,
        skills: { simpleAttack: { damageRate: 1.0 } },
      });
      const defender = createFightingCard({
        damage: 0,
        defense: 0,
        health: 100,
        speed: 0,
        criticalChance: 0,
        agility: 0,
        skills: { simpleAttack: { damageRate: 1.0 } },
      });
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const attackStage = new ActionStage(player1, player2, eventBroker);

      it('should return the damage dealt by the attacker', () => {
        const result = attackStage.computeNextAction([attacker]);

        expect(result).toEqual([
          {
            kind: 'attack',
            attacker: attacker.identityInfo,
            energy: 10,
            damages: [
              {
                defender: defender.identityInfo,
                damage: 10,
                isCritical: false,
                dodge: false,
                remainingHealth: 90,
              },
            ],
          },
        ]);
      });
    });

    describe('with a critical hit', () => {
      const attacker = createFightingCard({
        damage: 10,
        defense: 0,
        health: 100,
        speed: 1,
        criticalChance: 1,
        agility: 0,
        skills: { simpleAttack: { damageRate: 1.0 } },
      });
      const defender = createFightingCard({
        damage: 0,
        defense: 0,
        health: 100,
        speed: 0,
        criticalChance: 0,
        agility: 0,
        skills: { simpleAttack: { damageRate: 1.0 } },
      });
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const attackStage = new ActionStage(player1, player2, eventBroker);

      it('should return the damage dealt by the attacker', () => {
        const result = attackStage.computeNextAction([attacker]);

        expect(result).toEqual([
          {
            kind: 'attack',
            attacker: attacker.identityInfo,
            energy: 10,
            damages: [
              {
                defender: defender.identityInfo,
                damage: 20,
                isCritical: true,
                dodge: false,
                remainingHealth: 80,
              },
            ],
          },
        ]);
      });
    });

    describe('when the defender is killed', () => {
      const attacker = createFightingCard({
        damage: 100,
        defense: 0,
        health: 100,
        speed: 1,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.2 },
          specialAttack: { damageRate: 0 },
        },
      });
      const defender = createFightingCard({
        damage: 0,
        defense: 0,
        health: 120,
        speed: 0,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
          specialAttack: { damageRate: 0 },
        },
      });
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const attackStage = new ActionStage(player1, player2, eventBroker);

      it('should return the damage dealt and the status change', () => {
        const result = attackStage.computeNextAction([attacker]);

        expect(result).toEqual([
          {
            kind: 'attack',
            attacker: attacker.identityInfo,
            energy: 10,
            damages: [
              {
                defender: defender.identityInfo,
                damage: 120,
                isCritical: false,
                dodge: false,
                remainingHealth: 0,
              },
            ],
          },
          {
            kind: 'status_change',
            card: defender.identityInfo,
            status: 'dead',
          },
        ]);
      });
    });

    describe('when the attacker launch a special attack', () => {
      const attacker = createFightingCard({
        damage: 1,
        defense: 0,
        health: 1000,
        speed: 1,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
          specialAttack: { damageRate: 450, energy: 0 },
        },
      });
      const defender = createFightingCard({
        damage: 0,
        defense: 0,
        health: 1000,
        speed: 0,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
          specialAttack: { damageRate: 0 },
        },
      });
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const attackStage = new ActionStage(player1, player2, eventBroker);

      it('should return the damage dealt and the status change', () => {
        const result = attackStage.computeNextAction([attacker]);

        expect(result).toEqual([
          {
            kind: 'special_attack',
            attacker: attacker.identityInfo,
            energy: 0,
            damages: [
              {
                defender: defender.identityInfo,
                damage: 450,
                isCritical: false,
                dodge: false,
                remainingHealth: 550,
              },
            ],
          },
        ]);
      });
    });

    describe('when the special attack hit all defender cards', () => {
      const attacker = createFightingCard({
        damage: 1,
        defense: 0,
        health: 1000,
        speed: 1,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
          specialAttack: {
            damageRate: 450,
            energy: 0,
            targetingStrategy: 'target-all',
          },
        },
      });
      const defender1 = createFightingCard({
        damage: 0,
        defense: 120,
        health: 300,
        speed: 0,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
          specialAttack: { damageRate: 0 },
        },
      });
      const defender2 = createFightingCard({
        damage: 0,
        defense: 200,
        health: 1000,
        speed: 0,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
          specialAttack: { damageRate: 0 },
        },
      });
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender1, defender2]);

      const attackStage = new ActionStage(player1, player2, eventBroker);

      it('should return the damage dealt and the status change', () => {
        const result = attackStage.computeNextAction([attacker]);
        expect(result).toEqual([
          {
            kind: 'special_attack',
            attacker: attacker.identityInfo,
            energy: 0,
            damages: [
              {
                defender: defender1.identityInfo,
                damage: 330,
                isCritical: false,
                dodge: false,
                remainingHealth: 0,
              },
              {
                defender: defender2.identityInfo,
                damage: 250,
                isCritical: false,
                dodge: false,
                remainingHealth: 750,
              },
            ],
          },
          {
            kind: 'status_change',
            card: defender1.identityInfo,
            status: 'dead',
          },
        ]);
      });
    });
  });
});

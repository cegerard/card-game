import { ActionStage } from '../card-action/action_stage';
import { Player } from '../player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';

describe('ActionStage', () => {
  const eventBroker = {
    onCardDeath: [],
  };

  describe('computeNextAction', () => {
    describe('without critical hit', () => {
      const attacker = createFightingCard({
        attack: 10,
        criticalChance: 0,
        speed: 1,
        agility: 0,
        skills: { simpleAttack: { damageRate: 1.0 } },
      });
      const defender = createFightingCard({
        attack: 0,
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
        attack: 10,
        defense: 0,
        health: 100,
        speed: 1,
        criticalChance: 1,
        agility: 0,
        skills: { simpleAttack: { damageRate: 1.0 } },
      });
      const defender = createFightingCard({
        attack: 0,
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
        attack: 100,
        defense: 0,
        health: 100,
        speed: 1,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.2 },
          special: { damageRate: 0 },
        },
      });
      const defender = createFightingCard({
        attack: 0,
        defense: 0,
        health: 120,
        speed: 0,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
          special: { damageRate: 0 },
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
        attack: 1,
        defense: 0,
        health: 1000,
        speed: 1,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
          special: { kind: 'specialAttack', damageRate: 450, energy: 0 },
        },
      });
      const defender = createFightingCard({
        attack: 0,
        defense: 0,
        health: 1000,
        speed: 0,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
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
        attack: 1,
        defense: 0,
        health: 1000,
        speed: 1,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
          special: {
            kind: 'specialAttack',
            damageRate: 450,
            energy: 0,
            targetingStrategy: 'target-all',
          },
        },
      });
      const defender1 = createFightingCard({
        attack: 0,
        defense: 120,
        health: 300,
        speed: 0,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
        },
      });
      const defender2 = createFightingCard({
        attack: 0,
        defense: 200,
        health: 1000,
        speed: 0,
        criticalChance: 0,
        agility: 0,
        skills: {
          simpleAttack: { damageRate: 1.0 },
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

    describe('when the card launch a special healing skill', () => {
      const specialHealing = {
        kind: 'specialHealing',
        damageRate: 1.8,
        energy: 0,
      };
      describe('when the healing target only the healer', () => {
        const targetingStrategy = 'self';

        const healer = createFightingCard({
          attack: 100,
          defense: 0,
          health: 1400,
          skills: {
            special: { ...specialHealing, targetingStrategy },
          },
        });
        const other = createFightingCard({ health: 1000, defense: 0 });
        const enemies = createFightingCard({ health: 1000, defense: 0 });
        const player1 = new Player('Player 1', [healer, other]);
        const player2 = new Player('Player 2', [enemies]);
        const attackStage = new ActionStage(player1, player2, eventBroker);

        beforeEach(() => {
          healer.collectsDamages(400);
        });

        it('should return the healing report', () => {
          const result = attackStage.computeNextAction([healer]);

          expect(result).toEqual([
            {
              kind: 'healing',
              source: healer.identityInfo,
              energy: 0,
              heal: [
                {
                  target: healer.identityInfo,
                  healed: 180,
                  remainingHealth: 1180,
                },
              ],
            },
          ]);
        });
      });

      describe('when the healing target all the allies adn the healer', () => {
        const targetingStrategy = 'all-owner-cards';

        const healer = createFightingCard({
          attack: 100,
          defense: 0,
          health: 1400,
          skills: {
            special: { ...specialHealing, targetingStrategy },
          },
        });
        const other = createFightingCard({ health: 1000, defense: 0 });
        const allies1 = createFightingCard({ health: 1000, defense: 0 });
        const allies2 = createFightingCard({ health: 900, defense: 0 });
        const player1 = new Player('Player 1', [healer, allies1, allies2]);
        const player2 = new Player('Player 2', [other]);
        const attackStage = new ActionStage(player1, player2, eventBroker);

        beforeEach(() => {
          healer.collectsDamages(400);
          allies1.collectsDamages(300);
          allies2.collectsDamages(100);
        });

        it('should return the healing report', () => {
          const result = attackStage.computeNextAction([healer]);

          expect(result).toEqual([
            {
              kind: 'healing',
              source: healer.identityInfo,
              energy: 0,
              heal: [
                {
                  target: healer.identityInfo,
                  healed: 180,
                  remainingHealth: 1180,
                },
                {
                  target: allies1.identityInfo,
                  healed: 180,
                  remainingHealth: 880,
                },
                {
                  target: allies2.identityInfo,
                  healed: 100,
                  remainingHealth: 900,
                },
              ],
            },
          ]);
        });
      });

      describe('when the special healing heal only the allies', () => {
        const targetingStrategy = 'all-allies';

        const healer = createFightingCard({
          attack: 100,
          defense: 0,
          health: 1400,
          skills: {
            special: { ...specialHealing, targetingStrategy },
          },
        });
        const other = createFightingCard({ health: 1000, defense: 0 });
        const allies1 = createFightingCard({ health: 1000, defense: 0 });
        const allies2 = createFightingCard({ health: 900, defense: 0 });
        const player1 = new Player('Player 1', [healer, allies1, allies2]);
        const player2 = new Player('Player 2', [other]);
        const attackStage = new ActionStage(player1, player2, eventBroker);

        beforeEach(() => {
          allies1.collectsDamages(300);
          allies2.collectsDamages(100);
        });

        it('should return the healing report', () => {
          const result = attackStage.computeNextAction([healer]);

          expect(result).toEqual([
            {
              kind: 'healing',
              source: healer.identityInfo,
              energy: 0,
              heal: [
                {
                  target: allies1.identityInfo,
                  healed: 180,
                  remainingHealth: 880,
                },
                {
                  target: allies2.identityInfo,
                  healed: 100,
                  remainingHealth: 900,
                },
              ],
            },
          ]);
        });
      });
    });
  });
});

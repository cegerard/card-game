import { AttackStage } from './attack_stage';
import { Player } from '../player';
import { FightingCard } from '../cards/fighting-card';
import { SpecialAttack } from '../cards/skills/special-attack';
import { TargetedFromPosition } from '../targeting-card-strategies/targeted-from-position';
import { TargetedAll } from '../targeting-card-strategies/targeted-all';

describe('AttackStage', () => {
  const eventBroker = {
    onCardDeath: [],
  };

  describe('computeNextAttack', () => {
    describe('without critical hit', () => {
      const attacker = new FightingCard(
        'Axe',
        {
          damage: 10,
          defense: 0,
          health: 100,
          speed: 1,
          criticalChance: 0,
        },
        {
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition(1)),
        },
      );
      const defender = new FightingCard(
        'Sword',
        {
          damage: 0,
          defense: 0,
          health: 100,
          speed: 0,
          criticalChance: 0,
        },
        {
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition(1)),
        },
      );
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const attackStage = new AttackStage(player1, player2, eventBroker);

      it('should return the damage dealt by the attacker', () => {
        const result = attackStage.computeNextAttack([attacker]);

        expect(result).toEqual([
          { kind: 'attack', attacker, defender, damage: 10, isCritical: false },
        ]);
      });
    });

    describe('with a critical hit', () => {
      const attacker = new FightingCard(
        'Axe',
        {
          damage: 10,
          defense: 0,
          health: 100,
          speed: 1,
          criticalChance: 1,
        },
        {
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition(1)),
        },
      );
      const defender = new FightingCard(
        'Sword',
        {
          damage: 0,
          defense: 0,
          health: 100,
          speed: 0,
          criticalChance: 0,
        },
        {
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition(1)),
        },
      );
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const attackStage = new AttackStage(player1, player2, eventBroker);

      it('should return the damage dealt by the attacker', () => {
        const result = attackStage.computeNextAttack([attacker]);

        expect(result).toEqual([
          { kind: 'attack', attacker, defender, damage: 20, isCritical: true },
        ]);
      });
    });

    describe('when the defender is killed', () => {
      const attacker = new FightingCard(
        'Axe',
        {
          damage: 100,
          defense: 0,
          health: 100,
          speed: 1,
          criticalChance: 0,
        },
        {
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition(1)),
        },
      );
      const defender = new FightingCard(
        'Sword',
        {
          damage: 0,
          defense: 0,
          health: 50,
          speed: 0,
          criticalChance: 0,
        },
        {
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition(1)),
        },
      );
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const attackStage = new AttackStage(player1, player2, eventBroker);

      it('should return the damage dealt and the status change', () => {
        const result = attackStage.computeNextAttack([attacker]);

        expect(result).toEqual([
          {
            kind: 'attack',
            attacker,
            defender,
            damage: 100,
            isCritical: false,
          },
          { kind: 'status_change', card: defender, status: 'dead' },
        ]);
      });
    });

    describe('when the attacker launch a special attack', () => {
      const attacker = new FightingCard(
        'Axe',
        {
          damage: 0,
          defense: 0,
          health: 1000,
          speed: 1,
          criticalChance: 0,
        },
        {
          specialAttack: new SpecialAttack(450, 0, new TargetedFromPosition(0)),
        },
      );
      const defender = new FightingCard(
        'Sword',
        {
          damage: 0,
          defense: 0,
          health: 1000,
          speed: 0,
          criticalChance: 0,
        },
        {
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition(1)),
        },
      );
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const attackStage = new AttackStage(player1, player2, eventBroker);

      it('should return the damage dealt and the status change', () => {
        const result = attackStage.computeNextAttack([attacker]);

        expect(result).toEqual([
          {
            kind: 'special_attack',
            attacker,
            defender,
            damage: 450,
            isCritical: false,
          },
        ]);
      });
    });

    describe('when the special attack hit all defender cards', () => {
      const attacker = new FightingCard(
        'Axe',
        {
          damage: 0,
          defense: 0,
          health: 1000,
          speed: 1,
          criticalChance: 0,
        },
        {
          specialAttack: new SpecialAttack(450, 0, new TargetedAll()),
        },
      );
      const defender1 = new FightingCard(
        'Sword',
        {
          damage: 0,
          defense: 120,
          health: 300,
          speed: 0,
          criticalChance: 0,
        },
        {
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition(1)),
        },
      );
      const defender2 = new FightingCard(
        'Sword',
        {
          damage: 0,
          defense: 200,
          health: 1000,
          speed: 0,
          criticalChance: 0,
        },
        {
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition(1)),
        },
      );
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender1, defender2]);

      const attackStage = new AttackStage(player1, player2, eventBroker);

      it('should return the damage dealt and the status change', () => {
        const result = attackStage.computeNextAttack([attacker]);
        console.log(JSON.stringify(result, null, 2));
        expect(result).toEqual([
          {
            kind: 'special_attack',
            attacker,
            defender: defender1,
            damage: 330,
            isCritical: false,
          },
          {
            kind: 'special_attack',
            attacker,
            defender: defender2,
            damage: 250,
            isCritical: false,
          },
          { kind: 'status_change', card: defender1, status: 'dead' },
        ]);
      });
    });
  });
});

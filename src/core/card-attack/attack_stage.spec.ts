import { AttackStage } from './attack_stage';
import { Player } from '../player';
import { FightingCard } from '../cards/fighting-card';

describe('AttackStage', () => {
  const eventBroker = {
    onCardDeath: [],
  };

  describe('computeNextAttack', () => {
    describe('without critical hit', () => {
      const attacker = new FightingCard('Axe', {
        damage: 10,
        defense: 0,
        health: 100,
        speed: 1,
        criticalChance: 0,
      });
      const defender = new FightingCard('Sword', {
        damage: 0,
        defense: 0,
        health: 100,
        speed: 0,
        criticalChance: 0,
      });
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
      const attacker = new FightingCard('Axe', {
        damage: 10,
        defense: 0,
        health: 100,
        speed: 1,
        criticalChance: 1,
      });
      const defender = new FightingCard('Sword', {
        damage: 0,
        defense: 0,
        health: 100,
        speed: 0,
        criticalChance: 0,
      });
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
      const attacker = new FightingCard('Axe', {
        damage: 100,
        defense: 0,
        health: 100,
        speed: 1,
        criticalChance: 0,
      });
      const defender = new FightingCard('Sword', {
        damage: 0,
        defense: 0,
        health: 50,
        speed: 0,
        criticalChance: 0,
      });
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
  });
});

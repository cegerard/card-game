import { AttackStage } from './attack_stage';
import { Player } from '../player';
import { FightingCard } from '../cards/fighting-card';
import { SpecialAttack } from '../cards/skills/special-attack';
import { TargetedFromPosition } from '../targeting-card-strategies/targeted-from-position';
import { TargetedAll } from '../targeting-card-strategies/targeted-all';
import { SimpleAttack } from '../cards/skills/simple-attack';

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
          simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
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
          simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
        },
      );
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const attackStage = new AttackStage(player1, player2, eventBroker);

      it('should return the damage dealt by the attacker', () => {
        const result = attackStage.computeNextAttack([attacker]);

        expect(result).toEqual([
          {
            kind: 'attack',
            attacker: attacker.identityInfo,
            defender: defender.identityInfo,
            damage: 10,
            isCritical: false,
          },
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
          simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
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
          simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
        },
      );
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const attackStage = new AttackStage(player1, player2, eventBroker);

      it('should return the damage dealt by the attacker', () => {
        const result = attackStage.computeNextAttack([attacker]);

        expect(result).toEqual([
          {
            kind: 'attack',
            attacker: attacker.identityInfo,
            defender: defender.identityInfo,
            damage: 20,
            isCritical: true,
          },
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
          simpleAttack: new SimpleAttack(1.2, new TargetedFromPosition()),
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
        },
      );
      const defender = new FightingCard(
        'Sword',
        {
          damage: 0,
          defense: 0,
          health: 120,
          speed: 0,
          criticalChance: 0,
        },
        {
          simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
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
            attacker: attacker.identityInfo,
            defender: defender.identityInfo,
            damage: 120,
            isCritical: false,
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
      const attacker = new FightingCard(
        'Axe',
        {
          damage: 1,
          defense: 0,
          health: 1000,
          speed: 1,
          criticalChance: 0,
        },
        {
          simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
          specialAttack: new SpecialAttack(450, 0, new TargetedFromPosition()),
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
          simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
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
            attacker: attacker.identityInfo,
            defender: defender.identityInfo,
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
          damage: 1,
          defense: 0,
          health: 1000,
          speed: 1,
          criticalChance: 0,
        },
        {
          simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
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
          simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
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
          simpleAttack: new SimpleAttack(1.0, new TargetedFromPosition()),
          specialAttack: new SpecialAttack(0, 10, new TargetedFromPosition()),
        },
      );
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender1, defender2]);

      const attackStage = new AttackStage(player1, player2, eventBroker);

      it('should return the damage dealt and the status change', () => {
        const result = attackStage.computeNextAttack([attacker]);
        expect(result).toEqual([
          {
            kind: 'special_attack',
            attacker: attacker.identityInfo,
            defender: defender1.identityInfo,
            damage: 330,
            isCritical: false,
          },
          {
            kind: 'special_attack',
            attacker: attacker.identityInfo,
            defender: defender2.identityInfo,
            damage: 250,
            isCritical: false,
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

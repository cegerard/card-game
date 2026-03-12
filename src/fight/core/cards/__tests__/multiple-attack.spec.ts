import { MultipleAttack } from '../skills/multiple-attack';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { createEffect } from '../../../../../test/helpers/effect';
import { Player } from '../../player';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';

const damages = [new DamageComposition(DamageType.PHYSICAL, 1.0)];

describe('MultipleAttack', () => {
  let attacker: FightingCard;
  let defender: FightingCard;
  let player1: Player;
  let player2: Player;
  let context: FightingContext;

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      defense: 0,
      criticalChance: 0,
      accuracy: 0,
    });
    defender = createFightingCard({ defense: 0, health: 10000, agility: 0 });
    player1 = new Player('p1', [attacker]);
    player2 = new Player('p2', [defender]);
    context = { sourcePlayer: player1, opponentPlayer: player2 };
  });

  describe('N hits without amplifier', () => {
    it('generates one result per hit', () => {
      const multipleAttack = new MultipleAttack(3, damages, new TargetedAll());
      const results = multipleAttack.launch(attacker, context);
      expect(results).toHaveLength(3);
    });

    it('all hits use base attack power', () => {
      const multipleAttack = new MultipleAttack(3, damages, new TargetedAll());
      const results = multipleAttack.launch(attacker, context);
      expect(results.every((r) => r.damage === 100)).toBe(true);
    });
  });

  describe('N hits with amplifier', () => {
    it('each successive hit deals more damage', () => {
      const multipleAttack = new MultipleAttack(
        3,
        damages,
        new TargetedAll(),
        0.5,
      );
      const results = multipleAttack.launch(attacker, context);
      expect(results[1].damage).toBeGreaterThan(results[0].damage);
    });

    it('second hit damage equals base times (1 + amplifier)', () => {
      const multipleAttack = new MultipleAttack(
        2,
        damages,
        new TargetedAll(),
        0.5,
      );
      const results = multipleAttack.launch(attacker, context);
      expect(results[1].damage).toBe(results[0].damage * 1.5);
    });
  });

  describe('dodge on individual hit', () => {
    let dodgeContext: FightingContext;

    beforeEach(() => {
      const dodger = createFightingCard({
        defense: 0,
        health: 10000,
        agility: 100,
      });
      const player2WithDodge = new Player('p2', [dodger]);
      dodgeContext = {
        sourcePlayer: player1,
        opponentPlayer: player2WithDodge,
      };
    });

    it('all hits dodge when defender agility exceeds attacker accuracy', () => {
      const multipleAttack = new MultipleAttack(2, damages, new TargetedAll());
      const results = multipleAttack.launch(attacker, dodgeContext);
      expect(results.every((r) => r.dodge)).toBe(true);
    });

    it('dodged hits have damage 0', () => {
      const multipleAttack = new MultipleAttack(2, damages, new TargetedAll());
      const results = multipleAttack.launch(attacker, dodgeContext);
      expect(results.every((r) => r.damage === 0)).toBe(true);
    });
  });

  describe('with effect', () => {
    it('applies effect on hit when configured', () => {
      const effect = createEffect({ type: 'poison', rate: 1.0, level: 1 });
      const multipleAttack = new MultipleAttack(
        2,
        damages,
        new TargetedAll(),
        0,
        effect,
      );
      const results = multipleAttack.launch(attacker, context);
      expect(results[0].effect).toBeDefined();
    });
  });

  describe('combo finisher', () => {
    const finisherDamages = [new DamageComposition(DamageType.PHYSICAL, 0.8)];

    it('adds a bonus hit when all hits land', () => {
      const multipleAttack = new MultipleAttack(
        2,
        damages,
        new TargetedAll(),
        0,
        undefined,
        finisherDamages,
      );
      const results = multipleAttack.launch(attacker, context);
      expect(results).toHaveLength(3);
    });

    it('last hit is equal to finisher damage rate', () => {
      const multipleAttack = new MultipleAttack(
        2,
        damages,
        new TargetedAll(),
        0,
        undefined,
        finisherDamages,
      );
      const results = multipleAttack.launch(attacker, context);
      expect(results[2].damage).toBe(80);
    });

    describe('when a hit is dodged', () => {
      let dodgeContext: FightingContext;

      beforeEach(() => {
        const dodger = createFightingCard({
          defense: 0,
          health: 10000,
          agility: 100,
        });
        const player2WithDodge = new Player('p2', [dodger]);
        dodgeContext = {
          sourcePlayer: player1,
          opponentPlayer: player2WithDodge,
        };
      });

      it('does not apply combo finisher', () => {
        const multipleAttack = new MultipleAttack(
          2,
          damages,
          new TargetedAll(),
          0,
          undefined,
          finisherDamages,
        );
        const results = multipleAttack.launch(attacker, dodgeContext);
        expect(results).toHaveLength(2);
      });
    });

    it('does not apply combo finisher when not configured', () => {
      const multipleAttack = new MultipleAttack(2, damages, new TargetedAll());
      const results = multipleAttack.launch(attacker, context);
      expect(results).toHaveLength(2);
    });
  });

  describe('dead target skipped between hits', () => {
    let weakContext: FightingContext;

    beforeEach(() => {
      const weakDefender = createFightingCard({
        defense: 0,
        health: 1,
        agility: 0,
      });
      const player2Weak = new Player('p2', [weakDefender]);
      weakContext = { sourcePlayer: player1, opponentPlayer: player2Weak };
    });

    it('skips dead target on subsequent hits', () => {
      const multipleAttack = new MultipleAttack(3, damages, new TargetedAll());
      const results = multipleAttack.launch(attacker, weakContext);
      expect(results).toHaveLength(1);
    });
  });
});

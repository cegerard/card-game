import { DeathSkillHandler } from '../death-skill-handler';
import { EndEventProcessor } from '../end-event-processor';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { AlterationSkill } from '../../cards/skills/alteration-skill';
import { TurnEnd } from '../../trigger/turn-end';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { StepKind } from '../@types/step';

describe('DeathSkillHandler', () => {
  describe('when an ally with a death-triggered healing skill survives', () => {
    const deadCardId = 'warrior-01';

    let handler: DeathSkillHandler;
    let player1: Player;
    let player2: Player;

    beforeEach(() => {
      const deadCard = createFightingCard({
        id: deadCardId,
        name: 'Warrior',
        attack: 100,
        defense: 100,
        health: 10,
        speed: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
          },
        },
      });

      const survivingCard = createFightingCard({
        id: 'healer-01',
        name: 'Healer',
        attack: 100,
        defense: 100,
        health: 5000,
        speed: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
          },
          others: [
            {
              effectRate: 0.5,
              trigger: 'ally-death',
              targetCardId: deadCardId,
              targetingStrategy: 'self',
            },
          ],
        },
      });

      const enemyCard = createFightingCard({
        id: 'enemy-01',
        name: 'Enemy',
        attack: 500,
        defense: 100,
        health: 5000,
        speed: 100,
        criticalChance: 0,
      });

      player1 = new Player('Player 1', [deadCard, survivingCard]);
      player2 = new Player('Player 2', [enemyCard]);
      handler = new DeathSkillHandler(player1, player2);

      // Kill the warrior
      deadCard.addRealDamage(10);
    });

    it('produces a healing step', () => {
      handler.notifyDeath(player1, player1.allCards[0]);
      const steps = handler.drainSteps();

      expect(steps[0].kind).toBe('healing');
    });

    it('drains steps only once', () => {
      handler.notifyDeath(player1, player1.allCards[0]);
      handler.drainSteps();

      expect(handler.drainSteps()).toHaveLength(0);
    });
  });

  describe('when no ally has a matching death trigger', () => {
    let handler: DeathSkillHandler;
    let player1: Player;
    let player2: Player;

    beforeEach(() => {
      const deadCard = createFightingCard({
        id: 'warrior-01',
        name: 'Warrior',
        health: 10,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
          },
        },
      });

      const survivingCard = createFightingCard({
        id: 'fighter-01',
        name: 'Fighter',
        health: 5000,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
          },
        },
      });

      player1 = new Player('Player 1', [deadCard, survivingCard]);
      player2 = new Player('Player 2', [createFightingCard({})]);
      handler = new DeathSkillHandler(player1, player2);

      deadCard.addRealDamage(10);
    });

    it('produces no steps', () => {
      handler.notifyDeath(player1, player1.allCards[0]);

      expect(handler.drainSteps()).toHaveLength(0);
    });
  });

  describe('when dead card has a non-exhausted lifecycle skill with endEvent', () => {
    let handler: DeathSkillHandler;
    let player1: Player;
    let player2: Player;
    let deadCard;
    let allyCard;

    beforeEach(() => {
      deadCard = createFightingCard({
        id: 'lion-01',
        name: 'Lion',
        health: 10,
        attack: 100,
        defense: 0,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
          },
        },
      });

      // Attach lifecycle skill to deadCard after creation
      const lifecycleSkill = new AlterationSkill({
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.4,
        duration: Infinity,
        trigger: new TurnEnd(),
        targetingStrategy: new Launcher(),
        activationLimit: 3,
        endEvent: 'lions-end',
        terminationEvent: 'lions-end',
      });
      (deadCard as any).skills = [lifecycleSkill];

      allyCard = createFightingCard({
        id: 'ally-01',
        name: 'Ally',
        health: 5000,
        attack: 100,
        defense: 0,
        criticalChance: 0,
      });
      // Give the ally card an event-bound buff
      allyCard.applyBuff('attack', 0.4, Infinity, 'lions-end');

      player1 = new Player('Player 1', [deadCard, allyCard]);
      player2 = new Player('Player 2', [createFightingCard({})]);
      const endEventProcessor = new EndEventProcessor(player1, player2);
      handler = new DeathSkillHandler(player1, player2, endEventProcessor);

      deadCard.addRealDamage(10);
    });

    it('produces a buff_removed step after death', () => {
      handler.notifyDeath(player1, deadCard);
      const steps = handler.drainSteps();

      expect(steps.some((s) => s.kind === StepKind.BuffRemoved)).toBe(true);
    });

    it('the buff_removed step is immediately after the death event processing', () => {
      handler.notifyDeath(player1, deadCard);
      const steps = handler.drainSteps();
      const buffRemovedStep = steps.find(
        (s) => s.kind === StepKind.BuffRemoved,
      );

      expect((buffRemovedStep as any).eventName).toBe('lions-end');
    });
  });
});

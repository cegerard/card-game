import { Fight } from '../fight-simulator/fight';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';

describe('Ally death trigger', () => {
  describe('when ally dies and surviving card has healing on ally-death', () => {
    const deadCardId = 'warrior-01';
    let cardA: FightingCard;
    let cardB: FightingCard;
    let enemyCard: FightingCard;
    let player1: Player;
    let player2: Player;
    let fight: Fight;

    beforeEach(() => {
      cardA = createFightingCard({
        id: deadCardId,
        name: 'Warrior',
        attack: 10,
        defense: 0,
        health: 1,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'target-all',
          },
          special: {
            kind: 'specialAttack',
            targetingStrategy: 'target-all',
          },
        },
      });

      cardB = createFightingCard({
        id: 'healer-01',
        name: 'Healer',
        attack: 100,
        defense: 0,
        health: 5000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'target-all',
          },
          special: {
            kind: 'specialAttack',
            targetingStrategy: 'target-all',
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

      enemyCard = createFightingCard({
        id: 'enemy-01',
        name: 'Enemy',
        attack: 100,
        defense: 0,
        health: 5000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'target-all',
          },
          special: {
            kind: 'specialAttack',
            targetingStrategy: 'target-all',
          },
        },
      });

      player1 = new Player('Player 1', [cardA, cardB]);
      player2 = new Player('Player 2', [enemyCard]);

      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('contains a healing step after the death', () => {
      const result = fight.start();
      const stepEntries = Object.entries(result) as [string, any][];

      const deathStepIndex = stepEntries.findIndex(
        ([_, s]) =>
          s.kind === 'status_change' &&
          s.card?.name === 'Warrior' &&
          s.status === 'dead',
      );

      expect(deathStepIndex).toBeGreaterThan(-1);

      const stepsAfterDeath = stepEntries
        .slice(deathStepIndex + 1)
        .map(([_, s]) => s);

      const healingStep = stepsAfterDeath.find(
        (s) => s.kind === 'healing' && s.source?.name === 'Healer',
      );

      expect(healingStep).toBeDefined();
    });
  });

  describe('when ally dies and surviving card has buff on ally-death', () => {
    const deadCardId = 'tank-01';
    let cardA: FightingCard;
    let cardB: FightingCard;
    let enemyCard: FightingCard;
    let player1: Player;
    let player2: Player;
    let fight: Fight;

    beforeEach(() => {
      cardA = createFightingCard({
        id: deadCardId,
        name: 'Tank',
        attack: 10,
        defense: 0,
        health: 1,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'target-all',
          },
          special: {
            kind: 'specialAttack',
            targetingStrategy: 'target-all',
          },
        },
      });

      cardB = createFightingCard({
        id: 'avenger-01',
        name: 'Avenger',
        attack: 100,
        defense: 100,
        health: 5000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'target-all',
          },
          special: {
            kind: 'specialAttack',
            targetingStrategy: 'target-all',
          },
          others: [
            {
              buffType: 'attack' as const,
              buffRate: 0.5,
              duration: 3,
              trigger: 'ally-death',
              targetCardId: deadCardId,
              targetingStrategy: 'self',
            },
          ],
        },
      });

      enemyCard = createFightingCard({
        id: 'enemy-01',
        name: 'Enemy',
        attack: 100,
        defense: 0,
        health: 5000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'target-all',
          },
          special: {
            kind: 'specialAttack',
            targetingStrategy: 'target-all',
          },
        },
      });

      player1 = new Player('Player 1', [cardA, cardB]);
      player2 = new Player('Player 2', [enemyCard]);

      fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );
    });

    it('triggers buff on ally when tank dies', () => {
      const result = fight.start();
      const steps = Object.values(result) as any[];

      const buffStep = steps.find(
        (s) => s.kind === 'buff' && s.source?.name === 'Avenger',
      );

      expect(buffStep).toBeDefined();
    });
  });
});

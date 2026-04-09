import { Fight } from '../fight-simulator/fight';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';
import { Healing } from '../cards/skills/healing';
import { DynamicTrigger } from '../trigger/dynamic-trigger';
import { AllyDeath } from '../trigger/ally-death';
import { EnemyDeath } from '../trigger/enemy-death';
import { Launcher } from '../targeting-card-strategies/launcher';

describe('Dynamic trigger integration', () => {
  const allyId = 'warrior-01';
  const enemyId = 'enemy-01';

  describe('when ally dies and dormant skill activates on enemy death', () => {
    let allyCard: FightingCard;
    let healerCard: FightingCard;
    let enemyCard1: FightingCard;
    let enemyCard2: FightingCard;
    let player1: Player;
    let player2: Player;

    beforeEach(() => {
      allyCard = createFightingCard({
        id: allyId,
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
            targetingStrategy: 'position-based',
          },
        },
      });

      healerCard = createFightingCard({
        id: 'healer-01',
        name: 'Healer',
        attack: 500,
        defense: 0,
        health: 10000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'position-based',
          },
        },
      });

      // Attach dormant healing skill manually
      const dormantTrigger = new DynamicTrigger(
        new AllyDeath(allyId),
        (cardId) => new EnemyDeath(cardId),
      );
      const dormantHealingSkill = new Healing(
        0.5,
        dormantTrigger,
        new Launcher(),
      );
      (healerCard as any).skills = [dormantHealingSkill];

      enemyCard1 = createFightingCard({
        id: enemyId,
        name: 'Enemy1',
        attack: 100,
        defense: 0,
        health: 100,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'position-based',
          },
        },
      });

      enemyCard2 = createFightingCard({
        id: 'enemy-02',
        name: 'Enemy2',
        attack: 100,
        defense: 0,
        health: 10000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'position-based',
          },
        },
      });

      player1 = new Player('Player 1', [allyCard, healerCard]);
      player2 = new Player('Player 2', [enemyCard1, enemyCard2]);
    });

    it('produces a healing step after enemy dies once dormant skill is activated', () => {
      const fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );

      const result = fight.start();
      const stepEntries = Object.entries(result) as [string, any][];

      const allyDeathIndex = stepEntries.findIndex(
        ([_, s]) =>
          s.kind === 'status_change' &&
          s.card?.name === 'Warrior' &&
          s.status === 'dead',
      );

      expect(allyDeathIndex).toBeGreaterThan(-1);

      const enemyDeathIndex = stepEntries.findIndex(
        ([_, s]) =>
          s.kind === 'status_change' &&
          s.card?.name === 'Enemy1' &&
          s.status === 'dead',
      );

      expect(enemyDeathIndex).toBeGreaterThan(allyDeathIndex);

      const healingAfterEnemyDeath = stepEntries
        .slice(enemyDeathIndex + 1)
        .find(([_, s]) => s.kind === 'healing' && s.source?.name === 'Healer');

      expect(healingAfterEnemyDeath).toBeDefined();
    });
  });

  describe('when ally never dies', () => {
    it('dormant skill never fires', () => {
      const allyCard = createFightingCard({
        id: allyId,
        name: 'Warrior',
        attack: 500,
        defense: 0,
        health: 10000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'position-based',
          },
        },
      });

      const healerCard = createFightingCard({
        id: 'healer-01',
        name: 'Healer',
        attack: 500,
        defense: 0,
        health: 10000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'position-based',
          },
        },
      });

      const dormantTrigger = new DynamicTrigger(
        new AllyDeath(allyId),
        (cardId) => new EnemyDeath(cardId),
      );
      (healerCard as any).skills = [
        new Healing(0.5, dormantTrigger, new Launcher()),
      ];

      const enemyCard = createFightingCard({
        id: enemyId,
        name: 'Enemy',
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
            targetingStrategy: 'position-based',
          },
        },
      });

      const player1 = new Player('Player 1', [allyCard, healerCard]);
      const player2 = new Player('Player 2', [enemyCard]);

      const fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );

      const result = fight.start();
      const stepEntries = Object.entries(result) as [string, any][];

      const healingFromHealer = stepEntries.filter(
        ([_, s]) => s.kind === 'healing' && s.source?.name === 'Healer',
      );

      expect(healingFromHealer).toHaveLength(0);
    });
  });

  describe('when a different ally dies', () => {
    it('dormant skill stays dormant', () => {
      const otherAlly = createFightingCard({
        id: 'other-ally',
        name: 'OtherAlly',
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
            targetingStrategy: 'position-based',
          },
        },
      });

      const healerCard = createFightingCard({
        id: 'healer-01',
        name: 'Healer',
        attack: 500,
        defense: 0,
        health: 10000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'position-based',
          },
        },
      });

      const dormantTrigger = new DynamicTrigger(
        new AllyDeath(allyId),
        (cardId) => new EnemyDeath(cardId),
      );
      (healerCard as any).skills = [
        new Healing(0.5, dormantTrigger, new Launcher()),
      ];

      const enemyCard = createFightingCard({
        id: enemyId,
        name: 'Enemy',
        attack: 100,
        defense: 0,
        health: 1,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'position-based',
          },
        },
      });

      const player1 = new Player('Player 1', [otherAlly, healerCard]);
      const player2 = new Player('Player 2', [enemyCard]);

      const fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );

      const result = fight.start();
      const stepEntries = Object.entries(result) as [string, any][];

      const healingFromHealer = stepEntries.filter(
        ([_, s]) => s.kind === 'healing' && s.source?.name === 'Healer',
      );

      expect(healingFromHealer).toHaveLength(0);
    });
  });

  describe('when skill owner dies before activation', () => {
    it('skill never activates', () => {
      const allyCard = createFightingCard({
        id: allyId,
        name: 'Warrior',
        attack: 10,
        defense: 0,
        health: 10000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'target-all',
          },
        },
      });

      const healerCard = createFightingCard({
        id: 'healer-01',
        name: 'Healer',
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
        },
      });

      const dormantTrigger = new DynamicTrigger(
        new AllyDeath(allyId),
        (cardId) => new EnemyDeath(cardId),
      );
      (healerCard as any).skills = [
        new Healing(0.5, dormantTrigger, new Launcher()),
      ];

      const enemyCard = createFightingCard({
        id: enemyId,
        name: 'Enemy',
        attack: 100,
        defense: 0,
        health: 10000,
        speed: 50,
        agility: 0,
        accuracy: 100,
        criticalChance: 0,
        skills: {
          simpleAttack: {
            damages: [new DamageComposition(DamageType.PHYSICAL, 1.0)],
            targetingStrategy: 'target-all',
          },
        },
      });

      const player1 = new Player('Player 1', [allyCard, healerCard]);
      const player2 = new Player('Player 2', [enemyCard]);

      const fight = new Fight(
        player1,
        player2,
        new PlayerByPlayerCardSelector(player1, player2),
      );

      const result = fight.start();
      const stepEntries = Object.entries(result) as [string, any][];

      const healingFromHealer = stepEntries.filter(
        ([_, s]) => s.kind === 'healing' && s.source?.name === 'Healer',
      );

      expect(healingFromHealer).toHaveLength(0);
    });
  });
});

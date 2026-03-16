import { Fight } from '../fight-simulator/fight';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { FightingCard } from '../cards/fighting-card';

describe('Ally death trigger', () => {
  describe('when ally dies and surviving card has a self healing on ally-death', () => {
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

      const nextStep = stepEntries[deathStepIndex + 1];

      expect(nextStep[1]).toMatchObject({
        kind: 'healing',
        source: {
          name: 'Healer',
        },
      });
    });
  });
});

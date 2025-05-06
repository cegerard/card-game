import 'reflect-metadata';

import { Effect, FightDataDto, SpecialKind } from './dto/fight-data.dto';
import { FightController } from './fight.controller';
import { FightingCard } from '../core/cards/fighting-card';
import { FakeFightService } from '../../../test/fake/fake-fight-service';

describe('FightController', () => {
  const fakeFightService = new FakeFightService();
  const fightController = new FightController(fakeFightService);

  let fightData: FightDataDto;
  describe('when a player use a card with a special attack', () => {
    const specialAttack = {
      kind: SpecialKind.ATTACK,
      name: 'Double Strike',
      rate: 2.0,
      energy: 100,
      targetingStrategy: 'target-all',
    };

    describe('and the special attack has a poisoned effect', () => {
      const effect = {
        type: Effect.POISON,
        rate: 0.5,
        level: 2,
      };

      beforeEach(() => {
        const poisonedSpecialAttack = {
          ...specialAttack,
          effect,
        };

        fightData = {
          cardSelectorStrategy: 'player-by-player',
          player1: {
            name: 'Player 1',
            deck: [
              {
                name: 'Axe',
                attack: 10,
                defense: 6,
                health: 100,
                speed: 3,
                agility: 25,
                accuracy: 15,
                criticalChance: 0.05,
                skills: {
                  special: poisonedSpecialAttack,
                  simpleAttack: {
                    name: 'Simple Attack',
                    damageRate: 1.0,
                    targetingStrategy: 'position-based',
                  },
                  others: [],
                },
                behaviors: {
                  dodge: 'simple-dodge',
                },
              },
            ],
          },
          player2: {
            name: 'Player 2',
            deck: [],
          },
        };

        fightController.startFight(fightData);
      });

      it('creates a fighting card with a poisoned special attack effect', () => {
        const validation = (card: FightingCard) => {
          const jsonCard = JSON.parse(JSON.stringify(card));

          expect(jsonCard.special).toBeDefined();
          expect(jsonCard.special.effect).toBeDefined();
          expect(jsonCard.special.effect.type).toBe('poisoned');
          expect(jsonCard.special.effect.rate).toBe(0.5);
          expect(jsonCard.special.effect.level).toBe(2);
        };

        fakeFightService.playersNthCardValidate('Player 1', 0, validation);
      });
    });

    describe('and the special attack has a burned effect', () => {
      const effect = {
        type: Effect.BURN,
        rate: 0.2,
        level: 3,
      };

      beforeEach(() => {
        const burnedSpecialAttack = {
          ...specialAttack,
          effect,
        };

        fightData = {
          cardSelectorStrategy: 'player-by-player',
          player1: {
            name: 'Player 1',
            deck: [
              {
                name: 'Axe',
                attack: 10,
                defense: 6,
                health: 100,
                speed: 3,
                agility: 25,
                accuracy: 15,
                criticalChance: 0.05,
                skills: {
                  special: burnedSpecialAttack,
                  simpleAttack: {
                    name: 'Simple Attack',
                    damageRate: 1.0,
                    targetingStrategy: 'position-based',
                  },
                  others: [],
                },
                behaviors: {
                  dodge: 'simple-dodge',
                },
              },
            ],
          },
          player2: {
            name: 'Player 2',
            deck: [],
          },
        };

        fightController.startFight(fightData);
      });

      it('creates a fighting card with a burned special attack effect', () => {
        const validation = (card: FightingCard) => {
          const jsonCard = JSON.parse(JSON.stringify(card));

          expect(jsonCard.special).toBeDefined();
          expect(jsonCard.special.effect).toBeDefined();
          expect(jsonCard.special.effect.type).toBe('burned');
          expect(jsonCard.special.effect.rate).toBe(0.2);
          expect(jsonCard.special.effect.level).toBe(3);
        };

        fakeFightService.playersNthCardValidate('Player 1', 0, validation);
      });
    });
  });
});

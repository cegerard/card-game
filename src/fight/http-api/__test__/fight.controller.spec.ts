import 'reflect-metadata';

import {
  DodgeStrategy,
  Effect,
  FightDataDto,
  SkillKind,
  SpecialKind,
  TargetingStrategy,
  TriggerEvent,
} from '../dto/fight-data.dto';
import { FightController } from '../fight.controller';
import { FightingCard } from '../../core/cards/fighting-card';
import { FakeFightService } from './fake-fight-service';

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
      targetingStrategy: TargetingStrategy.TARGET_ALL,
    };

    describe('and the special attack has a poisoned effect', () => {
      beforeEach(() => {
        const effect = {
          type: Effect.POISON,
          rate: 0.5,
          level: 2,
        };

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
                    targetingStrategy: TargetingStrategy.POSITION_BASED,
                  },
                  others: [],
                },
                behaviors: {
                  dodge: DodgeStrategy.SIMPLE_DODGE,
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

        fakeFightService.validatePlayer1FirstCard(validation);
      });
    });

    describe('and the special attack has a burned effect', () => {
      beforeEach(() => {
        const effect = {
          type: Effect.BURN,
          rate: 0.2,
          level: 3,
        };

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
                    targetingStrategy: TargetingStrategy.POSITION_BASED,
                  },
                  others: [],
                },
                behaviors: {
                  dodge: DodgeStrategy.SIMPLE_DODGE,
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

        fakeFightService.validatePlayer1FirstCard(validation);
      });
    });

    describe('and the special attack has a freeze effect', () => {
      beforeEach(() => {
        const effect = {
          type: Effect.FREEZE,
          rate: 0.2,
          level: 2,
        };

        const freezeSpecialAttack = {
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
                  special: freezeSpecialAttack,
                  simpleAttack: {
                    name: 'Simple Attack',
                    damageRate: 1.0,
                    targetingStrategy: TargetingStrategy.POSITION_BASED,
                  },
                  others: [],
                },
                behaviors: {
                  dodge: DodgeStrategy.SIMPLE_DODGE,
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

      it('creates a fighting card with a freeze special attack effect', () => {
        const validation = (card: FightingCard) => {
          const jsonCard = JSON.parse(JSON.stringify(card));

          expect(jsonCard.special).toBeDefined();
          expect(jsonCard.special.effect).toBeDefined();
          expect(jsonCard.special.effect.type).toBe('frozen');
          expect(jsonCard.special.effect.rate).toBe(0.2);
          expect(jsonCard.special.effect.level).toBe(2);
        };

        fakeFightService.validatePlayer1FirstCard(validation);
      });
    });
  });

  describe('when a player use a card with a special healing', () => {
    beforeEach(() => {
      const specialHealing = {
        name: 'heal me',
        kind: SpecialKind.HEALING,
        rate: 2.0,
        energy: 100,
        targetingStrategy: TargetingStrategy.SELF,
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
                special: specialHealing,
                simpleAttack: {
                  name: 'Simple Attack',
                  damageRate: 1.0,
                  targetingStrategy: TargetingStrategy.POSITION_BASED,
                },
                others: [],
              },
              behaviors: {
                dodge: DodgeStrategy.SIMPLE_DODGE,
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

    it('creates a fighting card with a special healing', () => {
      const validation = (card: FightingCard) => {
        const jsonCard = JSON.parse(JSON.stringify(card));

        expect(jsonCard.special).toEqual({
          rate: 2.0,
          energyNeeded: 100,
          targetingStrategy: {
            id: 'launcher',
          },
        });
      };

      fakeFightService.validatePlayer1FirstCard(validation);
    });
  });

  describe('when a player use a card with a only a simple attack', () => {
    const simpleAttack = {
      name: 'Strike',
      damageRate: 2.0,
      targetingStrategy: TargetingStrategy.POSITION_BASED,
    };

    describe('and the simple attack has a poisoned effect', () => {
      beforeEach(() => {
        const effect = {
          type: Effect.POISON,
          rate: 0.5,
          level: 2,
        };

        const poisonedSimpleAttack = {
          ...simpleAttack,
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
                  special: {
                    name: 'No Special Attack',
                    kind: SpecialKind.ATTACK,
                    rate: 0,
                    energy: 0,
                    targetingStrategy: TargetingStrategy.POSITION_BASED,
                  },
                  simpleAttack: poisonedSimpleAttack,
                  others: [],
                },
                behaviors: {
                  dodge: DodgeStrategy.SIMPLE_DODGE,
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

      it('creates a fighting card with a poisoned simple attack effect', () => {
        const validation = (card: FightingCard) => {
          const jsonCard = JSON.parse(JSON.stringify(card));

          expect(jsonCard.simpleAttack).toBeDefined();
          expect(jsonCard.simpleAttack.effect).toBeDefined();
          expect(jsonCard.simpleAttack.effect.type).toBe('poisoned');
          expect(jsonCard.simpleAttack.effect.rate).toBe(0.5);
          expect(jsonCard.simpleAttack.effect.level).toBe(2);
        };

        fakeFightService.validatePlayer1FirstCard(validation);
      });
    });

    describe('and the simple attack has a burned effect', () => {
      beforeEach(() => {
        const effect = {
          type: Effect.BURN,
          rate: 0.2,
          level: 3,
        };

        const burnedSimpleAttack = {
          ...simpleAttack,
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
                  special: {
                    name: 'No Special Attack',
                    kind: SpecialKind.ATTACK,
                    rate: 0,
                    energy: 0,
                    targetingStrategy: TargetingStrategy.POSITION_BASED,
                  },
                  simpleAttack: burnedSimpleAttack,
                  others: [],
                },
                behaviors: {
                  dodge: DodgeStrategy.SIMPLE_DODGE,
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

          expect(jsonCard.simpleAttack).toBeDefined();
          expect(jsonCard.simpleAttack.effect).toBeDefined();
          expect(jsonCard.simpleAttack.effect.type).toBe('burned');
          expect(jsonCard.simpleAttack.effect.rate).toBe(0.2);
          expect(jsonCard.simpleAttack.effect.level).toBe(3);
        };

        fakeFightService.validatePlayer1FirstCard(validation);
      });
    });

    describe('and the simple attack has a freeze effect', () => {
      beforeEach(() => {
        const effect = {
          type: Effect.FREEZE,
          rate: 0.2,
          level: 2,
        };

        const freezeSimpleAttack = {
          ...simpleAttack,
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
                  special: {
                    name: 'No Special Attack',
                    kind: SpecialKind.ATTACK,
                    rate: 0,
                    energy: 0,
                    targetingStrategy: TargetingStrategy.POSITION_BASED,
                  },
                  simpleAttack: freezeSimpleAttack,
                  others: [],
                },
                behaviors: {
                  dodge: DodgeStrategy.SIMPLE_DODGE,
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

      it('creates a fighting card with a freeze simple attack effect', () => {
        const validation = (card: FightingCard) => {
          const jsonCard = JSON.parse(JSON.stringify(card));

          expect(jsonCard.simpleAttack).toBeDefined();
          expect(jsonCard.simpleAttack.effect).toBeDefined();
          expect(jsonCard.simpleAttack.effect.type).toBe('frozen');
          expect(jsonCard.simpleAttack.effect.rate).toBe(0.2);
          expect(jsonCard.simpleAttack.effect.level).toBe(2);
        };

        fakeFightService.validatePlayer1FirstCard(validation);
      });
    });
  });

  describe('when a player use a card with a simple dodge strategy', () => {
    const dodgeStrategy = DodgeStrategy.SIMPLE_DODGE;

    beforeEach(() => {
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
                special: {
                  name: 'No Special Attack',
                  kind: SpecialKind.ATTACK,
                  rate: 0,
                  energy: 0,
                  targetingStrategy: TargetingStrategy.POSITION_BASED,
                },
                simpleAttack: {
                  name: 'Strike',
                  damageRate: 2.0,
                  targetingStrategy: TargetingStrategy.TARGET_ALL,
                },
                others: [],
              },
              behaviors: {
                dodge: dodgeStrategy,
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

    it('creates a fighting card with a dodge strategy', () => {
      const validation = (card: FightingCard) => {
        const jsonCard = JSON.parse(JSON.stringify(card));

        expect(jsonCard.dodgeBehavior).toEqual({
          id: 'simple',
        });
      };

      fakeFightService.validatePlayer1FirstCard(validation);
    });
  });

  describe('when a player use a card with a random dodge strategy', () => {
    const dodgeStrategy = DodgeStrategy.RANDOM_DODGE;

    beforeEach(() => {
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
                special: {
                  name: 'No Special Attack',
                  kind: SpecialKind.ATTACK,
                  rate: 0,
                  energy: 0,
                  targetingStrategy: TargetingStrategy.POSITION_BASED,
                },
                simpleAttack: {
                  name: 'Strike',
                  damageRate: 2.0,
                  targetingStrategy: TargetingStrategy.TARGET_ALL,
                },
                others: [],
              },
              behaviors: {
                dodge: dodgeStrategy,
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

    it('creates a fighting card with a dodge strategy', () => {
      const validation = (card: FightingCard) => {
        const jsonCard = JSON.parse(JSON.stringify(card));

        expect(jsonCard.dodgeBehavior).toEqual({
          id: 'random',
          randomizer: {},
        });
      };

      fakeFightService.validatePlayer1FirstCard(validation);
    });
  });

  describe('when a player use a healing skill triggered at turn end', () => {
    beforeEach(() => {
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
                special: {
                  name: 'No Special Attack',
                  kind: SpecialKind.ATTACK,
                  rate: 0,
                  energy: 0,
                  targetingStrategy: TargetingStrategy.ALL_OWNER_CARD,
                },
                simpleAttack: {
                  name: 'Slice',
                  damageRate: 2.0,
                  targetingStrategy: TargetingStrategy.LINE_THREE,
                },
                others: [
                  {
                    kind: SkillKind.HEALING,
                    name: 'heal',
                    rate: 1,
                    event: TriggerEvent.TURN_END,
                    targetingStrategy: TargetingStrategy.ALL_ALLIES,
                  },
                ],
              },
              behaviors: {
                dodge: DodgeStrategy.RANDOM_DODGE,
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

    it('creates a fighting card with the healing skill', () => {
      const validation = (card: FightingCard) => {
        const jsonCard = JSON.parse(JSON.stringify(card));

        expect(jsonCard.skills[0]).toEqual({
          id: 'healing-skill',
          effectRate: 1,
          trigger: { id: 'turn-end' },
          targetingStrategy: { id: 'all-allies' },
        });
      };

      fakeFightService.validatePlayer1FirstCard(validation);
    });
  });
});

import 'reflect-metadata';

import {
  CardSelectorStrategy,
  DamageType,
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
import { FightSimulatorStub } from './fight-simulator-stub';
import { Player } from '../../core/player';
import { CardSelector } from '../../core/fight-simulator/card-selectors/card-selector';

describe('FightController', () => {
  let fightSimulatorStub: FightSimulatorStub;
  let fightController: FightController;
  const builder = (player1: Player, _1: any, cardSelector: CardSelector) => {
    fightSimulatorStub = new FightSimulatorStub(player1, cardSelector);
    return fightSimulatorStub;
  };

  beforeEach(() => {
    fightController = new FightController(builder);
  });

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
          cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
          player1: {
            name: 'Player 1',
            deck: [
              {
                id: 'axe-01',
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
                    damages: [{ type: DamageType.PHYSICAL, rate: 1.0 }],
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

      it('creates a fighting card with a special defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special).toBeDefined();
        });
      });

      it('creates a fighting card with a special effect defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect).toBeDefined();
        });
      });

      it('creates a fighting card with a poisoned special attack effect type', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect.type).toBe(
            'poison',
          );
        });
      });

      it('creates a fighting card with a poisoned special attack effect rate', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect.rate).toBe(
            0.5,
          );
        });
      });

      it('creates a fighting card with a poisoned special attack effect level', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect.level).toBe(2);
        });
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
          cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
          player1: {
            name: 'Player 1',
            deck: [
              {
                id: 'axe-01',
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
                    damages: [{ type: DamageType.PHYSICAL, rate: 1.0 }],
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

      it('creates a fighting card with a special defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special).toBeDefined();
        });
      });

      it('creates a fighting card with a special effect defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect).toBeDefined();
        });
      });

      it('creates a fighting card with a burned special attack effect type', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect.type).toBe(
            'burn',
          );
        });
      });

      it('creates a fighting card with a burned special attack effect rate', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect.rate).toBe(
            0.2,
          );
        });
      });

      it('creates a fighting card with a burned special attack effect level', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect.level).toBe(3);
        });
      });
    });

    describe('and the special attack effect has a terminationEvent', () => {
      beforeEach(() => {
        const effect = {
          type: Effect.BURN,
          rate: 0.3,
          level: 1,
          terminationEvent: 'fire-shield-end',
        };

        fightData = {
          cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
          player1: {
            name: 'Player 1',
            deck: [
              {
                id: 'axe-01',
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
                    ...specialAttack,
                    effect,
                  },
                  simpleAttack: {
                    name: 'Simple Attack',
                    damages: [{ type: DamageType.PHYSICAL, rate: 1.0 }],
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

      it('maps terminationEvent to the special attack effect', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).special.effect.terminationEvent,
          ).toBe('fire-shield-end');
        });
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
          cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
          player1: {
            name: 'Player 1',
            deck: [
              {
                id: 'axe-01',
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
                    damages: [{ type: DamageType.PHYSICAL, rate: 1.0 }],
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

      it('creates a fighting card with a special defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special).toBeDefined();
        });
      });

      it('creates a fighting card with a special effect defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect).toBeDefined();
        });
      });

      it('creates a fighting card with a freeze special attack effect type', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect.type).toBe(
            'freeze',
          );
        });
      });

      it('creates a fighting card with a freeze special attack effect rate', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect.rate).toBe(
            0.2,
          );
        });
      });

      it('creates a fighting card with a freeze special attack effect level', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).special.effect.level).toBe(2);
        });
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
        cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
        player1: {
          name: 'Player 1',
          deck: [
            {
              id: 'axe-01',
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
                  damages: [{ type: DamageType.PHYSICAL, rate: 1.0 }],
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

      fightSimulatorStub.validatePlayer1FirstCard(validation);
    });
  });

  describe('when a player use a card with a only a simple attack', () => {
    const simpleAttack = {
      name: 'Strike',
      damages: [{ type: DamageType.PHYSICAL, rate: 2.0 }],
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
          cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
          player1: {
            name: 'Player 1',
            deck: [
              {
                id: 'axe-01',
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

      it('creates a fighting card with a simple attack defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).simpleAttack).toBeDefined();
        });
      });

      it('creates a fighting card with a simple attack effect defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect,
          ).toBeDefined();
        });
      });

      it('creates a fighting card with a poisoned simple attack effect type', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect.type,
          ).toBe('poison');
        });
      });

      it('creates a fighting card with a poisoned simple attack effect rate', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect.rate,
          ).toBe(0.5);
        });
      });

      it('creates a fighting card with a poisoned simple attack effect level', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect.level,
          ).toBe(2);
        });
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
          cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
          player1: {
            name: 'Player 1',
            deck: [
              {
                id: 'axe-01',
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

      it('creates a fighting card with a simple attack defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).simpleAttack).toBeDefined();
        });
      });

      it('creates a fighting card with a simple attack effect defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect,
          ).toBeDefined();
        });
      });

      it('creates a fighting card with a burned simple attack effect type', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect.type,
          ).toBe('burn');
        });
      });

      it('creates a fighting card with a burned simple attack effect rate', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect.rate,
          ).toBe(0.2);
        });
      });

      it('creates a fighting card with a burned simple attack effect level', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect.level,
          ).toBe(3);
        });
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
          cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
          player1: {
            name: 'Player 1',
            deck: [
              {
                id: 'axe-01',
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

      it('creates a fighting card with a simple attack defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(JSON.parse(JSON.stringify(card)).simpleAttack).toBeDefined();
        });
      });

      it('creates a fighting card with a simple attack effect defined', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect,
          ).toBeDefined();
        });
      });

      it('creates a fighting card with a freeze simple attack effect type', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect.type,
          ).toBe('freeze');
        });
      });

      it('creates a fighting card with a freeze simple attack effect rate', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect.rate,
          ).toBe(0.2);
        });
      });

      it('creates a fighting card with a freeze simple attack effect level', () => {
        fightSimulatorStub.validatePlayer1FirstCard((card) => {
          expect(
            JSON.parse(JSON.stringify(card)).simpleAttack.effect.level,
          ).toBe(2);
        });
      });
    });

    describe('and the simple attack effect has a terminationEvent', () => {
      beforeEach(() => {
        const effect = {
          type: Effect.BURN,
          rate: 0.3,
          level: 1,
          terminationEvent: 'fire-shield-end',
        };

        fightData = {
          cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
          player1: {
            name: 'Player 1',
            deck: [
              {
                id: 'axe-01',
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
                    ...simpleAttack,
                    effect,
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

      it('maps terminationEvent to the attack effect', () => {
        const validation = (card: FightingCard) => {
          const jsonCard = JSON.parse(JSON.stringify(card));

          expect(jsonCard.simpleAttack.effect.terminationEvent).toBe(
            'fire-shield-end',
          );
        };

        fightSimulatorStub.validatePlayer1FirstCard(validation);
      });
    });
  });

  describe('when a player use a card with a simple dodge strategy', () => {
    const dodgeStrategy = DodgeStrategy.SIMPLE_DODGE;

    beforeEach(() => {
      fightData = {
        cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
        player1: {
          name: 'Player 1',
          deck: [
            {
              id: 'axe-01',
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
                  damages: [{ type: DamageType.PHYSICAL, rate: 2.0 }],
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

      fightSimulatorStub.validatePlayer1FirstCard(validation);
    });
  });

  describe('when a player use a card with a random dodge strategy', () => {
    const dodgeStrategy = DodgeStrategy.RANDOM_DODGE;

    beforeEach(() => {
      fightData = {
        cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
        player1: {
          name: 'Player 1',
          deck: [
            {
              id: 'axe-01',
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
                  damages: [{ type: DamageType.PHYSICAL, rate: 2.0 }],
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

      fightSimulatorStub.validatePlayer1FirstCard(validation);
    });
  });

  describe('when a player use a healing skill triggered at turn end', () => {
    beforeEach(() => {
      fightData = {
        cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
        player1: {
          name: 'Player 1',
          deck: [
            {
              id: 'axe-01',
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
                  damages: [{ type: DamageType.PHYSICAL, rate: 2.0 }],
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

      fightSimulatorStub.validatePlayer1FirstCard(validation);
    });
  });

  describe('when the fight use the speed weighted card selector', () => {
    beforeEach(() => {
      fightData = {
        cardSelectorStrategy: CardSelectorStrategy.SPEED_WEIGHTED,
        player1: {
          name: 'Player 1',
          deck: [
            {
              id: 'axe-01',
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
                  damages: [{ type: DamageType.PHYSICAL, rate: 2.0 }],
                  targetingStrategy: TargetingStrategy.LINE_THREE,
                },
                others: [],
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

    it('creates a fight based on the speed weighted card strategy', () => {
      const validation = (cardSelector: CardSelector) => {
        const jsonCardSelector = JSON.parse(JSON.stringify(cardSelector));

        expect(jsonCardSelector.id).toEqual('speed-weighted');
      };

      fightSimulatorStub.validateCardSelectorStrategy(validation);
    });
  });

  describe('powerId validation', () => {
    const baseCard = {
      id: 'card-1',
      name: 'Card',
      attack: 100,
      defense: 50,
      health: 1000,
      speed: 100,
      agility: 10,
      accuracy: 50,
      criticalChance: 0,
      skills: {
        special: {
          kind: SpecialKind.ATTACK,
          name: 'Special',
          rate: 2,
          energy: 9999,
          targetingStrategy: TargetingStrategy.POSITION_BASED,
        },
        simpleAttack: {
          name: 'Attack',
          damages: [{ type: DamageType.PHYSICAL, rate: 1.0 }],
          targetingStrategy: TargetingStrategy.POSITION_BASED,
        },
        others: [],
      },
      behaviors: { dodge: DodgeStrategy.SIMPLE_DODGE },
    };

    it('rejects skills with same powerId but different trigger events', () => {
      const data: FightDataDto = {
        cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
        player1: {
          name: 'P1',
          deck: [
            {
              ...baseCard,
              skills: {
                ...baseCard.skills,
                others: [
                  {
                    kind: SkillKind.BUFF,
                    name: 'Buff',
                    rate: 0.2,
                    targetingStrategy: TargetingStrategy.SELF,
                    event: TriggerEvent.TURN_END,
                    buffType: 'attack' as any,
                    duration: 0,
                    terminationEvent: 'power-end',
                    powerId: 'my-power',
                  },
                  {
                    kind: SkillKind.HEALING,
                    name: 'Heal',
                    rate: 0.1,
                    targetingStrategy: TargetingStrategy.SELF,
                    event: TriggerEvent.NEXT_ACTION,
                    powerId: 'my-power',
                  },
                ],
              },
            },
          ],
        },
        player2: { name: 'P2', deck: [] },
      };

      expect(() => fightController.startFight(data)).toThrow(/same event/);
    });

    it('rejects skills with same powerId but different terminationEvents', () => {
      const data: FightDataDto = {
        cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
        player1: {
          name: 'P1',
          deck: [
            {
              ...baseCard,
              skills: {
                ...baseCard.skills,
                others: [
                  {
                    kind: SkillKind.BUFF,
                    name: 'Buff',
                    rate: 0.2,
                    targetingStrategy: TargetingStrategy.SELF,
                    event: TriggerEvent.TURN_END,
                    buffType: 'attack' as any,
                    duration: 0,
                    terminationEvent: 'power-end-a',
                    powerId: 'my-power',
                  },
                  {
                    kind: SkillKind.BUFF,
                    name: 'Buff2',
                    rate: 0.1,
                    targetingStrategy: TargetingStrategy.SELF,
                    event: TriggerEvent.TURN_END,
                    buffType: 'defense' as any,
                    duration: 0,
                    terminationEvent: 'power-end-b',
                    powerId: 'my-power',
                  },
                ],
              },
            },
          ],
        },
        player2: { name: 'P2', deck: [] },
      };

      expect(() => fightController.startFight(data)).toThrow(
        /same terminationEvent/,
      );
    });
  });

  describe('error handling for unknown enum values', () => {
    const baseCard = {
      id: 'card-1',
      name: 'Card',
      attack: 100,
      defense: 50,
      health: 1000,
      speed: 100,
      agility: 10,
      accuracy: 50,
      criticalChance: 0,
      skills: {
        special: {
          kind: SpecialKind.ATTACK,
          name: 'Special',
          rate: 2,
          energy: 9999,
          targetingStrategy: TargetingStrategy.POSITION_BASED,
        },
        simpleAttack: {
          name: 'Attack',
          damages: [{ type: DamageType.PHYSICAL, rate: 1.0 }],
          targetingStrategy: TargetingStrategy.POSITION_BASED,
        },
        others: [],
      },
      behaviors: { dodge: DodgeStrategy.SIMPLE_DODGE },
    };

    it('throws when mapBuffType receives an unknown buff type', () => {
      const data: FightDataDto = {
        cardSelectorStrategy: CardSelectorStrategy.PLAYER_BY_PLAYER,
        player1: {
          name: 'P1',
          deck: [
            {
              ...baseCard,
              skills: {
                ...baseCard.skills,
                others: [
                  {
                    kind: SkillKind.BUFF,
                    name: 'Buff',
                    rate: 0.2,
                    targetingStrategy: TargetingStrategy.SELF,
                    event: TriggerEvent.TURN_END,
                    buffType: 'unknown-buff' as any,
                    duration: 1,
                  },
                ],
              },
            },
          ],
        },
        player2: { name: 'P2', deck: [] },
      };

      expect(() => fightController.startFight(data)).toThrow(
        /Unknown buff type/,
      );
    });

    it('throws when getSelectorStrategy receives an unknown card selector strategy', () => {
      const data: FightDataDto = {
        cardSelectorStrategy: 'unknown-strategy' as any,
        player1: { name: 'P1', deck: [baseCard] },
        player2: { name: 'P2', deck: [] },
      };

      expect(() => fightController.startFight(data)).toThrow(
        /Unknown card selector strategy/,
      );
    });
  });
});

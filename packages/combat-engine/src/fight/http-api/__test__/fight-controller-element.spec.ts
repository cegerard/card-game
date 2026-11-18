import 'reflect-metadata';

import {
  CardSelectorStrategy,
  DamageType,
  DodgeStrategy,
  Element,
  SpecialKind,
  TargetingStrategy,
} from '@card-game/shared-types';

import { FightDataDto } from '../dto/fight-data.dto';
import { FightController } from '../fight.controller';
import { FightSimulatorStub } from './fight-simulator-stub';
import { Player } from '../../core/player';
import { CardSelector } from '../../core/fight-simulator/card-selectors/card-selector';

describe('FightController card element', () => {
  let fightSimulatorStub: FightSimulatorStub;
  let fightController: FightController;
  const builder = (player1: Player, _1: any, cardSelector: CardSelector) => {
    fightSimulatorStub = new FightSimulatorStub(player1, cardSelector);
    return fightSimulatorStub;
  };

  function startFightWith(element?: Element): void {
    const fightData: FightDataDto = {
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
            element,
            skills: {
              special: {
                kind: SpecialKind.ATTACK,
                name: 'Double Strike',
                damages: [{ type: DamageType.PHYSICAL, rate: 2.0 }],
                energy: 100,
                targetingStrategy: TargetingStrategy.TARGET_ALL,
              },
              simpleAttack: {
                name: 'Simple Attack',
                damages: [{ type: DamageType.PHYSICAL, rate: 1.0 }],
                targetingStrategy: TargetingStrategy.POSITION_BASED,
              },
              others: [],
            },
            behaviors: { dodge: DodgeStrategy.SIMPLE_DODGE },
          },
        ],
      },
      player2: { name: 'Player 2', deck: [] },
    };

    fightController.startFight(fightData);
  }

  beforeEach(() => {
    fightController = new FightController(builder);
  });

  it.each([
    [Element.PHYSICAL, Element.PHYSICAL],
    [Element.FIRE, Element.FIRE],
    [Element.WATER, Element.WATER],
    [Element.EARTH, Element.EARTH],
    [Element.AIR, Element.AIR],
  ])('carries the %s element onto the card', (dto, expected) => {
    startFightWith(dto);

    fightSimulatorStub.validatePlayer1FirstCard((card) => {
      expect(card.cardElement).toBe(expected);
    });
  });

  it('falls back to physical when the card declares no element', () => {
    startFightWith();

    fightSimulatorStub.validatePlayer1FirstCard((card) => {
      expect(card.cardElement).toBe(Element.PHYSICAL);
    });
  });

  it('refuses an element outside the known set', () => {
    expect(() => startFightWith('LIGHTNING' as Element)).toThrow(
      'Unknown element: LIGHTNING',
    );
  });
});

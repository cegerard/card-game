import 'reflect-metadata';

import { TriggerEvent } from '../dto/fight-data.dto';
import { buildTriggerStrategy } from '../trigger-factory';
import { TurnEnd } from '../../core/trigger/turn-end';
import { NextAction } from '../../core/trigger/next-action';
import { AllyDeath } from '../../core/trigger/ally-death';
import { EnemyDeath } from '../../core/trigger/enemy-death';
import { DynamicTrigger } from '../../core/trigger/dynamic-trigger';

describe('buildTriggerStrategy', () => {
  describe('known simple events', () => {
    it('returns TurnEnd for turn-end event', () => {
      expect(buildTriggerStrategy(TriggerEvent.TURN_END)).toBeInstanceOf(
        TurnEnd,
      );
    });

    it('returns NextAction for next-action event', () => {
      expect(buildTriggerStrategy(TriggerEvent.NEXT_ACTION)).toBeInstanceOf(
        NextAction,
      );
    });

    it('returns AllyDeath for ally-death event with targetCardId', () => {
      expect(
        buildTriggerStrategy(TriggerEvent.ALLY_DEATH, 'card-1'),
      ).toBeInstanceOf(AllyDeath);
    });

    it('returns EnemyDeath for enemy-death event with targetCardId', () => {
      expect(
        buildTriggerStrategy(TriggerEvent.ENEMY_DEATH, 'card-1'),
      ).toBeInstanceOf(EnemyDeath);
    });
  });

  describe('death events without targetCardId', () => {
    it('throws for ally-death event without targetCardId', () => {
      expect(() => buildTriggerStrategy(TriggerEvent.ALLY_DEATH)).toThrow(
        'ally-death trigger requires targetCardId',
      );
    });

    it('throws for enemy-death event without targetCardId', () => {
      expect(() => buildTriggerStrategy(TriggerEvent.ENEMY_DEATH)).toThrow(
        'enemy-death trigger requires targetCardId',
      );
    });
  });

  describe('unknown events', () => {
    it('throws for an unknown event not in STRATEGY_MAP', () => {
      expect(() =>
        buildTriggerStrategy('unknown-event' as TriggerEvent),
      ).toThrow('Unknown trigger event: unknown-event');
    });
  });

  describe('dormant trigger', () => {
    it('throws when dormant config is missing', () => {
      expect(() => buildTriggerStrategy(TriggerEvent.DORMANT)).toThrow(
        'Dormant trigger requires activationEvent, activationTargetCardId, and replacementEvent',
      );
    });

    it('returns DynamicTrigger with ally-death activation and enemy-death replacement', () => {
      const trigger = buildTriggerStrategy(TriggerEvent.DORMANT, undefined, {
        activationEvent: TriggerEvent.ALLY_DEATH,
        activationTargetCardId: 'card-1',
        replacementEvent: TriggerEvent.ENEMY_DEATH,
      });

      expect(trigger).toBeInstanceOf(DynamicTrigger);
    });

    it('returns DynamicTrigger with ally-death activation and turn-end replacement', () => {
      const trigger = buildTriggerStrategy(TriggerEvent.DORMANT, undefined, {
        activationEvent: TriggerEvent.ALLY_DEATH,
        activationTargetCardId: 'card-1',
        replacementEvent: TriggerEvent.TURN_END,
      });

      expect(trigger).toBeInstanceOf(DynamicTrigger);
    });

    it('activates and matches enemy-death replacement trigger keyed on killer card', () => {
      const trigger = buildTriggerStrategy(TriggerEvent.DORMANT, undefined, {
        activationEvent: TriggerEvent.ALLY_DEATH,
        activationTargetCardId: 'card-1',
        replacementEvent: TriggerEvent.ENEMY_DEATH,
      });
      trigger.isTriggered('ally-death:card-1', {
        killerCard: { id: 'killer-1' },
      } as any);

      expect(trigger.isTriggered('enemy-death:killer-1')).toBe(true);
    });

    it('activates and matches turn-end replacement trigger', () => {
      const trigger = buildTriggerStrategy(TriggerEvent.DORMANT, undefined, {
        activationEvent: TriggerEvent.ALLY_DEATH,
        activationTargetCardId: 'card-1',
        replacementEvent: TriggerEvent.TURN_END,
      });
      trigger.isTriggered('ally-death:card-1', {
        killerCard: { id: 'killer-1' },
      } as any);

      expect(trigger.isTriggered('turn-end')).toBe(true);
    });
  });
});

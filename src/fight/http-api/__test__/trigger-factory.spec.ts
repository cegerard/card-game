import 'reflect-metadata';

import { TriggerEvent } from '../dto/fight-data.dto';
import { buildTriggerStrategy } from '../trigger-factory';
import { TurnEnd } from '../../core/trigger/turn-end';
import { NextAction } from '../../core/trigger/next-action';
import { AllyDeath } from '../../core/trigger/ally-death';
import { EnemyDeath } from '../../core/trigger/enemy-death';

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

  describe('unknown events', () => {
    it('throws for an unknown event not in STRATEGY_MAP', () => {
      expect(() =>
        buildTriggerStrategy('unknown-event' as TriggerEvent),
      ).toThrow('Unknown trigger event: unknown-event');
    });
  });
});

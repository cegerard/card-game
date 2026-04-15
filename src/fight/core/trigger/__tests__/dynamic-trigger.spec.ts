import { DynamicTrigger } from '../dynamic-trigger';
import { AllyDeath } from '../ally-death';
import { EnemyDeath } from '../enemy-death';
import { TurnEnd } from '../turn-end';
import { FightingContext } from '../../cards/@types/fighting-context';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';

function createMinimalContext(killerCardId: string): FightingContext {
  return {
    sourcePlayer: { playableCards: [] } as unknown as Player,
    opponentPlayer: { playableCards: [] } as unknown as Player,
    killerCard: { id: killerCardId } as unknown as FightingCard,
  };
}

describe('DynamicTrigger', () => {
  let trigger: DynamicTrigger;

  beforeEach(() => {
    trigger = new DynamicTrigger(
      new AllyDeath('warrior-01'),
      (cardId) => new EnemyDeath(cardId),
    );
  });

  it('has id dormant', () => {
    expect(trigger.id).toBe('dormant');
  });

  describe('when dormant', () => {
    it('does not match any events', () => {
      expect(trigger.isTriggered('enemy-death:goblin-03')).toBe(false);
    });

    it('does not match unrelated events', () => {
      expect(trigger.isTriggered('turn-end')).toBe(false);
    });

    it('does not fire on activation event', () => {
      const context = createMinimalContext('goblin-03');
      trigger.activate('ally-death:warrior-01', context);

      expect(trigger.isTriggered('ally-death:warrior-01')).toBe(false);
    });
  });

  describe('after activation event is observed', () => {
    beforeEach(() => {
      const context = createMinimalContext('goblin-03');
      trigger.activate('ally-death:warrior-01', context);
    });

    it('has id of the replacement trigger', () => {
      expect(trigger.id).toBe('enemy-death');
    });

    it('matches the replacement trigger built from killer card id', () => {
      expect(trigger.isTriggered('enemy-death:goblin-03')).toBe(true);
    });

    it('does not match unrelated events', () => {
      expect(trigger.isTriggered('turn-end')).toBe(false);
    });

    it('does not match the activation event anymore', () => {
      expect(trigger.isTriggered('ally-death:warrior-01')).toBe(false);
    });

    it('does not match a different enemy card', () => {
      expect(trigger.isTriggered('enemy-death:orc-01')).toBe(false);
    });
  });

  describe('activation is idempotent', () => {
    it('calling activation event multiple times still delegates to replacement', () => {
      const context = createMinimalContext('goblin-03');
      trigger.activate('ally-death:warrior-01', context);
      trigger.activate('ally-death:warrior-01', context);

      expect(trigger.isTriggered('enemy-death:goblin-03')).toBe(true);
    });
  });

  describe('activation without killerCard context', () => {
    it('stays dormant on activation event', () => {
      const context = { killerCard: undefined } as any;
      trigger.activate('ally-death:warrior-01', context);

      expect(trigger.isTriggered('ally-death:warrior-01')).toBe(false);
    });

    it('does not delegate to a replacement trigger afterwards', () => {
      const context = { killerCard: undefined } as any;
      trigger.activate('ally-death:warrior-01', context);

      expect(trigger.isTriggered('enemy-death:goblin-03')).toBe(false);
    });
  });

  describe('with turn-end as replacement trigger', () => {
    it('works with non-death replacement triggers', () => {
      const dynamicWithTurnEnd = new DynamicTrigger(
        new AllyDeath('warrior-01'),
        () => new TurnEnd(),
      );
      const context = createMinimalContext('any-card');

      dynamicWithTurnEnd.activate('ally-death:warrior-01', context);

      expect(dynamicWithTurnEnd.isTriggered('turn-end')).toBe(true);
    });
  });
});

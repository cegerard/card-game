import { AllyHealthBelowThresholdTrigger } from '../ally-health-below-threshold-trigger';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { FightingContext } from '../../cards/@types/fighting-context';

function makeAlly(id: string, healthRatio: number): FightingCard {
  return { id, healthRatio } as unknown as FightingCard;
}

function makeContext(allyId: string, healthRatio: number): FightingContext {
  const ally = makeAlly(allyId, healthRatio);
  return {
    sourcePlayer: { allCards: [ally] } as unknown as Player,
    opponentPlayer: { allCards: [] } as unknown as Player,
  };
}

describe('AllyHealthBelowThresholdTrigger', () => {
  const ALLY_ID = 'arionis-01';
  const THRESHOLD = 0.3;
  const EVENT_ID = `ally-health-${ALLY_ID}`;

  describe('initial state', () => {
    it('is not triggered before any activate call', () => {
      const trigger = new AllyHealthBelowThresholdTrigger(ALLY_ID, THRESHOLD);
      expect(trigger.isTriggered(EVENT_ID)).toBe(false);
    });
  });

  describe('non-matching event', () => {
    it('does not trigger on a different ally id', () => {
      const trigger = new AllyHealthBelowThresholdTrigger(ALLY_ID, THRESHOLD);
      trigger.activate('ally-health-other-id', makeContext(ALLY_ID, 0.2));
      expect(trigger.isTriggered(EVENT_ID)).toBe(false);
    });
  });

  describe('first threshold crossing (HP goes below threshold)', () => {
    it('returns true on the tick after the crossing', () => {
      const trigger = new AllyHealthBelowThresholdTrigger(ALLY_ID, THRESHOLD);
      trigger.activate(EVENT_ID, makeContext(ALLY_ID, 0.2));
      expect(trigger.isTriggered(EVENT_ID)).toBe(true);
    });
  });

  describe('subsequent hits while already below threshold', () => {
    it('does not re-trigger on the next hit', () => {
      const trigger = new AllyHealthBelowThresholdTrigger(ALLY_ID, THRESHOLD);
      trigger.activate(EVENT_ID, makeContext(ALLY_ID, 0.2));
      trigger.activate(EVENT_ID, makeContext(ALLY_ID, 0.1));
      expect(trigger.isTriggered(EVENT_ID)).toBe(false);
    });
  });

  describe('recovery and re-arm', () => {
    it('fires again after HP recovers above threshold and drops below again', () => {
      const trigger = new AllyHealthBelowThresholdTrigger(ALLY_ID, THRESHOLD);
      trigger.activate(EVENT_ID, makeContext(ALLY_ID, 0.2));
      trigger.activate(EVENT_ID, makeContext(ALLY_ID, 0.5));
      trigger.activate(EVENT_ID, makeContext(ALLY_ID, 0.2));
      expect(trigger.isTriggered(EVENT_ID)).toBe(true);
    });

    it('resets to not triggered after recovery', () => {
      const trigger = new AllyHealthBelowThresholdTrigger(ALLY_ID, THRESHOLD);
      trigger.activate(EVENT_ID, makeContext(ALLY_ID, 0.2));
      trigger.activate(EVENT_ID, makeContext(ALLY_ID, 0.5));
      expect(trigger.isTriggered(EVENT_ID)).toBe(false);
    });
  });

  describe('ally absent from context', () => {
    it('does not throw when ally is not found', () => {
      const trigger = new AllyHealthBelowThresholdTrigger(ALLY_ID, THRESHOLD);
      const context: FightingContext = {
        sourcePlayer: { allCards: [] } as unknown as Player,
        opponentPlayer: { allCards: [] } as unknown as Player,
      };
      expect(() => trigger.activate(EVENT_ID, context)).not.toThrow();
    });

    it('is not triggered when ally is not found', () => {
      const trigger = new AllyHealthBelowThresholdTrigger(ALLY_ID, THRESHOLD);
      const context: FightingContext = {
        sourcePlayer: { allCards: [] } as unknown as Player,
        opponentPlayer: { allCards: [] } as unknown as Player,
      };
      trigger.activate(EVENT_ID, context);
      expect(trigger.isTriggered(EVENT_ID)).toBe(false);
    });
  });

  describe('sourcePlayer is always the ally owner', () => {
    it('fires when ally is in sourcePlayer regardless of lastAttacker', () => {
      const trigger = new AllyHealthBelowThresholdTrigger(ALLY_ID, THRESHOLD);
      const ally = makeAlly(ALLY_ID, 0.2);
      const attacker = { id: 'attacker-01' } as unknown as FightingCard;
      const context: FightingContext = {
        sourcePlayer: { allCards: [ally] } as unknown as Player,
        opponentPlayer: { allCards: [attacker] } as unknown as Player,
        lastAttacker: attacker,
      };
      trigger.activate(EVENT_ID, context);
      expect(trigger.isTriggered(EVENT_ID)).toBe(true);
    });

    it('does not fire when ally is only in opponentPlayer', () => {
      const trigger = new AllyHealthBelowThresholdTrigger(ALLY_ID, THRESHOLD);
      const ally = makeAlly(ALLY_ID, 0.2);
      const attacker = { id: 'attacker-01' } as unknown as FightingCard;
      const context: FightingContext = {
        sourcePlayer: { allCards: [attacker] } as unknown as Player,
        opponentPlayer: { allCards: [ally] } as unknown as Player,
        lastAttacker: attacker,
      };
      trigger.activate(EVENT_ID, context);
      expect(trigger.isTriggered(EVENT_ID)).toBe(false);
    });
  });
});

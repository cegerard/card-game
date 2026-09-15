import { DamageTakenTrigger } from '../damage-taken';

describe('DamageTakenTrigger', () => {
  const CARD_ID = 'aegis-01';
  const EVENT_ID = `damage-taken-${CARD_ID}`;

  describe('matching event', () => {
    it('triggers on the monitored card event', () => {
      const trigger = new DamageTakenTrigger(CARD_ID);
      expect(trigger.isTriggered(EVENT_ID)).toBe(true);
    });

    it('triggers again on every following hit', () => {
      const trigger = new DamageTakenTrigger(CARD_ID);
      trigger.isTriggered(EVENT_ID);
      expect(trigger.isTriggered(EVENT_ID)).toBe(true);
    });
  });

  describe('non-matching event', () => {
    it('does not trigger on another card id', () => {
      const trigger = new DamageTakenTrigger(CARD_ID);
      expect(trigger.isTriggered('damage-taken-other-id')).toBe(false);
    });

    it('does not trigger on another event kind', () => {
      const trigger = new DamageTakenTrigger(CARD_ID);
      expect(trigger.isTriggered(`ally-health-${CARD_ID}`)).toBe(false);
    });

    it('does not trigger on the bare event name', () => {
      const trigger = new DamageTakenTrigger(CARD_ID);
      expect(trigger.isTriggered('damage-taken')).toBe(false);
    });
  });
});

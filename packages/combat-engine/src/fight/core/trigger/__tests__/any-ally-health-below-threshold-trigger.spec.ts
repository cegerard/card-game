import { AnyAllyHealthBelowThresholdTrigger } from '../any-ally-health-below-threshold-trigger';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { FightingContext } from '../../cards/@types/fighting-context';
import { Player } from '../../player';

const THRESHOLD = 0.2;
const OWNER_ID = 'guardian';

describe('AnyAllyHealthBelowThresholdTrigger', () => {
  let owner: FightingCard;
  let allyA: FightingCard;
  let allyB: FightingCard;
  let context: FightingContext;
  let trigger: AnyAllyHealthBelowThresholdTrigger;

  function fire(card: FightingCard): boolean {
    const event = `ally-health-${card.id}`;
    trigger.activate(event, context);
    return trigger.isTriggered(event);
  }

  beforeEach(() => {
    owner = createFightingCard({ id: OWNER_ID, health: 100 });
    allyA = createFightingCard({ id: 'ally-a', health: 100 });
    allyB = createFightingCard({ id: 'ally-b', health: 100 });
    context = {
      sourcePlayer: new Player('source', [owner, allyA, allyB]),
      opponentPlayer: new Player('opponent', [createFightingCard()]),
    };
    trigger = new AnyAllyHealthBelowThresholdTrigger(THRESHOLD, OWNER_ID);
  });

  describe('when an ally crosses the threshold downward', () => {
    it('fires', () => {
      allyA.addRealDamage(85);

      expect(fire(allyA)).toBe(true);
    });
  });

  describe('when an ally stays above the threshold', () => {
    it('does not fire', () => {
      allyA.addRealDamage(50);

      expect(fire(allyA)).toBe(false);
    });
  });

  describe('when the same ally takes another hit below the threshold', () => {
    it('does not fire twice', () => {
      allyA.addRealDamage(85);
      fire(allyA);
      allyA.addRealDamage(5);

      expect(fire(allyA)).toBe(false);
    });
  });

  describe('when an ally recovers then falls again', () => {
    it('fires again', () => {
      allyA.addRealDamage(85);
      fire(allyA);
      allyA.heal(50);
      fire(allyA);
      allyA.addRealDamage(50);

      expect(fire(allyA)).toBe(true);
    });
  });

  describe('when a second ally crosses after the first', () => {
    it('fires for that other ally too', () => {
      allyA.addRealDamage(85);
      fire(allyA);
      allyB.addRealDamage(85);

      expect(fire(allyB)).toBe(true);
    });
  });

  describe('when the owner itself crosses the threshold', () => {
    it('does not fire', () => {
      owner.addRealDamage(85);

      expect(fire(owner)).toBe(false);
    });
  });

  describe('on an unrelated event', () => {
    it('does not fire', () => {
      allyA.addRealDamage(85);
      trigger.activate(`damage-taken-${allyA.id}`, context);

      expect(trigger.isTriggered(`damage-taken-${allyA.id}`)).toBe(false);
    });
  });

  describe('when the crossing ally belongs to nobody in the context', () => {
    it('does not fire', () => {
      const stranger = createFightingCard({ id: 'stranger', health: 100 });
      stranger.addRealDamage(85);

      expect(fire(stranger)).toBe(false);
    });
  });
});

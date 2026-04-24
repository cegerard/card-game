import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Player } from '../../player';

describe('FightingCard.computeAttributeModifierValue()', () => {
  describe('when an unknown buff/debuff type is provided', () => {
    it('throws an error for unknown type in applyBuff', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });

      expect(() => card.applyBuff('unknown' as any, 0.1, 2)).toThrow(
        'Unknown attribute type: unknown',
      );
    });

    it('throws an error for unknown type in applyDebuff', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });

      expect(() => card.applyDebuff('unknown' as any, 0.1, 2)).toThrow(
        'Unknown attribute type: unknown',
      );
    });
  });
});

describe('FightingCard.applyBuff()', () => {
  describe('when applying a duration-only buff', () => {
    it('stacks on top of existing buff of same type', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyBuff('attack', 0.1, 2);
      card.applyBuff('attack', 0.1, 2);

      expect(card.actualAttack).toBe(120);
    });
  });

  describe('when applying an event-bound buff', () => {
    it('refreshes in-place instead of stacking when same type+event exists', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyBuff('attack', 0.4, Infinity, 'lions-end');
      card.applyBuff('attack', 0.4, Infinity, 'lions-end');

      expect(card.actualAttack).toBe(140);
    });

    it('stores terminationEvent on the buff', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      const buff = card.applyBuff('attack', 0.4, Infinity, 'lions-end');

      expect(buff.terminationEvent).toBe('lions-end');
    });
  });
});

describe('FightingCard.removeEventBoundBuffs()', () => {
  describe('when matching event-bound buffs exist', () => {
    let card;

    beforeEach(() => {
      card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyBuff('attack', 0.4, Infinity, 'lions-end');
    });

    it('returns the list of removed buffs', () => {
      const removed = card.removeEventBoundBuffs('lions-end');

      expect(removed).toHaveLength(1);
    });

    it('returns correct type and value for removed buff', () => {
      const removed = card.removeEventBoundBuffs('lions-end');

      expect(removed[0].type).toBe('attack');
    });

    it('removes the buff from the card', () => {
      card.removeEventBoundBuffs('lions-end');

      expect(card.actualAttack).toBe(100);
    });
  });

  describe('when non-matching buffs exist', () => {
    let card;

    beforeEach(() => {
      card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyBuff('attack', 0.4, Infinity, 'other-event');
    });

    it('leaves non-matching buffs in place', () => {
      card.removeEventBoundBuffs('lions-end');

      expect(card.actualAttack).toBe(140);
    });

    it('returns empty array when no match', () => {
      const removed = card.removeEventBoundBuffs('lions-end');

      expect(removed).toHaveLength(0);
    });
  });
});

describe('FightingCard.removeEventBoundDebuffs()', () => {
  describe('when matching event-bound debuffs exist', () => {
    let card;

    beforeEach(() => {
      card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyDebuff('attack', 0.4, Infinity, undefined, 'lions-end');
    });

    it('returns the list of removed debuffs', () => {
      const removed = card.removeEventBoundDebuffs('lions-end');

      expect(removed).toHaveLength(1);
    });

    it('returns correct type for removed debuff', () => {
      const removed = card.removeEventBoundDebuffs('lions-end');

      expect(removed[0].type).toBe('attack');
    });

    it('removes the debuff from the card', () => {
      card.removeEventBoundDebuffs('lions-end');

      expect(card.actualAttack).toBe(100);
    });
  });

  describe('when non-matching debuffs exist', () => {
    let card;

    beforeEach(() => {
      card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyDebuff('attack', 0.4, Infinity, undefined, 'other-event');
    });

    it('leaves non-matching debuffs in place', () => {
      card.removeEventBoundDebuffs('lions-end');

      expect(card.actualAttack).toBe(60);
    });

    it('returns empty array when no match', () => {
      const removed = card.removeEventBoundDebuffs('lions-end');

      expect(removed).toHaveLength(0);
    });
  });
});

describe('FightingCard.decreaseBuffAndDebuffDuration()', () => {
  describe('when buffs expire', () => {
    it('returns expired buffs', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyBuff('attack', 0.2, 1);

      const { expiredBuffs } = card.decreaseBuffAndDebuffDuration();

      expect(expiredBuffs).toHaveLength(1);
    });

    it('does not return still-active buffs', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyBuff('attack', 0.2, 2);

      const { expiredBuffs } = card.decreaseBuffAndDebuffDuration();

      expect(expiredBuffs).toHaveLength(0);
    });

    it('does not return Infinity-duration buffs', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyBuff('attack', 0.2, Infinity);

      const { expiredBuffs } = card.decreaseBuffAndDebuffDuration();

      expect(expiredBuffs).toHaveLength(0);
    });
  });

  describe('when debuffs expire', () => {
    it('returns expired debuffs', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyDebuff('attack', 0.2, 1);

      const { expiredDebuffs } = card.decreaseBuffAndDebuffDuration();

      expect(expiredDebuffs).toHaveLength(1);
    });

    it('does not return still-active debuffs', () => {
      const card = createFightingCard({
        attack: 100,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyDebuff('attack', 0.2, 2);

      const { expiredDebuffs } = card.decreaseBuffAndDebuffDuration();

      expect(expiredDebuffs).toHaveLength(0);
    });
  });
});

describe('FightingCard number precision', () => {
  describe('applyBuff()', () => {
    it('rounds buff value to 2 decimal places', () => {
      const card = createFightingCard({
        attack: 33,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });

      const buff = card.applyBuff('attack', 0.1, 2);

      expect(buff.value).toBe(3.3);
    });
  });

  describe('applyDebuff()', () => {
    it('rounds debuff value to 2 decimal places', () => {
      const card = createFightingCard({
        attack: 33,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });

      const debuff = card.applyDebuff('attack', 0.1, 2);

      expect(debuff.value).toBe(3.3);
    });
  });

  describe('heal()', () => {
    it('rounds healed amount to 2 decimal places', () => {
      const card = createFightingCard({
        health: 100,
        attack: 0,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyFinalDamage(20);

      const healed = card.heal(33 * 0.1);

      expect(healed).toBe(3.3);
    });

    it('keeps actualHealth clean after floating-point healing', () => {
      const card = createFightingCard({
        health: 100,
        attack: 0,
        defense: 0,
        accuracy: 0,
        agility: 0,
      });
      card.applyFinalDamage(20);
      card.heal(33 * 0.1);

      expect(card.actualHealth).toBe(83.3);
    });
  });
});

describe('FightingCard.lifecycleEndEvents()', () => {
  describe('when card has a lifecycle-limited buff skill with endEvent', () => {
    let card;

    beforeEach(() => {
      card = createFightingCard({
        skills: {
          others: [
            {
              buffType: 'attack' as const,
              buffRate: 0.4,
              duration: Infinity,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              activationLimit: 3,
              endEvent: 'lions-end',
            },
          ],
        },
      });
    });

    it('returns the endEvent strings of non-exhausted skills', () => {
      const events = card.lifecycleEndEvents();

      expect(events).toContain('lions-end');
    });
  });

  describe('when the lifecycle skill is exhausted', () => {
    let card;

    beforeEach(() => {
      card = createFightingCard({
        skills: {
          others: [
            {
              buffType: 'attack' as const,
              buffRate: 0.4,
              duration: Infinity,
              trigger: 'turn-end',
              targetingStrategy: 'self',
              activationLimit: 1,
              endEvent: 'lions-end',
            },
          ],
        },
      });
      // exhaust by launching once
      const context = {
        sourcePlayer: new Player('p1', [card]),
        opponentPlayer: new Player('p2', []),
      };
      card.launchSkills('turn-end', context);
    });

    it('does not return the endEvent after exhaustion', () => {
      const events = card.lifecycleEndEvents();

      expect(events).not.toContain('lions-end');
    });
  });

  describe('when card has no lifecycle skills', () => {
    it('returns empty array', () => {
      const card = createFightingCard({ skills: { others: [] } });

      expect(card.lifecycleEndEvents()).toHaveLength(0);
    });
  });
});

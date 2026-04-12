import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { TurnEnd } from '../../trigger/turn-end';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { AlterationSkill } from '../skills/alteration-skill';
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

describe('FightingCard.lifecycleEndEvents()', () => {
  describe('when card has a lifecycle-limited buff skill with endEvent', () => {
    let card;

    beforeEach(() => {
      const skill = new AlterationSkill({
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.4,
        duration: Infinity,
        trigger: new TurnEnd(),
        targetingStrategy: new Launcher(),
        activationLimit: 3,
        endEvent: 'lions-end',
      });
      card = createFightingCard({});
      (card as any).skills = [skill];
    });

    it('returns the endEvent strings of non-exhausted skills', () => {
      const events = card.lifecycleEndEvents();

      expect(events).toContain('lions-end');
    });
  });

  describe('when the lifecycle skill is exhausted', () => {
    let card;
    let skill;

    beforeEach(() => {
      skill = new AlterationSkill({
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.4,
        duration: Infinity,
        trigger: new TurnEnd(),
        targetingStrategy: new Launcher(),
        activationLimit: 1,
        endEvent: 'lions-end',
      });
      card = createFightingCard({});
      (card as any).skills = [skill];
      // exhaust by launching once
      const context = {
        sourcePlayer: new Player('p1', [card]),
        opponentPlayer: new Player('p2', []),
      };
      skill.launch(card, context);
    });

    it('does not return the endEvent after exhaustion', () => {
      const events = card.lifecycleEndEvents();

      expect(events).not.toContain('lions-end');
    });
  });

  describe('when card has no lifecycle skills', () => {
    it('returns empty array', () => {
      const card = createFightingCard({});
      (card as any).skills = [];

      expect(card.lifecycleEndEvents()).toHaveLength(0);
    });
  });
});

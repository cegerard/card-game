import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';
import { Player } from '../../player';

const DURATION = 2;

describe('FightingCard protection', () => {
  let guardian: FightingCard;
  let ally: FightingCard;
  let bystander: FightingCard;
  let team: Player;

  beforeEach(() => {
    guardian = createFightingCard({ id: 'guardian', health: 1000 });
    ally = createFightingCard({ id: 'ally', health: 1000 });
    bystander = createFightingCard({ id: 'bystander', health: 1000 });
    team = new Player('team', [guardian, ally, bystander]);
  });

  describe('once a guardian steps in front of an ally', () => {
    beforeEach(() => {
      guardian.protect(ally, DURATION);
    });

    it('reports protecting that ally', () => {
      expect(guardian.isProtecting(ally)).toBe(true);
    });

    it('does not protect anybody else', () => {
      expect(guardian.isProtecting(bystander)).toBe(false);
    });

    it('names the ally it covers', () => {
      expect(guardian.protectedAlly).toBe(ally);
    });

    it('is found as the protector of that ally', () => {
      expect(team.protectorOf(ally)).toBe(guardian);
    });

    it('leaves the other teammates unprotected', () => {
      expect(team.protectorOf(bystander)).toBeUndefined();
    });
  });

  describe('when the guardian falls', () => {
    it('protects nobody any more', () => {
      guardian.protect(ally, DURATION);
      guardian.addRealDamage(1000);

      expect(guardian.isProtecting(ally)).toBe(false);
    });

    it('is no longer found as a protector', () => {
      guardian.protect(ally, DURATION);
      guardian.addRealDamage(1000);

      expect(team.protectorOf(ally)).toBeUndefined();
    });
  });

  describe('while the duration runs', () => {
    it('frees nobody', () => {
      guardian.protect(ally, DURATION);

      expect(guardian.decreaseProtectionDuration()).toBeNull();
    });

    it('keeps the protection up', () => {
      guardian.protect(ally, DURATION);
      guardian.decreaseProtectionDuration();

      expect(guardian.isProtecting(ally)).toBe(true);
    });
  });

  describe('when the duration runs out', () => {
    beforeEach(() => {
      guardian.protect(ally, 0);
    });

    it('frees the ally it covered', () => {
      expect(guardian.decreaseProtectionDuration()).toBe(ally);
    });

    it('stops protecting it', () => {
      guardian.decreaseProtectionDuration();

      expect(guardian.isProtecting(ally)).toBe(false);
    });

    it('frees nobody twice', () => {
      guardian.decreaseProtectionDuration();

      expect(guardian.decreaseProtectionDuration()).toBeNull();
    });
  });

  describe('when a running protection is re-cast', () => {
    it('refreshes the duration instead of stacking', () => {
      guardian.protect(ally, 0);
      guardian.protect(ally, DURATION);

      expect(guardian.decreaseProtectionDuration()).toBeNull();
    });

    it('can move to another ally', () => {
      guardian.protect(ally, DURATION);
      guardian.protect(bystander, DURATION);

      expect(guardian.isProtecting(ally)).toBe(false);
    });
  });

  describe('without any protection', () => {
    it('frees nobody', () => {
      expect(guardian.decreaseProtectionDuration()).toBeNull();
    });

    it('names no ally', () => {
      expect(guardian.protectedAlly).toBeUndefined();
    });
  });
});

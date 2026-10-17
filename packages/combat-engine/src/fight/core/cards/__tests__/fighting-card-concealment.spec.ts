import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

describe('FightingCard concealment', () => {
  let card: FightingCard;
  let enemy: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ health: 100 });
    enemy = createFightingCard({});
  });

  it('is targetable by default', () => {
    expect(card.isTargetableBy(enemy)).toBe(true);
  });

  describe('an enemy stance re-activated without its reveal', () => {
    beforeEach(() => {
      card.conceal('Marche Fant�me');
      enemy.activateStance({
        name: 'Sens Sismique',
        duration: 2,
        revealsConcealed: true,
      });
      enemy.activateStance({ name: 'Sens Sismique', duration: 2 });
    });

    it('still reveals the concealed card', () => {
      expect(card.isTargetableBy(enemy)).toBe(true);
    });
  });

  describe('once concealed', () => {
    beforeEach(() => {
      card.conceal('Marche Fantôme');
    });

    it('is concealed', () => {
      expect(card.isConcealed()).toBe(true);
    });

    it('is no longer targetable', () => {
      expect(card.isTargetableBy(enemy)).toBe(false);
    });

    it('is targetable by an enemy whose stance reveals concealed cards', () => {
      enemy.activateStance({
        name: 'Sens Sismique',
        duration: 2,
        revealsConcealed: true,
      });

      expect(card.isTargetableBy(enemy)).toBe(true);
    });

    it('is not revealed by a stance that does not reveal', () => {
      enemy.activateStance({ name: 'Fusion', duration: 2 });

      expect(card.isTargetableBy(enemy)).toBe(false);
    });

    it('returns the concealment it breaks', () => {
      expect(card.breakConcealment()).toEqual({ name: 'Marche Fantôme' });
    });

    it('is targetable again once the concealment is broken', () => {
      card.breakConcealment();

      expect(card.isTargetableBy(enemy)).toBe(true);
    });

    it('never runs out without a duration', () => {
      [1, 2, 3].forEach(() => card.decreaseConcealmentDuration());

      expect(card.isConcealed()).toBe(true);
    });
  });

  describe('with a duration', () => {
    beforeEach(() => {
      card.conceal('Camouflage', 1);
    });

    it('still holds while turns remain', () => {
      expect(card.decreaseConcealmentDuration()).toBeNull();
    });

    it('returns the concealment once it runs out', () => {
      card.decreaseConcealmentDuration();

      expect(card.decreaseConcealmentDuration()?.name).toBe('Camouflage');
    });

    it('is targetable once it runs out', () => {
      card.decreaseConcealmentDuration();
      card.decreaseConcealmentDuration();

      expect(card.isTargetableBy(enemy)).toBe(true);
    });

    it('is refreshed by a new concealment', () => {
      card.decreaseConcealmentDuration();
      card.conceal('Camouflage', 1);

      expect(card.decreaseConcealmentDuration()).toBeNull();
    });
  });

  it('breaks nothing when it is not concealed', () => {
    expect(card.breakConcealment()).toBeNull();
  });

  it('is not targetable once dead', () => {
    card.addRealDamage(100);

    expect(card.isTargetableBy(enemy)).toBe(false);
  });
});

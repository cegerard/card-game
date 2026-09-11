import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

describe('FightingCard lifesteal', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ health: 1000 });
    card.addRealDamage(500);
  });

  describe('without lifesteal', () => {
    it('steals nothing', () => {
      expect(card.stealLife()).toBe(0);
    });

    it('is not flagged as stealing life', () => {
      expect(card.hasLifesteal).toBe(false);
    });
  });

  describe('with lifesteal', () => {
    beforeEach(() => {
      card.applyLifesteal('Frenzy', 0.1, 3);
    });

    it('heals a share of the maximum health', () => {
      expect(card.stealLife()).toBe(100);
    });

    it('never heals above the maximum health', () => {
      card.heal(1000);

      expect(card.stealLife()).toBe(0);
    });

    it('carries the name of the skill that granted it', () => {
      expect(card.lifestealName).toBe('Frenzy');
    });
  });

  describe('duration', () => {
    beforeEach(() => {
      card.applyLifesteal('Frenzy', 0.1, 1);
    });

    it('still steals life while the duration holds', () => {
      card.decreaseLifestealDuration();

      expect(card.hasLifesteal).toBe(true);
    });

    it('stops stealing life once the duration runs out', () => {
      card.decreaseLifestealDuration();
      card.decreaseLifestealDuration();

      expect(card.hasLifesteal).toBe(false);
    });
  });
});

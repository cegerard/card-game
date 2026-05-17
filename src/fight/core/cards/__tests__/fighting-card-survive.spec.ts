import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { SurviveSkill } from '../skills/survive';
import { FightingCard } from '../fighting-card';
import { SimpleAttack } from '../skills/simple-attack';
import { SpecialAttack } from '../skills/special-attack';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { SimpleDodge } from '../behaviors/simple-dodge';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { Element } from '../@types/damage/element';

function createCardWithSurvive(health: number): FightingCard {
  const survive = new SurviveSkill('Last Stand');
  const targeting = new TargetedFromPosition();
  const damages = [new DamageComposition(DamageType.PHYSICAL, 1)];
  return new FightingCard(
    'test-id',
    'TestCard',
    {
      attack: 100,
      defense: 0,
      health,
      speed: 100,
      agility: 0,
      accuracy: 100,
      criticalChance: 0,
    },
    {
      simpleAttack: new SimpleAttack('Strike', damages, targeting),
      special: new SpecialAttack('Special', damages, 999, targeting),
      others: [],
      survive,
    },
    { dodge: new SimpleDodge() },
    Element.PHYSICAL,
  );
}

describe('FightingCard — survive skill integration', () => {
  describe('applyFinalDamage() with survive skill', () => {
    it('sets health to exactly 1 when fatal damage is received', () => {
      const card = createCardWithSurvive(100);

      card.applyFinalDamage(500);

      expect(card.actualHealth).toBe(1);
    });

    it('returns survived: true on the intercepted hit', () => {
      const card = createCardWithSurvive(100);

      const result = card.applyFinalDamage(500);

      expect(result.survived).toBe(true);
    });

    it('returns survivedSkillName on the intercepted hit', () => {
      const card = createCardWithSurvive(100);

      const result = card.applyFinalDamage(500);

      expect(result.survivedSkillName).toBe('Last Stand');
    });

    it('does not trigger survive on non-fatal damage', () => {
      const card = createCardWithSurvive(100);

      const result = card.applyFinalDamage(50);

      expect(result.survived).toBeUndefined();
    });

    it('kills the card normally on the second fatal blow', () => {
      const card = createCardWithSurvive(100);
      card.applyFinalDamage(500);

      card.applyFinalDamage(500);

      expect(card.isDead()).toBe(true);
    });

    it('does not return survived on the second fatal blow', () => {
      const card = createCardWithSurvive(100);
      card.applyFinalDamage(500);

      const result = card.applyFinalDamage(500);

      expect(result.survived).toBeUndefined();
    });
  });

  describe('applyFinalDamage() without survive skill', () => {
    it('kills the card normally when no survive skill is configured', () => {
      const card = createFightingCard({ health: 100, defense: 0 });

      card.applyFinalDamage(500);

      expect(card.isDead()).toBe(true);
    });
  });
});

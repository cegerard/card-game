import { DamageReductionSkill } from '../skills/damage-reduction';
import { SurviveSkill } from '../skills/survive';
import { FightingCard } from '../fighting-card';
import { SimpleAttack } from '../skills/simple-attack';
import { SpecialAttack } from '../skills/special-attack';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { SimpleDodge } from '../behaviors/simple-dodge';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { Element } from '../@types/damage/element';
import { CardStateStunted } from '../@types/state/card-state-stunted';
import { RandomizerFake } from '../../../../../test/helpers/randomizer-fake';
import { MathRandomizer } from '../../../tools/math-randomizer';
import { Randomizer } from '../../randomizer';

const SKILL_NAME = 'Resilience des marais';

function createCard(options: {
  health?: number;
  rate?: number;
  probability?: number;
  randomizer?: Randomizer;
  survive?: boolean;
}): FightingCard {
  const targeting = new TargetedFromPosition();
  const damages = [new DamageComposition(DamageType.PHYSICAL, 1)];
  const damageReduction = new DamageReductionSkill(
    SKILL_NAME,
    options.rate ?? 0.15,
    options.randomizer ?? new MathRandomizer(),
    options.probability,
  );
  return new FightingCard(
    'aegis-01',
    'Aegis',
    {
      attack: 100,
      defense: 0,
      health: options.health ?? 1000,
      speed: 100,
      agility: 0,
      accuracy: 100,
      criticalChance: 0,
    },
    {
      simpleAttack: new SimpleAttack('Strike', damages, targeting),
      special: new SpecialAttack('Special', damages, 999, targeting),
      others: [],
      survive: options.survive ? new SurviveSkill('Last Stand') : undefined,
      damageReduction,
    },
    { dodge: new SimpleDodge() },
    Element.PHYSICAL,
  );
}

describe('FightingCard — damage reduction integration', () => {
  describe('applyFinalDamage() with a permanent reduction', () => {
    it('removes the configured share from the damage to health', () => {
      const card = createCard({ rate: 0.15 });

      const result = card.applyFinalDamage(100);

      expect(result.damageToHealth).toBe(85);
    });

    it('leaves the card with the mitigated damage only', () => {
      const card = createCard({ rate: 0.15, health: 1000 });

      card.applyFinalDamage(100);

      expect(card.actualHealth).toBe(915);
    });

    it('reports the mitigation', () => {
      const card = createCard({ rate: 0.15 });

      const result = card.applyFinalDamage(100);

      expect(result.mitigated).toBe(true);
    });

    it('reports the skill name behind the mitigation', () => {
      const card = createCard({ rate: 0.15 });

      const result = card.applyFinalDamage(100);

      expect(result.mitigatedSkillName).toBe(SKILL_NAME);
    });
  });

  describe('applyFinalDamage() with a failed probability roll', () => {
    it('lets the full damage through', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.9);
      const card = createCard({ rate: 0.15, probability: 0.3, randomizer });

      const result = card.applyFinalDamage(100);

      expect(result.damageToHealth).toBe(100);
    });

    it('does not report a mitigation', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.9);
      const card = createCard({ rate: 0.15, probability: 0.3, randomizer });

      const result = card.applyFinalDamage(100);

      expect(result.mitigated).toBeUndefined();
    });
  });

  describe('ordering against the shield buffer', () => {
    it('absorbs only the mitigated damage from the shield', () => {
      const card = createCard({ rate: 0.5, health: 1000 });
      card.applyShield(0.1, 3);

      const result = card.applyFinalDamage(100);

      expect(result.shieldAbsorbed).toBe(50);
    });

    it('keeps the shield alive on a hit that would have broken it', () => {
      const card = createCard({ rate: 0.5, health: 1000 });
      card.applyShield(0.1, 3);

      card.applyFinalDamage(100);

      expect(card.shielded).toBe(true);
    });
  });

  describe('ordering against the stunt amplifier', () => {
    it('reduces the amplified damage, not the raw damage', () => {
      const card = createCard({ rate: 0.5, health: 1000 });
      card.setState(new CardStateStunted(1, 1));

      const result = card.applyFinalDamage(100);

      expect(result.damageToHealth).toBe(60);
    });
  });

  describe('combined with a survive skill', () => {
    it('still intercepts a fatal blow', () => {
      const card = createCard({ rate: 0.5, health: 100, survive: true });

      const result = card.applyFinalDamage(1000);

      expect(result.survived).toBe(true);
    });

    it('reports both the mitigation and the survival', () => {
      const card = createCard({ rate: 0.5, health: 100, survive: true });

      const result = card.applyFinalDamage(1000);

      expect(result.mitigated).toBe(true);
    });

    it('spares the survive skill when the mitigation makes the blow survivable', () => {
      const card = createCard({ rate: 0.5, health: 100, survive: true });

      const result = card.applyFinalDamage(150);

      expect(result.survived).toBeUndefined();
    });
  });

  describe('status effect ticks', () => {
    it('does not mitigate damage applied through addRealDamage', () => {
      const card = createCard({ rate: 0.5, health: 1000 });

      card.addRealDamage(100);

      expect(card.actualHealth).toBe(900);
    });
  });
});

import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { SimpleAttack } from '../skills/simple-attack';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { BurnAttackEffect } from '../@types/attack/attack-burn-effect';
import { StuntAttackEffect } from '../@types/attack/attack-stunt-effect';
import { EffectLevel } from '../@types/attack/effect-level';
import { MathRandomizer } from '../../../tools/math-randomizer';

const POSITION_BASED = new TargetedFromPosition();

function makeCard(
  overrides: { attack?: number; defense?: number; health?: number } = {},
) {
  return createFightingCard({
    attack: overrides.attack ?? 200,
    defense: overrides.defense ?? 0,
    health: overrides.health ?? 5000,
    criticalChance: 0,
    agility: 0,
    accuracy: 9999,
  });
}

function makeContext(attacker = makeCard(), defender = makeCard()) {
  return {
    sourcePlayer: new Player('P1', [attacker]),
    opponentPlayer: new Player('P2', [defender]),
  };
}

describe('SimpleAttack with multiple effects', () => {
  const damages = [new DamageComposition(DamageType.PHYSICAL, 1.0)];

  describe('when all effects trigger (probability=1)', () => {
    const attack = new SimpleAttack('combo', damages, POSITION_BASED, [
      new BurnAttackEffect(
        0.1,
        1 as EffectLevel,
        new MathRandomizer(),
        undefined,
        undefined,
        1.0,
      ),
      new StuntAttackEffect(0, 1 as EffectLevel, new MathRandomizer(), 1.0),
    ]);

    it('returns two effect results', () => {
      const attacker = makeCard();
      const defender = makeCard();
      const result = attack.launch(attacker, makeContext(attacker, defender));
      expect(result.results[0].effects?.length).toBe(2);
    });

    it('applies burn to defender', () => {
      const attacker = makeCard();
      const defender = makeCard();
      attack.launch(attacker, makeContext(attacker, defender));
      expect(defender.burnLevel).toBeGreaterThan(0);
    });

    it('applies stunt to defender', () => {
      const attacker = makeCard();
      const defender = makeCard();
      attack.launch(attacker, makeContext(attacker, defender));
      expect(defender.isStunted).toBe(true);
    });
  });

  describe('when no effects trigger (probability=0)', () => {
    const attack = new SimpleAttack('combo', damages, POSITION_BASED, [
      new BurnAttackEffect(
        0.1,
        1 as EffectLevel,
        new MathRandomizer(),
        undefined,
        undefined,
        0,
      ),
      new StuntAttackEffect(0, 1 as EffectLevel, new MathRandomizer(), 0),
    ]);

    it('returns no effect results', () => {
      const attacker = makeCard();
      const defender = makeCard();
      const result = attack.launch(attacker, makeContext(attacker, defender));
      expect(result.results[0].effects).toBeUndefined();
    });
  });

  describe('when only the first effect triggers', () => {
    const attack = new SimpleAttack('combo', damages, POSITION_BASED, [
      new BurnAttackEffect(
        0.1,
        1 as EffectLevel,
        new MathRandomizer(),
        undefined,
        undefined,
        1.0,
      ),
      new StuntAttackEffect(0, 1 as EffectLevel, new MathRandomizer(), 0),
    ]);

    it('returns one effect result', () => {
      const attacker = makeCard();
      const defender = makeCard();
      const result = attack.launch(attacker, makeContext(attacker, defender));
      expect(result.results[0].effects?.length).toBe(1);
    });

    it('applies burn but not stunt', () => {
      const attacker = makeCard();
      const defender = makeCard();
      attack.launch(attacker, makeContext(attacker, defender));
      expect(defender.burnLevel).toBeGreaterThan(0);
      expect(defender.isStunted).toBe(false);
    });
  });

  describe('when effects array is empty', () => {
    const attack = new SimpleAttack('strike', damages, POSITION_BASED, []);

    it('returns no effects', () => {
      const attacker = makeCard();
      const defender = makeCard();
      const result = attack.launch(attacker, makeContext(attacker, defender));
      expect(result.results[0].effects).toBeUndefined();
    });
  });
});

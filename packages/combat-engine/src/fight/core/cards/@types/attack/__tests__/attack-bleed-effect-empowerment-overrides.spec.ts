import { BleedAttackEffect } from '../attack-bleed-effect';
import { EffectTriggeredDebuff } from '../effect-triggered-debuff';
import { StateEffectResult } from '../attack-effect';
import { MathRandomizer } from '../../../../../tools/math-randomizer';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { BleedEmpowermentSkill } from '../../../skills/bleed-empowerment';

const FUSION = 'fusion-tectonique';

// Lacération: 2% of the target max health for 3 turns
const laceration = () =>
  new BleedAttackEffect(
    0.02,
    3,
    8,
    new MathRandomizer(),
    1,
    undefined,
    undefined,
    undefined,
    'target-max-health',
  );

describe('BleedAttackEffect empowered with overrides (Griffures)', () => {
  let attacker: FightingCard;
  let defender: FightingCard;
  let result: StateEffectResult;

  const firstTick = () => defender.applyStateEffects()[0];

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      bleedEmpowerment: new BleedEmpowermentSkill(
        'Griffures',
        FUSION,
        undefined,
        0.03,
        {
          duration: 4,
          triggeredDebuff: new EffectTriggeredDebuff(
            1,
            'regeneration',
            0.5,
            4,
            new RandomizerFake(),
          ),
        },
      ),
    });
    defender = createFightingCard({ health: 5000 });
  });

  describe('while the stance runs', () => {
    beforeEach(() => {
      attacker.activateStance({ name: FUSION, duration: 2 });
      result = laceration().applyEffect(defender, attacker, null);
    });

    it('lays no extra stack without extraStacks', () => {
      expect(defender.bleedStacks()).toBe(1);
    });

    it('bleeds at the empowered share of the target max health', () => {
      expect(firstTick().damage).toBe(150);
    });

    it('bleeds for the empowered duration', () => {
      expect(firstTick().remainingTurns).toBe(3);
    });

    it('rolls the empowered debuff', () => {
      expect(result.triggeredDebuff.debuff.type).toBe('regeneration');
    });
  });

  describe('outside the stance', () => {
    beforeEach(() => {
      result = laceration().applyEffect(defender, attacker, null);
    });

    it('bleeds at the effect own share', () => {
      expect(firstTick().damage).toBe(100);
    });

    it('bleeds for the effect own duration', () => {
      expect(firstTick().remainingTurns).toBe(2);
    });

    it('rolls no debuff', () => {
      expect(result.triggeredDebuff).toBeUndefined();
    });
  });

  it('replaces the basis when told to', () => {
    const empowered = createFightingCard({
      attack: 100,
      bleedEmpowerment: new BleedEmpowermentSkill(
        'Griffures',
        FUSION,
        0,
        0.03,
        {
          basis: 'source-attack',
        },
      ),
    });
    empowered.activateStance({ name: FUSION, duration: 2 });
    laceration().applyEffect(defender, empowered, null);

    expect(firstTick().damage).toBe(3);
  });
});

import { effectResultsToSteps } from '../effect-results-to-steps';
import { StepKind } from '../@types/step';
import { MARK_EFFECT_TYPE } from '../../cards/@types/mark/elemental-mark';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { Debuff } from '../../cards/@types/alteration/alteration-detail';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

const SLOW: Debuff = {
  polarity: 'debuff',
  type: 'speed',
  value: 5,
  duration: 3,
};

describe('effectResultsToSteps', () => {
  const attacker = createFightingCard({ id: 'aegis' });
  const target = createFightingCard({ id: 'enemy' });

  describe('no effect landed', () => {
    it('returns no step for an empty list', () => {
      expect(effectResultsToSteps(attacker, [])).toEqual([]);
    });

    it('returns no step when effects are absent', () => {
      expect(effectResultsToSteps(attacker)).toEqual([]);
    });
  });

  describe('status effect', () => {
    const burn = [{ type: 'burn' as const, card: target }];

    it('emits a status_change step', () => {
      expect(effectResultsToSteps(attacker, burn)[0].kind).toBe(
        StepKind.StatusChange,
      );
    });

    it('carries the effect type as the status', () => {
      const [step] = effectResultsToSteps(attacker, burn);

      expect((step as any).status).toBe('burn');
    });
  });

  describe('elemental mark', () => {
    const mark = [
      {
        type: MARK_EFFECT_TYPE as typeof MARK_EFFECT_TYPE,
        card: target,
        damageType: DamageType.EARTH,
        stacks: 2,
      },
    ];

    it('emits a mark_applied step rather than a status_change', () => {
      expect(effectResultsToSteps(attacker, mark)[0].kind).toBe(
        StepKind.MarkApplied,
      );
    });

    it('carries the amplified damage type', () => {
      const [step] = effectResultsToSteps(attacker, mark);

      expect((step as any).damageType).toBe(DamageType.EARTH);
    });

    it('carries the resulting stack count', () => {
      const [step] = effectResultsToSteps(attacker, mark);

      expect((step as any).stacks).toBe(2);
    });
  });

  describe('debuff triggered by the effect', () => {
    const markWithDebuff = [
      {
        type: MARK_EFFECT_TYPE as typeof MARK_EFFECT_TYPE,
        card: target,
        damageType: DamageType.EARTH,
        stacks: 1,
        triggeredDebuff: { card: target, debuff: SLOW },
      },
    ];

    it('emits the debuff step after the effect step', () => {
      const steps = effectResultsToSteps(attacker, markWithDebuff);

      expect(steps.map((s) => s.kind)).toEqual([
        StepKind.MarkApplied,
        StepKind.Debuff,
      ]);
    });

    it('credits the debuff to the attacker', () => {
      const [, debuffStep] = effectResultsToSteps(attacker, markWithDebuff);

      expect((debuffStep as any).source.id).toBe('aegis');
    });

    it('reports the debuff on its target', () => {
      const [, debuffStep] = effectResultsToSteps(attacker, markWithDebuff);

      expect((debuffStep as any).alterations[0].target.id).toBe('enemy');
    });

    it('reports the debuff duration', () => {
      const [, debuffStep] = effectResultsToSteps(attacker, markWithDebuff);

      expect((debuffStep as any).alterations[0].remainingTurns).toBe(3);
    });
  });

  describe('several effects on one hit', () => {
    it('maps each effect in order', () => {
      const steps = effectResultsToSteps(attacker, [
        { type: 'burn' as const, card: target },
        {
          type: MARK_EFFECT_TYPE as typeof MARK_EFFECT_TYPE,
          card: target,
          damageType: DamageType.EARTH,
          stacks: 1,
        },
      ]);

      expect(steps.map((s) => s.kind)).toEqual([
        StepKind.StatusChange,
        StepKind.MarkApplied,
      ]);
    });
  });
});

import { skillResultsToSteps } from '../skill-results-to-steps';
import { SkillKind, AttackSkillResults } from '../../cards/skills/skill';
import { StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { MARK_EFFECT_TYPE } from '../../cards/@types/mark/elemental-mark';
import { DamageType } from '../../cards/@types/damage/damage-type';

function attackOn(
  defender: FightingCard,
  extra: Partial<AttackSkillResults['results'][0]> = {},
): AttackSkillResults {
  return {
    skillKind: SkillKind.Attack,
    name: 'Contre-attaque',
    results: [
      {
        damage: 50,
        isCritical: false,
        dodge: false,
        defender,
        remainingHealth: 950,
        ...extra,
      },
    ],
  };
}

describe('skillResultsToSteps: defensive layers of a reactive attack', () => {
  const card = createFightingCard({ id: 'attacker' });

  describe('damage mitigated on the target', () => {
    const defender = createFightingCard({ id: 'aegis' });
    const result = attackOn(defender, {
      mitigated: true,
      mitigatedSkillName: 'Resilience des marais',
    });

    it('emits a damage_mitigated step', () => {
      const steps = skillResultsToSteps(card, [result]);

      expect(steps[1].kind).toBe(StepKind.DamageMitigated);
    });

    it('names the skill that mitigated the hit', () => {
      const steps = skillResultsToSteps(card, [result]);

      expect((steps[1] as any).name).toBe('Resilience des marais');
    });

    it('attributes the mitigation to the card that took the hit', () => {
      const steps = skillResultsToSteps(card, [result]);

      expect((steps[1] as any).card.id).toBe('aegis');
    });
  });

  describe('shield broken by the hit', () => {
    const defender = createFightingCard({ id: 'shielded' });
    const result = attackOn(defender, { shieldBroken: true });

    it('emits a shield_broken step', () => {
      const steps = skillResultsToSteps(card, [result]);

      expect(steps[1].kind).toBe(StepKind.ShieldBroken);
    });

    it('attributes the broken shield to the defender', () => {
      const steps = skillResultsToSteps(card, [result]);

      expect((steps[1] as any).card.id).toBe('shielded');
    });
  });

  describe('ordering when both layers report', () => {
    const defender = createFightingCard({ id: 'tank' });
    const result = attackOn(defender, {
      mitigated: true,
      mitigatedSkillName: 'Resilience des marais',
      shieldBroken: true,
    });

    it('reports the mitigation before the broken shield', () => {
      const steps = skillResultsToSteps(card, [result]);

      expect(steps.map((s) => s.kind)).toEqual([
        StepKind.Attack,
        StepKind.DamageMitigated,
        StepKind.ShieldBroken,
      ]);
    });
  });

  describe('when the hit kills the defender', () => {
    function deadDefenderSteps() {
      const defender = createFightingCard({ id: 'doomed', health: 1 });
      defender.addRealDamage(9999);
      return skillResultsToSteps(card, [
        attackOn(defender, {
          mitigated: true,
          mitigatedSkillName: 'Resilience des marais',
          shieldBroken: true,
          remainingHealth: 0,
        }),
      ]);
    }

    it('still reports the defensive layers before the death', () => {
      expect(deadDefenderSteps().map((s) => s.kind)).toEqual([
        StepKind.Attack,
        StepKind.DamageMitigated,
        StepKind.ShieldBroken,
        StepKind.StatusChange,
      ]);
    });

    it('reports the death last', () => {
      const steps = deadDefenderSteps();

      expect((steps[3] as any).status).toBe('dead');
    });
  });

  describe('when nothing defensive happened', () => {
    it('emits the attack step alone', () => {
      const defender = createFightingCard({ id: 'plain' });

      const steps = skillResultsToSteps(card, [attackOn(defender)]);

      expect(steps).toHaveLength(1);
    });
  });

  describe('effects landed by the reactive attack', () => {
    const defender = createFightingCard({ id: 'marked' });

    it('reports an elemental mark as a mark_applied step', () => {
      const steps = skillResultsToSteps(card, [
        attackOn(defender, {
          effects: [
            {
              type: MARK_EFFECT_TYPE,
              card: defender,
              damageType: DamageType.EARTH,
              stacks: 2,
            },
          ],
        }),
      ]);

      expect(steps[1].kind).toBe(StepKind.MarkApplied);
    });

    it('reports the debuff an effect triggered', () => {
      const steps = skillResultsToSteps(card, [
        attackOn(defender, {
          effects: [
            {
              type: 'burn',
              card: defender,
              triggeredDebuff: {
                card: defender,
                debuff: {
                  polarity: 'debuff',
                  type: 'speed',
                  value: 5,
                  duration: 3,
                },
              },
            },
          ],
        }),
      ]);

      expect(steps.map((s) => s.kind)).toEqual([
        StepKind.Attack,
        StepKind.StatusChange,
        StepKind.Debuff,
      ]);
    });
  });
});

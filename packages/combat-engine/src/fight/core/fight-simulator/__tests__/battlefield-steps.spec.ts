import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import {
  battlefieldStartedSteps,
  damageSharedSteps,
  legacySteps,
} from '../battlefield-steps';
import { StepKind } from '../@types/step';

describe('battlefield steps', () => {
  const caster = createFightingCard({ attack: 100 });
  const ally = createFightingCard({ defense: 100, health: 1000 });

  it('reports the start, the revivals, then the buffs', () => {
    const steps = battlefieldStartedSteps(caster, {
      name: 'Tempête',
      remainingTurns: 3,
      revived: [{ card: ally, remainingHealth: 300 }],
      alterations: [
        {
          target: ally.identityInfo,
          alteration: ally.applyBuff('defense', 0.25, 2),
        },
      ],
    });

    expect(steps.map((s) => s.kind)).toEqual([
      StepKind.BattlefieldStarted,
      StepKind.Revived,
      StepKind.Buff,
    ]);
  });

  it('reports no empowerment when nobody is left to empower', () => {
    const steps = legacySteps(caster, {
      name: 'Tempête',
      extraTurns: 2,
      empowerment: { name: 'Rage', cards: [] },
    });

    expect(steps.map((s) => s.kind)).toEqual([StepKind.BattlefieldExtended]);
  });

  it('reports what each partner of a circle carried', () => {
    const [step] = damageSharedSteps({
      damage: 160,
      isCritical: false,
      dodge: false,
      defender: caster,
      remainingHealth: 840,
      damageShared: { name: 'Cercle', shares: [{ card: ally, damage: 10 }] },
    });

    expect(step).toMatchObject({
      kind: StepKind.DamageShared,
      shares: [{ damage: 10, remainingHealth: 1000 }],
    });
  });
});

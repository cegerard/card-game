import { skillResultsToSteps } from '../skill-results-to-steps';
import {
  SkillKind,
  TargetingOverrideSkillResults,
} from '../../cards/skills/skill';
import { StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

describe('skillResultsToSteps: TargetingOverride', () => {
  const card = createFightingCard({ id: 'card-1' });

  const overrideResult: TargetingOverrideSkillResults = {
    skillKind: SkillKind.TargetingOverride,
    results: [
      {
        kind: StepKind.TargetingOverride,
        source: card.identityInfo,
        previousStrategy: 'position-based',
        newStrategy: 'all',
        powerId: 'rage',
      },
    ],
  };

  it('emits a targeting_override step', () => {
    const steps = skillResultsToSteps(card, [overrideResult]);

    expect(steps[0].kind).toBe(StepKind.TargetingOverride);
  });

  it('preserves the newStrategy field', () => {
    const steps = skillResultsToSteps(card, [overrideResult]);

    expect((steps[0] as any).newStrategy).toBe('all');
  });

  it('preserves the powerId field', () => {
    const steps = skillResultsToSteps(card, [overrideResult]);

    expect((steps[0] as any).powerId).toBe('rage');
  });

  it('preserves the source card identity', () => {
    const steps = skillResultsToSteps(card, [overrideResult]);

    expect((steps[0] as any).source.id).toBe('card-1');
  });
});

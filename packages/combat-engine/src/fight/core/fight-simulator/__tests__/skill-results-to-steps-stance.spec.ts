import { skillResultsToSteps } from '../skill-results-to-steps';
import { SkillKind } from '../../cards/skills/skill';
import { StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import {
  BuffResult,
  DebuffResult,
} from '../../cards/@types/action-result/alteration-result';

describe('skillResultsToSteps: stance opened by a triggered skill', () => {
  it('emits a stance_started step', () => {
    const card = createFightingCard({ id: 'scythra' });

    const steps = skillResultsToSteps(card, [
      {
        skillKind: SkillKind.Stance,
        name: 'Lames du Vent Rouge',
        stance: { name: 'vent-rouge', remainingTurns: 3 },
      },
    ]);

    expect(steps).toEqual([
      {
        kind: StepKind.StanceStarted,
        name: 'vent-rouge',
        card: card.identityInfo,
        remainingTurns: 3,
      },
    ]);
  });
});

describe('skillResultsToSteps: stance opened with alterations', () => {
  const card = createFightingCard({ id: 'vespera' });
  const alteration = (polarity: 'buff' | 'debuff') =>
    ({
      target: card.identityInfo,
      alteration: { polarity, type: 'agility', value: 30, duration: 2 },
    }) as BuffResult | DebuffResult;

  it('follows the stance with one buff step and one debuff step', () => {
    const steps = skillResultsToSteps(card, [
      {
        skillKind: SkillKind.Stance,
        name: 'Danse du Désert',
        stance: { name: 'danse', remainingTurns: 2 },
        alterations: [alteration('buff'), alteration('debuff')],
      },
    ]);

    expect(steps.map((s) => s.kind)).toEqual([
      StepKind.StanceStarted,
      StepKind.Buff,
      StepKind.Debuff,
    ]);
  });

  it('reports nothing when the stance did not open', () => {
    const steps = skillResultsToSteps(card, [
      { skillKind: SkillKind.Stance, name: 'Danse du Désert' },
    ]);

    expect(steps).toEqual([]);
  });
});

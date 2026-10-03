import { skillResultsToSteps } from '../skill-results-to-steps';
import { SkillKind } from '../../cards/skills/skill';
import { StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

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

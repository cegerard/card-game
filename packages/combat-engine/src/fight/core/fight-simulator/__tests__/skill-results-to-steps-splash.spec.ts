import { skillResultsToSteps } from '../skill-results-to-steps';
import { SkillKind } from '../../cards/skills/skill';
import { StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

describe('skillResultsToSteps: attack with a splash', () => {
  it('reports the splash as its own attack step', () => {
    const card = createFightingCard({ id: 'scythra' });
    const defender = createFightingCard({ id: 'prey' });
    const hit = {
      damage: 10,
      isCritical: false,
      dodge: false,
      defender,
      remainingHealth: 90,
    };

    const steps = skillResultsToSteps(card, [
      {
        skillKind: SkillKind.Attack,
        name: 'Exsanguination Totale',
        results: [hit],
        splash: { name: 'Vent Écarlate', results: [hit] },
      },
    ]);

    expect(
      steps.filter((s) => s.kind === StepKind.Attack).map((s: any) => s.name),
    ).toEqual(['Exsanguination Totale', 'Vent Écarlate']);
  });
});

import { skillResultsToSteps } from '../skill-results-to-steps';
import { SkillKind } from '../../cards/skills/skill';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

describe('skillResultsToSteps: attack that struck nobody', () => {
  it('reports nothing', () => {
    expect(
      skillResultsToSteps(createFightingCard(), [
        { skillKind: SkillKind.Attack, name: 'Héritage', results: [] },
      ]),
    ).toEqual([]);
  });
});

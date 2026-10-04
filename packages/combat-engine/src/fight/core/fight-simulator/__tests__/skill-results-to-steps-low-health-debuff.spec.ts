import { skillResultsToSteps } from '../skill-results-to-steps';
import { SkillKind } from '../../cards/skills/skill';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

describe('skillResultsToSteps: attack with a low-health debuff', () => {
  it('reports the debuff between the attack and its splash', () => {
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
        lowHealthDebuff: {
          name: 'Choc Hémorragique',
          results: [
            {
              target: defender.identityInfo,
              alteration: {
                type: 'defense',
                value: 0.4,
                duration: 4,
                polarity: 'debuff',
              },
            },
          ],
        },
        splash: { name: 'Vent Écarlate', results: [hit] },
      },
    ]);

    expect(steps.map((s: any) => [s.kind, s.name])).toEqual([
      ['attack', 'Exsanguination Totale'],
      ['debuff', 'Choc Hémorragique'],
      ['attack', 'Vent Écarlate'],
    ]);
  });
});

import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { executionSteps } from '../execution-steps';
import { StepKind } from '../@types/step';

describe('executionSteps', () => {
  const selkhet = createFightingCard({ id: 'selkhet' });
  const prey = createFightingCard({ id: 'prey' });

  it('reports an executed step per defender', () => {
    expect(executionSteps(selkhet, 'Jugement', [{ card: prey }])).toEqual([
      {
        kind: StepKind.Executed,
        name: 'Jugement',
        attacker: selkhet.identityInfo,
        card: prey.identityInfo,
      },
    ]);
  });

  it('follows it with survived when SURVIVE held the defender', () => {
    const [, survived] = executionSteps(selkhet, 'Jugement', [
      { card: prey, survived: true, survivedSkillName: 'Dernier Souffle' },
    ]);

    expect(survived).toEqual({
      kind: StepKind.Survived,
      name: 'Dernier Souffle',
      card: prey.identityInfo,
    });
  });
});

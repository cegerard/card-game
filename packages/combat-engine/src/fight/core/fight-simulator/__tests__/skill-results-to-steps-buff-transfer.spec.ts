import { skillResultsToSteps } from '../skill-results-to-steps';
import { SkillKind } from '../../cards/skills/skill';
import { StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';

describe('skillResultsToSteps: buff transfer', () => {
  let owner: FightingCard;
  let heir: FightingCard;

  const steps = (results) =>
    skillResultsToSteps(owner, [
      { skillKind: SkillKind.BuffTransfer, name: 'Héritage', results },
    ]);

  beforeEach(() => {
    owner = createFightingCard({ id: 'selkhet' });
    heir = createFightingCard({ id: 'heir' });
  });

  it('emits a buff_transferred step', () => {
    const buff = { polarity: 'buff', type: 'speed', value: 30, duration: 2 };

    expect(steps([{ target: heir, buffs: [buff] }])).toEqual([
      {
        kind: StepKind.BuffTransferred,
        name: 'Héritage',
        source: owner.identityInfo,
        target: heir.identityInfo,
        alterations: [{ kind: 'speed', value: 30, remainingTurns: 2 }],
      },
    ]);
  });

  it('emits nothing when no buff moved', () => {
    expect(steps([])).toEqual([]);
  });
});

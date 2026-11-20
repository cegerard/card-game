import { SkillKind } from '@card-game/shared-types';
import { OtherSkillDto } from '../dto/fight-data.dto';
import { rejectMisplacedFields } from '../skill-kind-fields';

const skill = (fields: Partial<OtherSkillDto>) =>
  ({ name: 'Skill', ...fields }) as OtherSkillDto;

describe('rejectMisplacedFields', () => {
  it('accepts a field reserved to the kind of the skill', () => {
    const support = skill({ kind: SkillKind.SUPPORT, interval: 2 });

    expect(() => rejectMisplacedFields([support])).not.toThrow();
  });

  it('accepts a field common to every kind', () => {
    const healing = skill({ kind: SkillKind.HEALING, rate: 0.2 });

    expect(() => rejectMisplacedFields([healing])).not.toThrow();
  });

  it('lists the fields reserved to other kinds, in table order', () => {
    const healing = skill({ kind: SkillKind.HEALING, interval: 2, amount: 1 });

    expect(() => rejectMisplacedFields([healing])).toThrow(
      'HEALING skill cannot carry: amount, interval',
    );
  });
});

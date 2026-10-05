import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { ConcealmentSkill } from '../concealment';
import { SkillKind, SkillResults } from '../skill';
import { FightStart, FIGHT_START } from '../../../trigger/fight-start';

describe('ConcealmentSkill', () => {
  let owner: FightingCard;

  beforeEach(() => {
    owner = createFightingCard({});
  });

  it('fires on its event', () => {
    const skill = new ConcealmentSkill('Marche Fantôme', new FightStart());

    expect(skill.isTriggered(FIGHT_START)).toBe(true);
  });

  describe('once launched', () => {
    let result: SkillResults;

    beforeEach(() => {
      result = new ConcealmentSkill('Camouflage', new FightStart(), 2).launch(
        owner,
        null,
      );
    });

    it('conceals its owner', () => {
      expect(owner.isConcealed()).toBe(true);
    });

    it('reports the concealment', () => {
      expect(result).toEqual({
        skillKind: SkillKind.Concealment,
        name: 'Camouflage',
        concealment: { name: 'Camouflage', remainingTurns: 2 },
      });
    });
  });

  it.each([-1, 1.5])('rejects a duration of %s', (duration) => {
    expect(
      () => new ConcealmentSkill('Camouflage', new FightStart(), duration),
    ).toThrow('Concealment duration must be a non-negative integer');
  });
});

import { defendersKilled } from '../defenders-killed';
import { SkillKind, SkillResults } from '../../cards/skills/skill';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';

describe('defendersKilled', () => {
  let killed: FightingCard;

  const strike = (defender: FightingCard): SkillResults => ({
    skillKind: SkillKind.Attack,
    results: [
      {
        damage: 1,
        isCritical: false,
        dodge: false,
        defender,
        remainingHealth: 0,
      },
    ],
  });

  beforeEach(() => {
    killed = createFightingCard({ health: 100 });
    killed.addRealDamage(100);
  });

  it('lists the cards a follow up skill killed', () => {
    const transformation: SkillResults = {
      skillKind: SkillKind.Transformation,
      results: [],
      remainingTurns: 3,
      followUps: [strike(killed)],
    };

    expect(defendersKilled([transformation])).toEqual([killed]);
  });

  it('lists a card killed twice once', () => {
    expect(defendersKilled([strike(killed), strike(killed)])).toEqual([killed]);
  });
});

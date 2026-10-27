import { Player } from '../../player';
import { SurvivedTrigger } from '../../trigger/survived';
import { SurviveSkill } from '../../cards/skills/survive';
import { Healing } from '../../cards/skills/healing';
import { SkillKind } from '../../cards/skills/skill';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { skillResultsToSteps } from '../skill-results-to-steps';
import { fightingContextOf } from '../fighting-context-of';
import { survivedReactions } from '../survived-reactions';
import { Step, StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

describe('skillResultsToSteps: splash striking a SURVIVE holder', () => {
  const splashSteps = (): Step[] => {
    const striker = createFightingCard({ id: 'striker' });
    const target = createFightingCard({ id: 'target' });
    const neighbor = createFightingCard({
      id: 'neighbor',
      survive: new SurviveSkill('Last Stand'),
      extraSkills: [
        new Healing('Second Wind', 0.1, new SurvivedTrigger(), new Launcher()),
      ],
    });
    const player1 = new Player('p1', [striker]);
    const player2 = new Player('p2', [target, neighbor]);
    const hit = (defender, extra = {}) => ({
      damage: 10,
      isCritical: false,
      dodge: false,
      defender,
      remainingHealth: 1,
      ...extra,
    });

    return skillResultsToSteps(
      striker,
      [
        {
          skillKind: SkillKind.Attack,
          name: 'Main',
          results: [hit(target)],
          splash: {
            name: 'Splash',
            results: [
              hit(neighbor, {
                survived: true,
                survivedSkillName: 'Last Stand',
              }),
            ],
          },
        },
      ],
      undefined,
      (card) =>
        survivedReactions(
          card,
          fightingContextOf(card, player1, player2),
          () => [],
        ),
    );
  };

  it('reports survived and its reactions right after the splash step', () => {
    expect(splashSteps().map((s) => s.kind)).toEqual([
      StepKind.Attack,
      StepKind.Attack,
      StepKind.Survived,
      StepKind.Healing,
    ]);
  });
});

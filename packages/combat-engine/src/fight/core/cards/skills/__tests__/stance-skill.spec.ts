import { StanceSkill } from '../stance';
import { SkillKind } from '../skill';
import { TurnEnd } from '../../../trigger/turn-end';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';

describe('StanceSkill', () => {
  let owner: FightingCard;
  let skill: StanceSkill;

  const launch = () =>
    skill.launch(owner, {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [createFightingCard()]),
    });

  beforeEach(() => {
    owner = createFightingCard({ id: 'scythra' });
    skill = new StanceSkill(
      'Lames du Vent Rouge',
      { name: 'vent-rouge', duration: 3 },
      new TurnEnd(),
    );
  });

  it('opens the stance on its owner', () => {
    launch();

    expect(owner.hasStance('vent-rouge')).toBe(true);
  });

  it('reports the opened stance', () => {
    expect(launch()).toEqual(
      expect.objectContaining({
        skillKind: SkillKind.Stance,
        name: 'Lames du Vent Rouge',
        stance: expect.objectContaining({
          name: 'vent-rouge',
          remainingTurns: 3,
        }),
      }),
    );
  });

  it('fires on its event', () => {
    expect(skill.isTriggered('turn-end')).toBe(true);
  });
});

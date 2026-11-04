import { AlterationSkill } from '../alteration-skill';
import { TurnEnd } from '../../../trigger/turn-end';
import { Launcher } from '../../../targeting-card-strategies/launcher';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';

describe('AlterationSkill bound to a stance', () => {
  let owner: FightingCard;

  const turnEnd = () =>
    owner.launchSkills('turn-end', {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [createFightingCard()]),
    });

  beforeEach(() => {
    owner = createFightingCard({
      extraSkills: [
        new AlterationSkill({
          name: 'Explosion de venin',
          polarity: 'buff',
          attributeType: 'attack',
          rate: 0.1,
          duration: 1,
          trigger: new TurnEnd(),
          targetingStrategy: new Launcher(),
          requiredStance: 'reine',
        }),
      ],
    });
  });

  it('stays silent outside the stance', () => {
    expect(turnEnd()).toEqual([]);
  });

  it('fires while its owner holds the stance', () => {
    owner.activateStance({ name: 'reine', duration: 1 });

    expect(turnEnd()).toHaveLength(1);
  });
});

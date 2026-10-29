import { StanceSkill } from '../stance';
import { TurnEnd } from '../../../trigger/turn-end';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { RandomizerFake } from '../../../../../../test/helpers/randomizer-fake';
import { FightingCard } from '../../fighting-card';
import { RampingChance } from '../../@types/stance/ramping-chance';
import { Alteration } from '../../@types/alteration/alteration';
import { Launcher } from '../../../targeting-card-strategies/launcher';
import { StanceSkillResults } from '../skill';

const DANCE = { name: 'danse-du-desert', duration: 2, evasionChance: 0.5 };

describe('StanceSkill with a chance and alterations', () => {
  let owner: FightingCard;
  let randomizer: RandomizerFake;
  let skill: StanceSkill;

  const launch = () =>
    skill.launch(owner, {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [createFightingCard()]),
    }) as StanceSkillResults;

  beforeEach(() => {
    owner = createFightingCard({ agility: 75 });
    randomizer = new RandomizerFake().setNextRandomValue(0);
    skill = new StanceSkill('Danse du Désert', DANCE, new TurnEnd(), {
      chance: new RampingChance(1, 0, 1, randomizer),
      alterations: [new Alteration('agility', 0.4, 2, new Launcher())],
    });
  });

  it('opens the stance when the chance fires', () => {
    launch();

    expect(owner.hasStance('danse-du-desert')).toBe(true);
  });

  it('applies its alterations with the stance', () => {
    expect(launch().alterations[0].alteration.value).toBe(30);
  });

  it('reports no stance when the chance does not fire', () => {
    randomizer.setNextRandomValue(1);

    expect(launch().stance).toBeUndefined();
  });

  it('does not open again while the stance runs', () => {
    launch();

    expect(launch().stance).toBeUndefined();
  });
});

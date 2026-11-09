import { DeathSkillHandler } from '../death-skill-handler';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { AlterationSkill } from '../../cards/skills/alteration-skill';
import { AnyAllyDeathTrigger } from '../../trigger/any-ally-death';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { FightingCard } from '../../cards/fighting-card';
import { StepKind } from '../@types/step';

describe('DeathSkillHandler with any-ally-death', () => {
  let handler: DeathSkillHandler;
  let fallen: FightingCard;

  const kill = (card: FightingCard) => {
    card.addRealDamage(card.maxHealth);
    handler.notifyDeath(card);
    return handler.drainSteps();
  };

  beforeEach(() => {
    fallen = createFightingCard({ health: 100 });
    const mourner = createFightingCard({
      extraSkills: [
        new AlterationSkill({
          name: 'Deuil',
          polarity: 'buff',
          attributeType: 'attack',
          rate: 0.3,
          duration: 2,
          trigger: new AnyAllyDeathTrigger(),
          targetingStrategy: new Launcher(),
        }),
      ],
    });
    handler = new DeathSkillHandler(
      new Player('p1', [fallen, mourner]),
      new Player('p2', [createFightingCard()]),
    );
  });

  it('fires on the survivors whoever died', () => {
    expect(kill(fallen).map((s) => s.kind)).toEqual([StepKind.Buff]);
  });

  it('runs again when a revived card falls again', () => {
    kill(fallen);
    fallen.revive(0.3);

    expect(kill(fallen).map((s) => s.kind)).toEqual([StepKind.Buff]);
  });

  it('ignores a second notification of the same death', () => {
    kill(fallen);
    handler.notifyDeath(fallen);

    expect(handler.drainSteps()).toEqual([]);
  });
});

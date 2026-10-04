import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { BleedExplosionSkill } from '../../cards/skills/bleed-explosion';
import { CardStateBleeding } from '../../cards/@types/state/card-state-bleeding';
import { SelfDeathTrigger } from '../../trigger/self-death';
import { Player } from '../../player';
import { DeathSkillHandler } from '../death-skill-handler';
import { Step, StepKind } from '../@types/step';

describe('DeathSkillHandler bleed explosion on its owner death', () => {
  let scythra: FightingCard;
  let victim: FightingCard;
  let avenger: FightingCard;
  let handler: DeathSkillHandler;

  const notifyScythraDeath = (): Step[] => {
    scythra.addRealDamage(100000);
    handler.notifyDeath(scythra);
    return handler.drainSteps();
  };

  beforeEach(() => {
    scythra = createFightingCard({
      id: 'scythra',
      attack: 1000,
      extraSkills: [
        new BleedExplosionSkill(
          'Héritage',
          0.2,
          new SelfDeathTrigger('scythra'),
          'transe-predatrice',
        ),
      ],
    });
    victim = createFightingCard({ id: 'victim', health: 100 });
    victim.setState(
      new CardStateBleeding([{ remainingTurns: 3, damageValue: 5 }]),
    );
    avenger = createFightingCard({
      id: 'avenger',
      health: 1000,
      skills: {
        others: [
          {
            effectRate: 0.1,
            trigger: 'ally-death',
            targetCardId: 'victim',
            targetingStrategy: 'self',
          },
        ],
      },
    });
    avenger.addRealDamage(500);
    handler = new DeathSkillHandler(
      new Player('p1', [scythra]),
      new Player('p2', [victim, avenger]),
    );
  });

  it('explodes while the stance runs, even on the dead owner', () => {
    scythra.activateStance('transe-predatrice', 2);

    const explosion = notifyScythraDeath().find(
      (s: any) => s.name === 'Héritage',
    );

    expect(explosion).toBeDefined();
  });

  it('runs the death cascade of a card the explosion kills', () => {
    scythra.activateStance('transe-predatrice', 2);

    const healers = notifyScythraDeath()
      .filter((s) => s.kind === StepKind.Healing)
      .map((s: any) => s.source.id);

    expect(healers).toEqual(['avenger']);
  });

  it('stays silent outside the stance', () => {
    expect(notifyScythraDeath()).toEqual([]);
  });
});

import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { DeathSkillHandler } from '../death-skill-handler';
import { Step, StepKind } from '../@types/step';

const hunterSkill = {
  effectRate: 0.1,
  trigger: 'enemy-killed',
  targetingStrategy: 'self',
};

describe('DeathSkillHandler enemy killed phase', () => {
  let hunter: FightingCard;
  let hunterAlly: FightingCard;
  let victim: FightingCard;
  let handler: DeathSkillHandler;

  const healingSources = (steps: Step[]) =>
    steps
      .filter((s) => s.kind === StepKind.Healing)
      .map((s: any) => s.source.id);
  const woundedHunter = (id: string) => {
    const card = createFightingCard({
      id,
      health: 1000,
      skills: { others: [hunterSkill] },
    });
    card.addRealDamage(500);
    return card;
  };

  beforeEach(() => {
    hunter = woundedHunter('hunter');
    hunterAlly = woundedHunter('hunter-ally');
    victim = createFightingCard({ id: 'victim' });
    handler = new DeathSkillHandler(
      new Player('p1', [hunter, hunterAlly]),
      new Player('p2', [victim]),
    );
    victim.addRealDamage(100000);
  });

  it('fires on the card that dealt the fatal blow only', () => {
    handler.notifyDeath(victim, hunter);

    expect(healingSources(handler.drainSteps())).toEqual(['hunter']);
  });

  it('does not fire without a killer', () => {
    handler.notifyDeath(victim, undefined, 'bleed');

    expect(healingSources(handler.drainSteps())).toEqual([]);
  });

  it('does not fire on a dead killer', () => {
    hunter.addRealDamage(100000);
    handler.notifyDeath(victim, hunter);

    expect(healingSources(handler.drainSteps())).toEqual([]);
  });
});

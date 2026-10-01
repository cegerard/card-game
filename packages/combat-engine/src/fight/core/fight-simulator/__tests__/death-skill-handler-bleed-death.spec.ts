import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { DeathSkillHandler } from '../death-skill-handler';
import { Step, StepKind } from '../@types/step';

const predatorSkill = {
  effectRate: 0.1,
  trigger: 'enemy-bleed-death',
  targetingStrategy: 'self',
};

describe('DeathSkillHandler enemy bleed death phase', () => {
  let predator: FightingCard;
  let victim: FightingCard;
  let handler: DeathSkillHandler;

  const healingSources = (steps: Step[]) =>
    steps
      .filter((s) => s.kind === StepKind.Healing)
      .map((s: any) => s.source.id);

  beforeEach(() => {
    predator = createFightingCard({
      id: 'predator',
      health: 1000,
      skills: { others: [predatorSkill] },
    });
    predator.addRealDamage(500);
    victim = createFightingCard({ id: 'victim' });
    handler = new DeathSkillHandler(
      new Player('p1', [predator]),
      new Player('p2', [victim]),
    );
    victim.addRealDamage(100000);
  });

  it('fires on the enemies of a card killed by its bleed', () => {
    handler.notifyDeath(victim, undefined, 'bleed');

    expect(healingSources(handler.drainSteps())).toEqual(['predator']);
  });

  it('does not fire on a death with another cause', () => {
    handler.notifyDeath(victim, undefined, 'poison');

    expect(healingSources(handler.drainSteps())).toEqual([]);
  });

  it('does not fire on a death without a cause', () => {
    handler.notifyDeath(victim);

    expect(healingSources(handler.drainSteps())).toEqual([]);
  });
});

describe('DeathSkillHandler enemy bleed death on the dead card team', () => {
  it('does not fire on the allies of the bleeding card', () => {
    const victim = createFightingCard({ id: 'victim' });
    const ally = createFightingCard({
      id: 'ally',
      health: 1000,
      skills: { others: [predatorSkill] },
    });
    ally.addRealDamage(500);
    const handler = new DeathSkillHandler(
      new Player('p1', [victim, ally]),
      new Player('p2', [createFightingCard()]),
    );
    victim.addRealDamage(100000);

    handler.notifyDeath(victim, undefined, 'bleed');

    expect(handler.drainSteps()).toEqual([]);
  });
});

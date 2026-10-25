import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { DeathTrigger } from '../../trigger/death-trigger';
import { Player } from '../../player';
import { DeathSkillHandler } from '../death-skill-handler';
import { FightingCard } from '../../cards/fighting-card';
import { Step, StepKind } from '../@types/step';
import {
  attackers,
  executioner,
  fragileWithLastBreath,
  healingSources,
} from '../../../../../test/helpers/reactive-kill';

const cascadeOf = (
  fallen: FightingCard,
  team1: FightingCard[],
  team2: FightingCard[],
): Step[] => {
  const handler = new DeathSkillHandler(
    new Player('p1', team1),
    new Player('p2', team2),
  );
  fallen.addRealDamage(100000);
  handler.notifyDeath(fallen);

  return handler.drainSteps();
};

describe('DeathSkillHandler kill by an ally-death reaction', () => {
  let steps: Step[];

  beforeEach(() => {
    const fallen = createFightingCard({ id: 'fallen' });
    const avenger = executioner(new DeathTrigger('ally-death', 'fallen'));
    steps = cascadeOf(fallen, [fallen, avenger], [fragileWithLastBreath()]);
  });

  it('runs the self-death skills of the card the attack killed', () => {
    expect(healingSources(steps)).toEqual(['victim']);
  });

  it('lands the self-death skills right after the kill', () => {
    const deathIndex = steps.findIndex(
      (step: any) =>
        step.kind === StepKind.StatusChange && step.card.id === 'victim',
    );

    expect(steps[deathIndex + 1].kind).toBe(StepKind.Healing);
  });
});

describe('DeathSkillHandler kill by an enemy-death reaction', () => {
  it('runs the self-death skills of the card the reaction killed', () => {
    const fallen = createFightingCard({ id: 'fallen' });
    const avenger = executioner(new DeathTrigger('enemy-death', 'fallen'));

    const steps = cascadeOf(
      fallen,
      [fallen, fragileWithLastBreath()],
      [avenger],
    );

    expect(healingSources(steps)).toEqual(['victim']);
  });
});

describe('DeathSkillHandler ally killed by the answer to a reactive kill', () => {
  it('does not launch the skills of the dead ally', () => {
    const fallen = createFightingCard({ id: 'fallen' });
    const onFallen = new DeathTrigger('ally-death', 'fallen');
    const victim = createFightingCard({ id: 'victim', health: 1, defense: 0 });
    const avenger = executioner(
      new DeathTrigger('ally-death', 'victim'),
      'avenger',
      1e9,
    );

    const steps = cascadeOf(
      fallen,
      [
        fallen,
        executioner(onFallen, 'first'),
        executioner(onFallen, 'doomed', 1),
      ],
      [victim, avenger],
    );

    expect(attackers(steps)).toEqual(['first', 'avenger']);
  });
});

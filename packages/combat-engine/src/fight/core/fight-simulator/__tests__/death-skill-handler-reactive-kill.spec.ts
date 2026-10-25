import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { ConditionalAttack } from '../../cards/skills/conditional-attack';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { AlwaysTrueAttackCondition } from '../../cards/@types/attack/conditions/always-true-attack-condition';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { DeathTrigger } from '../../trigger/death-trigger';
import { Player } from '../../player';
import { DeathSkillHandler } from '../death-skill-handler';
import { Step, StepKind } from '../@types/step';
import {
  attackers,
  executioner,
  fragileWithLastBreath,
  healingSources,
} from '../../../../../test/helpers/reactive-kill';

describe('DeathSkillHandler kill by a reactive attack', () => {
  let handler: DeathSkillHandler;
  let steps: Step[];

  beforeEach(() => {
    const fallen = createFightingCard({ id: 'fallen' });
    const avenger = createFightingCard({
      id: 'avenger',
      attack: 1000,
      accuracy: 9999,
      extraSkills: [
        new ConditionalAttack(
          'Vengeance',
          new SimpleAttack(
            'Vengeance',
            [new DamageComposition(DamageType.PHYSICAL, 1)],
            new TargetedAll(),
          ),
          new AlwaysTrueAttackCondition(),
          new DeathTrigger('ally-death', 'fallen'),
        ),
      ],
    });
    const victim = createFightingCard({
      id: 'victim',
      health: 1,
      defense: 0,
      agility: 0,
      skills: {
        others: [
          {
            effectRate: 0.1,
            trigger: 'self-death',
            targetCardId: 'victim',
            targetingStrategy: 'self',
          },
        ],
      },
    });
    handler = new DeathSkillHandler(
      new Player('p1', [fallen, avenger]),
      new Player('p2', [victim]),
    );
    fallen.addRealDamage(100000);
    handler.notifyDeath(fallen);
    steps = handler.drainSteps();
  });

  it('runs the self-death skills of the card the attack killed', () => {
    expect(
      steps
        .filter((s) => s.kind === StepKind.Healing)
        .map((s: any) => s.source.id),
    ).toContain('victim');
  });
});

describe('DeathSkillHandler ally killed by the answer to a reactive kill', () => {
  let steps: Step[];

  beforeEach(() => {
    const fallen = createFightingCard({ id: 'fallen' });
    const first = executioner(
      new DeathTrigger('ally-death', 'fallen'),
      'first',
    );
    const doomed = executioner(
      new DeathTrigger('ally-death', 'fallen'),
      'doomed',
      1,
    );
    const victim = createFightingCard({ id: 'victim', health: 1, defense: 0 });
    const avenger = executioner(
      new DeathTrigger('ally-death', 'victim'),
      'avenger',
      1e9,
    );
    const handler = new DeathSkillHandler(
      new Player('p1', [fallen, first, doomed]),
      new Player('p2', [victim, avenger]),
    );
    fallen.addRealDamage(100000);
    handler.notifyDeath(fallen);
    steps = handler.drainSteps();
  });

  it('does not launch the skills of the dead ally', () => {
    expect(attackers(steps)).not.toContain('doomed');
  });
});

describe('DeathSkillHandler kill by an enemy-death reaction', () => {
  let steps: Step[];

  beforeEach(() => {
    const fallen = createFightingCard({ id: 'fallen' });
    const victim = fragileWithLastBreath();
    const avenger = executioner(
      new DeathTrigger('enemy-death', 'fallen'),
      'avenger',
    );
    const handler = new DeathSkillHandler(
      new Player('p1', [fallen, victim]),
      new Player('p2', [avenger]),
    );
    fallen.addRealDamage(100000);
    handler.notifyDeath(fallen);
    steps = handler.drainSteps();
  });

  it('runs the self-death skills of the card the reaction killed', () => {
    expect(healingSources(steps)).toContain('victim');
  });
});

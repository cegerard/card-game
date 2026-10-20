import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { ConditionalAttack } from '../../cards/skills/conditional-attack';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { AlwaysTrueAttackCondition } from '../../cards/@types/attack/conditions/always-true-attack-condition';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { EnemyKilledTrigger } from '../../trigger/enemy-killed';
import { Player } from '../../player';
import { DeathSkillHandler } from '../death-skill-handler';
import { StepKind } from '../@types/step';

describe('DeathSkillHandler enemy killed phase cascade', () => {
  it('runs the death cascade of a card killed by the reward', () => {
    const hunter = createFightingCard({
      id: 'hunter',
      attack: 1000,
      extraSkills: [
        new ConditionalAttack(
          'Chasse',
          new SimpleAttack(
            'Chasse',
            [new DamageComposition(DamageType.PHYSICAL, 1)],
            new TargetedAll(),
          ),
          new AlwaysTrueAttackCondition(),
          new EnemyKilledTrigger(),
        ),
      ],
    });
    const victim = createFightingCard({ id: 'victim' });
    const second = createFightingCard({
      id: 'second',
      health: 1,
      defense: 0,
      skills: {
        others: [
          {
            effectRate: 0.1,
            trigger: 'self-death',
            targetCardId: 'second',
            targetingStrategy: 'self',
          },
        ],
      },
    });
    const handler = new DeathSkillHandler(
      new Player('p1', [hunter]),
      new Player('p2', [victim, second]),
    );
    victim.addRealDamage(100000);

    handler.notifyDeath(victim, hunter);

    expect(
      handler
        .drainSteps()
        .filter((s: any) => s.kind === StepKind.Healing)
        .map((s: any) => s.source.id),
    ).toContain('second');
  });
});

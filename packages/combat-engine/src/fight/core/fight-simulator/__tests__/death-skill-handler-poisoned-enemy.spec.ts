import { DeathSkillHandler } from '../death-skill-handler';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { Healing } from '../../cards/skills/healing';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { PoisonedEnemyDeathTrigger } from '../../trigger/poisoned-enemy-death';
import { StackedPoisonAttackEffect } from '../../cards/@types/attack/attack-stacked-poison-effect';
import { MathRandomizer } from '../../../tools/math-randomizer';
import { FightingCard } from '../../cards/fighting-card';
import { StepKind } from '../@types/step';

const recovery = () =>
  new Healing(
    'Instinct de Guêpe',
    0.15,
    new PoisonedEnemyDeathTrigger(),
    new Launcher(),
    undefined,
    undefined,
    undefined,
    'target-max-health',
  );

const venom = new StackedPoisonAttackEffect(
  0.03,
  3,
  3,
  2,
  new MathRandomizer(),
);

describe('DeathSkillHandler poisoned-enemy-death', () => {
  let poisoner: FightingCard;
  let victim: FightingCard;
  let handler: DeathSkillHandler;

  beforeEach(() => {
    poisoner = createFightingCard({ health: 1000, extraSkills: [recovery()] });
    poisoner.addRealDamage(500);
    victim = createFightingCard({ health: 100 });
    const player1 = new Player('p1', [poisoner]);
    const player2 = new Player('p2', [victim]);
    handler = new DeathSkillHandler(player1, player2);
  });

  it('rewards the poisoner when its poisoned enemy dies', () => {
    venom.applyEffect(victim, poisoner, null);
    victim.addRealDamage(100);
    handler.notifyDeath(victim);

    expect(handler.drainSteps().map((s) => s.kind)).toEqual([StepKind.Healing]);
  });

  it('stays silent when the dead enemy was not poisoned', () => {
    victim.addRealDamage(100);
    handler.notifyDeath(victim);

    expect(handler.drainSteps()).toEqual([]);
  });
});

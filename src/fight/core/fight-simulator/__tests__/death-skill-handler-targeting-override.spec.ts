import { DeathSkillHandler } from '../death-skill-handler';
import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { TargetingOverrideSkill } from '../../cards/skills/targeting-override';
import { AllyDeath } from '../../trigger/ally-death';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { StepKind } from '../@types/step';

describe('DeathSkillHandler with TargetingOverride skill', () => {
  const deadCardId = 'warrior-01';
  const damages = [new DamageComposition(DamageType.PHYSICAL, 1.0)];

  let handler: DeathSkillHandler;
  let player1: Player;
  let deadCard;
  let survivingCard;

  beforeEach(() => {
    deadCard = createFightingCard({
      id: deadCardId,
      health: 10,
      criticalChance: 0,
      skills: { simpleAttack: { damages } },
    });

    survivingCard = createFightingCard({
      id: 'rager-01',
      health: 5000,
      criticalChance: 0,
      skills: { simpleAttack: { damages } },
    });

    const overrideSkill = new TargetingOverrideSkill(
      new TargetedAll(),
      'rage-end',
      new AllyDeath(deadCardId),
      'rage-power',
    );
    (survivingCard as any).skills = [overrideSkill];

    const enemyCard = createFightingCard({ health: 5000, criticalChance: 0 });

    player1 = new Player('Player 1', [deadCard, survivingCard]);
    const player2 = new Player('Player 2', [enemyCard]);
    handler = new DeathSkillHandler(player1, player2);

    deadCard.addRealDamage(10);
  });

  it('produces a targeting_override step', () => {
    handler.notifyDeath(player1, player1.allCards[0]);
    const steps = handler.drainSteps();

    expect(steps[0].kind).toBe(StepKind.TargetingOverride);
  });

  it('the step contains the new targeting strategy', () => {
    handler.notifyDeath(player1, player1.allCards[0]);
    const steps = handler.drainSteps();

    expect((steps[0] as any).newStrategy).toBe('all');
  });

  it('the step contains the source card identity', () => {
    handler.notifyDeath(player1, player1.allCards[0]);
    const steps = handler.drainSteps();

    expect((steps[0] as any).source.id).toBe('rager-01');
  });

  it('the step propagates the powerId', () => {
    handler.notifyDeath(player1, player1.allCards[0]);
    const steps = handler.drainSteps();

    expect((steps[0] as any).powerId).toBe('rage-power');
  });
});

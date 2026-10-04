import { ConditionalAttack } from '../conditional-attack';
import { SimpleAttack } from '../simple-attack';
import { LowHealthDebuff } from '../../@types/attack/low-health-debuff';
import { Splash } from '../../@types/attack/splash';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { AlwaysTrueAttackCondition } from '../../@types/attack/conditions/always-true-attack-condition';
import { TurnStart } from '../../../trigger/turn-start';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { AttackSkillResults } from '../skill';

describe('ConditionalAttack with a low-health debuff', () => {
  let owner: FightingCard;
  let target: FightingCard;

  const launch = () =>
    new ConditionalAttack(
      'Exsanguination Totale',
      new SimpleAttack(
        'Exsanguination Totale',
        [new DamageComposition(DamageType.PHYSICAL, 1)],
        new TargetedFromPosition(),
      ),
      new AlwaysTrueAttackCondition(),
      new TurnStart(),
      undefined,
      undefined,
      undefined,
      new Splash('Vent Écarlate', [new DamageComposition(DamageType.AIR, 7)]),
      new LowHealthDebuff('Choc Hémorragique', 0.3, [
        { type: 'defense', rate: 0.4, duration: 4 },
      ]),
    ).launch(owner, {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [target]),
    }) as AttackSkillResults;

  beforeEach(() => {
    owner = createFightingCard({
      attack: 100,
      accuracy: 9999,
      criticalChance: 0,
    });
    target = createFightingCard({ defense: 0, agility: 0, health: 1000 });
  });

  it('debuffs the primary target left under the threshold', () => {
    target.addRealDamage(650);

    expect(launch().lowHealthDebuff.name).toBe('Choc Hémorragique');
  });

  it('does not count the splash damage', () => {
    expect(launch().lowHealthDebuff).toBeUndefined();
  });
});

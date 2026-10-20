import { MultipleAttack } from '../multiple-attack';
import { BleedStackScalingSkill } from '../bleed-stack-scaling';
import { BleedAttackEffect } from '../../@types/attack/attack-bleed-effect';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { TargetedAll } from '../../../targeting-card-strategies/targeted-all';
import { MathRandomizer } from '../../../../tools/math-randomizer';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';

describe('MultipleAttack with a bleed stack scaling', () => {
  it('strikes every defender of a hit with the same power', () => {
    const attacker = createFightingCard({
      attack: 100,
      criticalChance: 0,
      accuracy: 1000,
      bleedStackScaling: new BleedStackScalingSkill('Anatomie', 0.1, 0.5),
    });
    const defenders = [1, 2].map(() =>
      createFightingCard({ health: 10000, defense: 0, agility: 0 }),
    );
    const bleed = new BleedAttackEffect(0.01, 3, 20, new MathRandomizer(), 1);
    const attack = new MultipleAttack(
      'Rafale',
      1,
      [new DamageComposition(DamageType.PHYSICAL, 1)],
      new TargetedAll(),
      0,
      [bleed],
    );

    const { results } = attack.launch(attacker, {
      sourcePlayer: new Player('p1', [attacker]),
      opponentPlayer: new Player('p2', defenders),
    });

    expect(results[0].damage).toBe(results[1].damage);
  });
});

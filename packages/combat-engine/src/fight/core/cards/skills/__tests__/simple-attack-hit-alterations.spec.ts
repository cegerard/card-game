import { SimpleAttack } from '../simple-attack';
import { HitAlterations } from '../../@types/attack/hit-alterations';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';

describe('SimpleAttack altering the defender it hits', () => {
  const launch = (agility: number) => {
    const owner = createFightingCard({ accuracy: 100 });
    const enemy = createFightingCard({
      agility,
      health: 50000,
      resistance: 0,
    });
    const result = new SimpleAttack(
      'Fouet des Marées',
      [new DamageComposition(DamageType.WATER, 0.7)],
      new TargetedFromPosition(),
      [],
      [],
      undefined,
      undefined,
      undefined,
      new HitAlterations([
        { polarity: 'debuff', type: 'speed', rate: 0.15, duration: 1 },
      ]),
    ).launch(owner, {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [enemy]),
    });
    return { result, enemy };
  };

  it('slows the defender it hit, named after the attack', () => {
    const { result, enemy } = launch(0);

    expect(result.hitAlterations).toEqual({
      name: 'Fouet des Marées',
      buffs: [],
      debuffs: [expect.objectContaining({ target: enemy.identityInfo })],
    });
  });

  it('leaves a defender that dodged untouched', () => {
    const { result } = launch(100000);

    expect(result.hitAlterations.debuffs).toEqual([]);
  });
});

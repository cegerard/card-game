import { ConditionalAttack } from '../conditional-attack';
import { SimpleAttack } from '../simple-attack';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { EveryNTurnsCondition } from '../../@types/attack/conditions/every-n-turns-condition';
import { TurnStart } from '../../../trigger/turn-start';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';

const ambush = (interval = 1) =>
  new ConditionalAttack(
    'Embuscade Tectonique',
    new SimpleAttack(
      'Embuscade Tectonique',
      [new DamageComposition(DamageType.EARTH, 1)],
      new TargetedFromPosition(),
    ),
    new EveryNTurnsCondition(interval),
    new TurnStart(),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    true,
  );

describe('ConditionalAttack requiring its owner undamaged', () => {
  let owner: FightingCard;
  let context;

  const action = () => {
    owner.beginAction();
    owner.tickSkills();
    return owner.launchSkills('turn-start', context);
  };

  beforeEach(() => {
    owner = createFightingCard({ accuracy: 9999, extraSkills: [ambush(2)] });
    context = {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [
        createFightingCard({ agility: 0, health: 50000 }),
      ]),
    };
  });

  it('fires when its owner took no damage', () => {
    action();

    expect(action()).toHaveLength(1);
  });

  it('is blocked after its owner was hit', () => {
    action();
    owner.applyFinalDamage(10);

    expect(action()).toHaveLength(0);
  });

  it('fires at the next action without damage, its cooldown kept', () => {
    action();
    owner.applyFinalDamage(10);
    action();

    expect(action()).toHaveLength(1);
  });
});

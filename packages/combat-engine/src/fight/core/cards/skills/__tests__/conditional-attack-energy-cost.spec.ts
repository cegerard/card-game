import { ConditionalAttack } from '../conditional-attack';
import { SimpleAttack } from '../simple-attack';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { AlwaysTrueAttackCondition } from '../../@types/attack/conditions/always-true-attack-condition';
import { TurnStart } from '../../../trigger/turn-start';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';

const NOBODY: TargetingCardStrategy = {
  id: 'nobody',
  targetedCards: () => [],
};

describe('ConditionalAttack with an energy cost', () => {
  let owner: FightingCard;

  const ultimate = (
    targeting: TargetingCardStrategy = new TargetedFromPosition(),
  ) =>
    new ConditionalAttack(
      'Exsanguination Totale',
      new SimpleAttack(
        'Exsanguination Totale',
        [new DamageComposition(DamageType.PHYSICAL, 1)],
        targeting,
      ),
      new AlwaysTrueAttackCondition(),
      new TurnStart(),
      undefined,
      undefined,
      10,
    );
  const launch = (skill: ConditionalAttack) =>
    skill.launch(owner, {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [
        createFightingCard({ agility: 0, health: 5000 }),
      ]),
    });

  beforeEach(() => {
    owner = createFightingCard({
      accuracy: 9999,
      skills: { special: { energy: 1000 } },
    });
  });

  describe('with enough energy', () => {
    beforeEach(() => {
      owner.increaseSpecialEnergy();
      owner.increaseSpecialEnergy();
    });

    it('strikes', () => {
      expect(launch(ultimate()).results).toHaveLength(1);
    });

    it('spends its cost', () => {
      launch(ultimate());

      expect(owner.actualEnergy).toBe(10);
    });

    it('keeps the energy when nobody is targeted', () => {
      launch(ultimate(NOBODY));

      expect(owner.actualEnergy).toBe(20);
    });
  });

  describe('without enough energy', () => {
    it('does not strike', () => {
      expect(launch(ultimate()).results).toEqual([]);
    });
  });
});

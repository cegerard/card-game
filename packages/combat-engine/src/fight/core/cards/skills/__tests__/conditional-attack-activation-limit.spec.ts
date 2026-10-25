import { ConditionalAttack } from '../conditional-attack';
import { SimpleAttack } from '../simple-attack';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { AlwaysTrueAttackCondition } from '../../@types/attack/conditions/always-true-attack-condition';
import { AllyHealthBelowThresholdTrigger } from '../../../trigger/ally-health-below-threshold-trigger';
import { TargetedAll } from '../../../targeting-card-strategies/targeted-all';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../../@types/fighting-context';

const NOBODY: TargetingCardStrategy = { id: 'nobody', targetedCards: () => [] };
const HEALTH_EVENT = 'ally-health-selkhet';

describe('ConditionalAttack with an activation limit', () => {
  let owner: FightingCard;
  let context: FightingContext;
  let skill: ConditionalAttack;

  const build = (targeting: TargetingCardStrategy = new TargetedAll()) =>
    new ConditionalAttack(
      'Jugement de l’Obsidienne',
      new SimpleAttack(
        'Jugement de l’Obsidienne',
        [new DamageComposition(DamageType.PHYSICAL, 0.01)],
        targeting,
      ),
      new AlwaysTrueAttackCondition(),
      new AllyHealthBelowThresholdTrigger('selkhet', 0.5),
      { activationLimit: 1, endEvent: 'jugement-end' },
    );

  const dropBelowThreshold = () => {
    owner.addRealDamage(owner.actualHealth - 100);
    skill.activate(HEALTH_EVENT, context);
  };

  const healAboveThreshold = () => {
    owner.heal(1000);
    skill.activate(HEALTH_EVENT, context);
  };

  beforeEach(() => {
    owner = createFightingCard({ id: 'selkhet', health: 1000 });
    context = {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [createFightingCard({ health: 5000 })]),
    };
    skill = build();
    dropBelowThreshold();
  });

  it('fires on the first drop under the threshold', () => {
    expect(skill.isTriggered(HEALTH_EVENT)).toBe(true);
  });

  it('reports its end event on the last activation', () => {
    expect(skill.launch(owner, context).endEvent).toBe('jugement-end');
  });

  it('never fires again after a heal and a second drop', () => {
    skill.launch(owner, context);
    healAboveThreshold();
    dropBelowThreshold();

    expect(skill.isTriggered(HEALTH_EVENT)).toBe(false);
  });

  it('spends no activation when nobody was targeted', () => {
    skill = build(NOBODY);
    dropBelowThreshold();
    skill.launch(owner, context);
    healAboveThreshold();
    dropBelowThreshold();

    expect(skill.isTriggered(HEALTH_EVENT)).toBe(true);
  });

  it('exposes its end event while it is still available', () => {
    expect(skill.lifecycleEndEvent()).toBe('jugement-end');
  });
});

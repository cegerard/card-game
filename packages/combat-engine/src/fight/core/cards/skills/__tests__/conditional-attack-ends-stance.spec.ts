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
import { AttackSkillResults } from '../skill';

const NOBODY: TargetingCardStrategy = { id: 'nobody', targetedCards: () => [] };

describe('ConditionalAttack ending its required stance', () => {
  let owner: FightingCard;

  const launch = (
    targeting: TargetingCardStrategy = new TargetedFromPosition(),
  ) =>
    new ConditionalAttack(
      'Embuscade Tectonique',
      new SimpleAttack(
        'Embuscade Tectonique',
        [new DamageComposition(DamageType.PHYSICAL, 1.5)],
        targeting,
      ),
      new AlwaysTrueAttackCondition(),
      new TurnStart(),
      { requiredStance: 'Sous terre', endsStance: true },
    ).launch(owner, {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [
        createFightingCard({ agility: 0, health: 5000 }),
      ]),
    }) as AttackSkillResults;

  beforeEach(() => {
    owner = createFightingCard({ accuracy: 9999 });
    owner.activateStance({ name: 'Sous terre', duration: 1 });
  });

  it('closes the stance once it struck', () => {
    launch();

    expect(owner.hasStance('Sous terre')).toBe(false);
  });

  it('reports the stance it closed', () => {
    expect(launch().stanceEnded).toBe('Sous terre');
  });

  it('keeps the stance when nobody was targeted', () => {
    launch(NOBODY);

    expect(owner.hasStance('Sous terre')).toBe(true);
  });
});

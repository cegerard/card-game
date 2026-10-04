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

describe('ConditionalAttack opening a stance', () => {
  let owner: FightingCard;

  const launch = (
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
      undefined,
      undefined,
      undefined,
      { name: 'transe-predatrice', duration: 2 },
    ).launch(owner, {
      sourcePlayer: new Player('p1', [owner]),
      opponentPlayer: new Player('p2', [
        createFightingCard({ agility: 0, health: 5000 }),
      ]),
    }) as AttackSkillResults;

  beforeEach(() => {
    owner = createFightingCard({ accuracy: 9999 });
  });

  it('opens the stance when the attack fires', () => {
    launch();

    expect(owner.hasStance('transe-predatrice')).toBe(true);
  });

  it('reports the opened stance', () => {
    expect(launch().stanceStarted).toEqual(
      expect.objectContaining({ name: 'transe-predatrice', remainingTurns: 2 }),
    );
  });

  it('opens nothing when nobody is targeted', () => {
    launch(NOBODY);

    expect(owner.hasStance('transe-predatrice')).toBe(false);
  });
});

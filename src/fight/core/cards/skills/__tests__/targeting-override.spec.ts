import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { Player } from '../../../player';
import { FightingContext } from '../../@types/fighting-context';
import { TargetedAll } from '../../../targeting-card-strategies/targeted-all';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { TurnEnd } from '../../../trigger/turn-end';
import { TargetingOverrideSkill } from '../targeting-override';
import { SkillKind } from '../skill';

describe('TargetingOverrideSkill', () => {
  let context: FightingContext;
  let card;

  beforeEach(() => {
    card = createFightingCard({
      id: 'card-1',
      attack: 100,
      skills: {
        simpleAttack: { targetingStrategy: 'position-based' },
      },
    });
    const player1 = new Player('p1', [card]);
    const player2 = new Player('p2', [createFightingCard()]);
    context = { sourcePlayer: player1, opponentPlayer: player2 };
  });

  it('calls overrideAttackTargeting on the source card', () => {
    const skill = new TargetingOverrideSkill(
      'override',
      new TargetedAll(),
      'power-end',
      new TurnEnd(),
    );

    skill.launch(card, context);
    const results = card.launchAttack(context);

    expect(results).toHaveLength(1);
  });

  it('returns SkillResults with TargetingOverride kind', () => {
    const skill = new TargetingOverrideSkill(
      'override',
      new TargetedAll(),
      'power-end',
      new TurnEnd(),
    );

    const result = skill.launch(card, context);

    expect(result.skillKind).toBe(SkillKind.TargetingOverride);
  });

  it('propagates powerId in SkillResults', () => {
    const skill = new TargetingOverrideSkill(
      'override',
      new TargetedAll(),
      'power-end',
      new TurnEnd(),
      'rage-power',
    );

    const result = skill.launch(card, context);

    expect(result.powerId).toBe('rage-power');
  });

  it('is triggered by matching trigger', () => {
    const skill = new TargetingOverrideSkill(
      'override',
      new TargetedAll(),
      'power-end',
      new TurnEnd(),
    );

    expect(skill.isTriggered('turn-end')).toBe(true);
  });

  it('is not triggered by non-matching trigger', () => {
    const skill = new TargetingOverrideSkill(
      'override',
      new TargetedAll(),
      'power-end',
      new TurnEnd(),
    );

    expect(skill.isTriggered('next-action')).toBe(false);
  });

  describe('position-based restriction', () => {
    it('applies override when simpleAttack uses position-based targeting', () => {
      const extra = createFightingCard();
      const player2 = new Player('p2', [createFightingCard(), extra]);
      context = {
        sourcePlayer: new Player('p1', [card]),
        opponentPlayer: player2,
      };

      const skill = new TargetingOverrideSkill(
        'override',
        new TargetedAll(),
        'power-end',
        new TurnEnd(),
      );
      skill.launch(card, context);
      const results = card.launchAttack(context);

      expect(results).toHaveLength(2);
    });

    it('does not apply override when simpleAttack uses non-position-based targeting', () => {
      const cardWithTargetAll = createFightingCard({
        skills: { simpleAttack: { targetingStrategy: 'target-all' } },
      });
      const extra = createFightingCard();
      const player1 = new Player('p1', [cardWithTargetAll]);
      const player2 = new Player('p2', [createFightingCard(), extra]);
      const ctx: FightingContext = {
        sourcePlayer: player1,
        opponentPlayer: player2,
      };

      const skill = new TargetingOverrideSkill(
        'override',
        new TargetedFromPosition(),
        'power-end',
        new TurnEnd(),
      );
      skill.launch(cardWithTargetAll, ctx);
      const results = cardWithTargetAll.launchAttack(ctx);

      expect(results).toHaveLength(2);
    });
  });

  describe('with strategyResolver returning null (no killerCard)', () => {
    it('returns empty results without applying override', () => {
      const skill = new TargetingOverrideSkill(
        'override',
        undefined,
        'power-end',
        new TurnEnd(),
        undefined,
        () => null,
      );

      const result = skill.launch(card, context);

      expect(result.results).toHaveLength(0);
    });

    it('does not override the card targeting strategy', () => {
      const originalStrategyId = card.attackTargetingId;
      const skill = new TargetingOverrideSkill(
        'override',
        undefined,
        'power-end',
        new TurnEnd(),
        undefined,
        () => null,
      );

      skill.launch(card, context);

      expect(card.attackTargetingId).toBe(originalStrategyId);
    });
  });
});

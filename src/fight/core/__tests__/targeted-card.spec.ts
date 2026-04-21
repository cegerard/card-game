import { TargetedCard } from '../targeting-card-strategies/targeted-card';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { Player } from '../player';
import { TargetingOverrideSkill } from '../cards/skills/targeting-override';
import { TurnEnd } from '../trigger/turn-end';
import { SkillKind } from '../cards/skills/skill';
import { FightingContext } from '../cards/@types/fighting-context';
import { TargetingCardStrategy } from '../targeting-card-strategies/targeting-card-strategy';

describe('TargetedCard', () => {
  describe('id', () => {
    it('returns targeted-card', () => {
      const strategy = new TargetedCard('any-id');

      expect(strategy.id).toBe('targeted-card');
    });
  });

  describe('targetedCards', () => {
    it('returns the target card when alive in defending player deck', () => {
      const targetCard = createFightingCard({ id: 'enemy-1', health: 1000 });
      const otherCard = createFightingCard({ id: 'enemy-2' });
      const attacker = createFightingCard({ id: 'attacker' });

      const attackingPlayer = new Player('P1', [attacker]);
      const defendingPlayer = new Player('P2', [targetCard, otherCard]);

      const strategy = new TargetedCard('enemy-1');

      const result = strategy.targetedCards(
        attacker,
        attackingPlayer,
        defendingPlayer,
      );

      expect(result).toEqual([targetCard]);
    });

    it('returns empty array when target card is dead', () => {
      const targetCard = createFightingCard({ id: 'enemy-1', health: 1 });
      const attacker = createFightingCard({ id: 'attacker', attack: 99999 });

      const attackingPlayer = new Player('P1', [attacker]);
      const defendingPlayer = new Player('P2', [targetCard]);

      // Kill the target card
      targetCard.addRealDamage(99999);

      const strategy = new TargetedCard('enemy-1');

      const result = strategy.targetedCards(
        attacker,
        attackingPlayer,
        defendingPlayer,
      );

      expect(result).toEqual([]);
    });

    it('returns empty array when target card ID does not exist in defending deck', () => {
      const otherCard = createFightingCard({ id: 'enemy-2' });
      const attacker = createFightingCard({ id: 'attacker' });

      const attackingPlayer = new Player('P1', [attacker]);
      const defendingPlayer = new Player('P2', [otherCard]);

      const strategy = new TargetedCard('non-existent-id');

      const result = strategy.targetedCards(
        attacker,
        attackingPlayer,
        defendingPlayer,
      );

      expect(result).toEqual([]);
    });
  });
});

describe('TargetingOverrideSkill with resolver', () => {
  describe('launch with strategyResolver', () => {
    it('builds the strategy from context at launch time', () => {
      const resolver = jest.fn(
        (_ctx: FightingContext): TargetingCardStrategy =>
          new TargetedCard('enemy-1'),
      );
      const source = createFightingCard({ id: 'avenger' });
      const sourcePlayer = new Player('P1', [source]);
      const opponentPlayer = new Player('P2', [
        createFightingCard({ id: 'enemy-1' }),
      ]);
      const context: FightingContext = { sourcePlayer, opponentPlayer };

      const skill = new TargetingOverrideSkill(
        'override',
        undefined,
        'end-event',
        new TurnEnd(),
        undefined,
        resolver,
      );

      skill.launch(source, context);

      expect(resolver).toHaveBeenCalledWith(context);
    });

    it('produces a TargetedCard with empty targets when killerCard is undefined', () => {
      const resolver = (ctx: FightingContext): TargetingCardStrategy =>
        new TargetedCard(ctx.killerCard?.id ?? '');
      const source = createFightingCard({ id: 'avenger' });
      const enemy = createFightingCard({ id: 'enemy-1' });
      const sourcePlayer = new Player('P1', [source]);
      const opponentPlayer = new Player('P2', [enemy]);
      const context: FightingContext = { sourcePlayer, opponentPlayer };

      const skill = new TargetingOverrideSkill(
        'override',
        undefined,
        'end-event',
        new TurnEnd(),
        undefined,
        resolver,
      );

      skill.launch(source, context);

      const resolvedTargets = source.launchAttack(context);

      expect(resolvedTargets).toEqual([]);
    });

    it('produces a TargetedCard targeting the killer when killerCard is in context', () => {
      const killer = createFightingCard({ id: 'killer-card' });
      const resolver = (ctx: FightingContext): TargetingCardStrategy =>
        new TargetedCard(ctx.killerCard?.id ?? '');
      const source = createFightingCard({ id: 'avenger' });
      const sourcePlayer = new Player('P1', [source]);
      const opponentPlayer = new Player('P2', [killer]);
      const context: FightingContext = {
        sourcePlayer,
        opponentPlayer,
        killerCard: killer,
      };

      const skill = new TargetingOverrideSkill(
        'override',
        undefined,
        'end-event',
        new TurnEnd(),
        undefined,
        resolver,
      );

      const result = skill.launch(source, context);

      expect(result.skillKind).toBe(SkillKind.TargetingOverride);
      expect(source.attackTargetingId).toBe('targeted-card');
    });
  });
});

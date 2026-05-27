import { ShieldSkill } from '../shield';
import { HealthThresholdCondition } from '../../@types/skill-activation-conditions/health-threshold-condition';
import { Launcher } from '../../../targeting-card-strategies/launcher';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { Player } from '../../../player';
import { FightingCard } from '../../fighting-card';
import { ShieldSkillResults, SkillKind } from '../skill';

describe('ShieldSkill', () => {
  let card: FightingCard;
  let context: { sourcePlayer: Player; opponentPlayer: Player };
  let skill: ShieldSkill;

  beforeEach(() => {
    card = createFightingCard({ health: 1000, attack: 100 });
    const player = new Player('p1', [card]);
    context = {
      sourcePlayer: player,
      opponentPlayer: new Player('p2', [createFightingCard()]),
    };
    skill = new ShieldSkill(
      'Résilience Pyro-Minérale',
      0.3,
      new Launcher(),
      new HealthThresholdCondition('below', 0.3),
    );
  });

  describe('isTriggered', () => {
    it('never triggers on event names', () => {
      expect(skill.isTriggered('turn-end')).toBe(false);
    });
  });

  describe('onHealthChanged — edge-triggered logic', () => {
    it('triggers when HP crosses below threshold (35% → 25%)', () => {
      card.addRealDamage(650); // 35% remaining
      expect(skill.onHealthChanged(card)).toBe(false); // still above threshold

      card.addRealDamage(50); // 30% — still not below
      expect(skill.onHealthChanged(card)).toBe(false);

      card.addRealDamage(50); // 25% — below threshold
      expect(skill.onHealthChanged(card)).toBe(true);
    });

    it('does not re-trigger when HP is already below threshold', () => {
      card.addRealDamage(750); // 25% — first cross below
      skill.onHealthChanged(card); // consume the trigger

      card.addRealDamage(50); // still below threshold
      expect(skill.onHealthChanged(card)).toBe(false);
    });

    it('re-arms and triggers again after HP recovers above threshold then drops below', () => {
      card.addRealDamage(750); // 25% — cross below
      skill.onHealthChanged(card); // consume trigger

      card.heal(500); // back above 30%
      skill.onHealthChanged(card); // re-arm

      card.addRealDamage(800); // back below
      expect(skill.onHealthChanged(card)).toBe(true);
    });
  });

  describe('launch', () => {
    it('returns ShieldSkillResults with the correct kind', () => {
      const result = skill.launch(card, context);

      expect(result.skillKind).toBe(SkillKind.Shield);
    });

    it('applies shield to the targeted card', () => {
      const result = skill.launch(card, context) as ShieldSkillResults;

      expect(result.results).toHaveLength(1);
    });

    it('shield points equal rate * maxHealth', () => {
      const result = skill.launch(card, context) as ShieldSkillResults;

      expect(result.results[0].shield.points).toBe(300); // 0.3 * 1000
    });
  });
});

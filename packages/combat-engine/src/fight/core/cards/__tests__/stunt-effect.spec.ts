import { Player } from '../../player';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { StuntAttackEffect } from '../@types/attack/attack-stunt-effect';
import { EffectLevel } from '../@types/attack/effect-level';
import { MathRandomizer } from '../../../tools/math-randomizer';
import { CardStateFrozen } from '../@types/state/card-state-frozen';
import { CardStateStunted } from '../@types/state/card-state-stunted';

function makeCard() {
  return createFightingCard({
    attack: 200,
    defense: 0,
    health: 5000,
    criticalChance: 0,
    agility: 0,
    accuracy: 9999,
  });
}

function fightingContext(attacker = makeCard(), defender = makeCard()) {
  return {
    sourcePlayer: new Player('P1', [attacker]),
    opponentPlayer: new Player('P2', [defender]),
  };
}

describe('StuntAttackEffect', () => {
  describe('with probability=1 (always triggers)', () => {
    const stuntEffect = new StuntAttackEffect(
      0,
      1 as EffectLevel,
      new MathRandomizer(),
      1.0,
    );

    it('sets defender isStunted to true', () => {
      const attacker = makeCard();
      const defender = makeCard();
      stuntEffect.applyEffect(
        defender,
        attacker,
        fightingContext(attacker, defender),
      );
      expect(defender.isStunted).toBe(true);
    });

    it('returns an EffectResult with type stunt', () => {
      const attacker = makeCard();
      const defender = makeCard();
      const result = stuntEffect.applyEffect(
        defender,
        attacker,
        fightingContext(attacker, defender),
      );
      expect(result?.type).toBe('stunt');
    });
  });

  describe('with probability=0 (never triggers)', () => {
    const stuntEffect = new StuntAttackEffect(
      0,
      1 as EffectLevel,
      new MathRandomizer(),
      0,
    );

    it('does not stunt the defender', () => {
      const attacker = makeCard();
      const defender = makeCard();
      stuntEffect.applyEffect(
        defender,
        attacker,
        fightingContext(attacker, defender),
      );
      expect(defender.isStunted).toBe(false);
    });

    it('returns undefined', () => {
      const attacker = makeCard();
      const defender = makeCard();
      const result = stuntEffect.applyEffect(
        defender,
        attacker,
        fightingContext(attacker, defender),
      );
      expect(result).toBeUndefined();
    });
  });

  describe('without probability (always triggers)', () => {
    it('sets defender isStunted to true', () => {
      const stuntEffect = new StuntAttackEffect(
        0,
        1 as EffectLevel,
        new MathRandomizer(),
      );
      const attacker = makeCard();
      const defender = makeCard();
      stuntEffect.applyEffect(
        defender,
        attacker,
        fightingContext(attacker, defender),
      );
      expect(defender.isStunted).toBe(true);
    });
  });

  describe('stunt expiry', () => {
    it('isStunted becomes false after applyStateEffects ticks down level-1 stunt', () => {
      const stuntEffect = new StuntAttackEffect(
        0,
        1 as EffectLevel,
        new MathRandomizer(),
        1.0,
      );
      const attacker = makeCard();
      const defender = makeCard();
      stuntEffect.applyEffect(
        defender,
        attacker,
        fightingContext(attacker, defender),
      );

      defender.applyStateEffects();

      expect(defender.isStunted).toBe(false);
    });
  });

  describe('event-bound removal', () => {
    it('clears the stunt when its terminationEvent fires', () => {
      const stuntEffect = new StuntAttackEffect(
        0,
        3 as EffectLevel,
        new MathRandomizer(),
        1.0,
        'shield-end',
      );
      const attacker = makeCard();
      const defender = makeCard();
      stuntEffect.applyEffect(
        defender,
        attacker,
        fightingContext(attacker, defender),
      );

      defender.removeEventBoundEffects('shield-end');

      expect(defender.isStunted).toBe(false);
    });

    it('does not clear the stunt for a different event', () => {
      const stuntEffect = new StuntAttackEffect(
        0,
        3 as EffectLevel,
        new MathRandomizer(),
        1.0,
        'shield-end',
      );
      const attacker = makeCard();
      const defender = makeCard();
      stuntEffect.applyEffect(
        defender,
        attacker,
        fightingContext(attacker, defender),
      );

      defender.removeEventBoundEffects('other-event');

      expect(defender.isStunted).toBe(true);
    });
  });

  describe('when card is frozen while stunted', () => {
    it('stunt is still active after freeze expires', () => {
      const card = makeCard();
      card.setState(new CardStateStunted(1, 1));
      card.setState(new CardStateFrozen(1, 1, 0));

      card.applyStateEffects();

      expect(card.isStunted).toBe(true);
    });

    it('stunt expires on the following turn after freeze', () => {
      const card = makeCard();
      card.setState(new CardStateStunted(1, 1));
      card.setState(new CardStateFrozen(1, 1, 0));

      card.applyStateEffects();
      card.applyStateEffects();

      expect(card.isStunted).toBe(false);
    });
  });

  describe('when defender is frozen', () => {
    const stuntEffect = new StuntAttackEffect(
      0,
      1 as EffectLevel,
      new MathRandomizer(),
      1.0,
    );

    it('does not apply the stunt', () => {
      const attacker = makeCard();
      const defender = makeCard();
      defender.setState(new CardStateFrozen(1, 1, 0.5));

      stuntEffect.applyEffect(
        defender,
        attacker,
        fightingContext(attacker, defender),
      );

      expect(defender.isStunted).toBe(false);
    });

    it('returns undefined', () => {
      const attacker = makeCard();
      const defender = makeCard();
      defender.setState(new CardStateFrozen(1, 1, 0.5));

      const result = stuntEffect.applyEffect(
        defender,
        attacker,
        fightingContext(attacker, defender),
      );

      expect(result).toBeUndefined();
    });
  });
});

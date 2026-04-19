import { faker } from '@faker-js/faker';

import { ActionStage } from '../action-stage';
import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { Special } from '../../cards/skills/special';
import { SpecialAttack } from '../../cards/skills/special-attack';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { SimpleDodge } from '../../cards/behaviors/simple-dodge';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { Element } from '../../cards/@types/damage/element';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { FightingContext } from '../../cards/@types/fighting-context';
import { SpecialResult } from '../../cards/@types/action-result/special-result';
import { DeathSkillHandler } from '../../fight-simulator/death-skill-handler';
import { BurnAttackEffect } from '../../cards/@types/attack/attack-burn-effect';
import { EffectTriggeredDebuff } from '../../cards/@types/attack/effect-triggered-debuff';
import { RandomizerFake } from '../../../../../test/helpers/randomizer-fake';
import { StepKind } from '../../fight-simulator/@types/step';

class UnknownSpecial implements Special {
  ready(): boolean {
    return true;
  }
  launch(_source: FightingCard, _context: FightingContext): SpecialResult {
    return { actionResults: [], buffResults: [] };
  }
  increaseEnergy(actualEnergy: number): number {
    return actualEnergy;
  }
  getSpecialKind(): string {
    return 'unknownKind';
  }
}

const POSITION_BASED = new TargetedFromPosition();
const SIMPLE_ATTACK = new SimpleAttack(
  [new DamageComposition(DamageType.PHYSICAL, 1)],
  POSITION_BASED,
);

function makeCard(
  special: Special,
  simpleAttack = SIMPLE_ATTACK,
): FightingCard {
  return new FightingCard(
    faker.string.uuid(),
    'Card',
    {
      attack: 100,
      defense: 0,
      health: 1000,
      speed: 100,
      agility: 0,
      accuracy: 9999,
      criticalChance: 0,
    },
    { simpleAttack, special, others: [] },
    { dodge: new SimpleDodge() },
    Element.PHYSICAL,
  );
}

describe('ActionStage', () => {
  describe('handleAttackResult with triggeredDebuff', () => {
    describe('when a simple attack applies a burn effect with triggered debuff', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0);
      const burnEffect = new BurnAttackEffect(
        0.1,
        1,
        new EffectTriggeredDebuff(1.0, 'defense', 0.1, 2, randomizer),
      );
      const attackWithBurn = new SimpleAttack(
        [new DamageComposition(DamageType.PHYSICAL, 1)],
        POSITION_BASED,
        burnEffect,
      );
      const HIGH_ENERGY_SPECIAL = new SpecialAttack(1, 999, POSITION_BASED);
      const attacker = makeCard(HIGH_ENERGY_SPECIAL, attackWithBurn);
      const defender = makeCard(HIGH_ENERGY_SPECIAL);
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const actionStage = new ActionStage(
        player1,
        player2,
        { onCardDeath: [] },
        new DeathSkillHandler(player1, player2),
      );
      const steps = actionStage.computeNextAction([attacker]);

      it('emits a debuff step after the status_change step', () => {
        expect(steps.find((s) => s.kind === StepKind.Debuff)).toBeDefined();
      });
    });
  });

  describe('launchSpecial', () => {
    describe('when launching an unknown special kind', () => {
      const attacker = makeCard(new UnknownSpecial());
      const defender = makeCard(new SpecialAttack(1, 999, POSITION_BASED));
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const actionStage = new ActionStage(
        player1,
        player2,
        { onCardDeath: [] },
        new DeathSkillHandler(player1, player2),
      );

      it('throws', () => {
        expect(() => actionStage.computeNextAction([attacker])).toThrow(
          'Unknown special kind: unknownKind',
        );
      });
    });
  });
});

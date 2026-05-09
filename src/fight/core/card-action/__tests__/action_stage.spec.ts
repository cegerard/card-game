import { faker } from '@faker-js/faker';

import { ActionStage } from '../action-stage';
import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { Special } from '../../cards/skills/special';
import { SpecialAttack } from '../../cards/skills/special-attack';
import { SpecialHealing } from '../../cards/skills/special-healing';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { SimpleDodge } from '../../cards/behaviors/simple-dodge';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { Element } from '../../cards/@types/damage/element';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { FightingContext } from '../../cards/@types/fighting-context';
import { SpecialResult } from '../../cards/@types/action-result/special-result';
import { DeathSkillHandler } from '../../fight-simulator/death-skill-handler';
import { BurnAttackEffect } from '../../cards/@types/attack/attack-burn-effect';
import { EffectTriggeredDebuff } from '../../cards/@types/attack/effect-triggered-debuff';
import { RandomizerFake } from '../../../../../test/helpers/randomizer-fake';
import { MathRandomizer } from '../../../tools/math-randomizer';
import { StepKind } from '../../fight-simulator/@types/step';
import { Alteration } from '../../cards/@types/alteration/alteration';
import {
  BuffReport,
  DebuffReport,
} from '../../fight-simulator/@types/alteration-report';

class UnknownSpecial implements Special {
  name = 'unknown';
  ready(): boolean {
    return true;
  }
  launch(_source: FightingCard, _context: FightingContext): SpecialResult {
    return { name: 'unknown', actionResults: [], alterationResults: [] };
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
  'attack',
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
      let steps: ReturnType<ActionStage['computeNextAction']>;

      beforeEach(() => {
        const randomizer = new RandomizerFake().setNextRandomValue(0);
        const burnEffect = new BurnAttackEffect(
          0.1,
          1,
          new MathRandomizer(),
          new EffectTriggeredDebuff(1.0, 'defense', 0.1, 2, randomizer),
        );
        const attackWithBurn = new SimpleAttack(
          'attack',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          POSITION_BASED,
          [burnEffect],
        );
        const HIGH_ENERGY_SPECIAL = new SpecialAttack(
          'special',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          999,
          POSITION_BASED,
        );
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
        steps = actionStage.computeNextAction([attacker]);
      });

      it('emits the debuff step immediately after the status_change step', () => {
        const statusChangeIndex = steps.findIndex(
          (s) => s.kind === StepKind.StatusChange,
        );
        expect(steps[statusChangeIndex + 1].kind).toBe(StepKind.Debuff);
      });

      it('debuff step has correct kind and value', () => {
        const debuffStep = steps.find(
          (s) => s.kind === StepKind.Debuff,
        ) as DebuffReport;
        expect(debuffStep.debuffs[0].kind).toBe('defense');
      });

      it('debuff step has correct remainingTurns', () => {
        const debuffStep = steps.find(
          (s) => s.kind === StepKind.Debuff,
        ) as DebuffReport;
        expect(debuffStep.debuffs[0].remainingTurns).toBe(2);
      });

      it('debuff step has source card info', () => {
        const debuffStep = steps.find(
          (s) => s.kind === StepKind.Debuff,
        ) as DebuffReport;
        expect(debuffStep.source).toBeDefined();
      });
    });
  });

  describe('launchSpecial', () => {
    describe('when special attack applies a buff', () => {
      const skillName = 'Power Surge';
      let buffStep: BuffReport;

      beforeEach(() => {
        const specialWithBuff = new SpecialAttack(
          skillName,
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          0,
          POSITION_BASED,
          undefined,
          [new Alteration('attack', 1.2, 2, new Launcher())],
        );
        const attacker = makeCard(specialWithBuff);
        const defender = makeCard(
          new SpecialAttack(
            'special',
            [new DamageComposition(DamageType.PHYSICAL, 1)],
            999,
            POSITION_BASED,
          ),
        );
        const player1 = new Player('Player 1', [attacker]);
        const player2 = new Player('Player 2', [defender]);
        const actionStage = new ActionStage(
          player1,
          player2,
          { onCardDeath: [] },
          new DeathSkillHandler(player1, player2),
        );
        const steps = actionStage.computeNextAction([attacker]);
        buffStep = steps.find((s) => s.kind === StepKind.Buff) as BuffReport;
      });

      it('emits a buff step with the skill name', () => {
        expect(buffStep?.name).toBe(skillName);
      });
    });

    describe('remainingHealth snapshot in attack step', () => {
      const HIGH_ATTACK_SPECIAL = new SpecialAttack(
        'special',
        [new DamageComposition(DamageType.PHYSICAL, 1)],
        999,
        POSITION_BASED,
      );
      const attacker = makeCard(HIGH_ATTACK_SPECIAL);
      const defender = makeCard(HIGH_ATTACK_SPECIAL);
      const player1 = new Player('Player 1', [attacker]);
      const player2 = new Player('Player 2', [defender]);
      const actionStage = new ActionStage(
        player1,
        player2,
        { onCardDeath: [] },
        new DeathSkillHandler(player1, player2),
      );
      const steps = actionStage.computeNextAction([attacker]);
      const attackStep =
        steps[0] as import('../../fight-simulator/@types/damage-report').DamageReport;

      it('sets remainingHealth to the defender actual health after the hit', () => {
        expect(attackStep.damages[0].remainingHealth).toBe(
          defender.actualHealth,
        );
      });
    });

    describe('EffectTriggeredDebuff with terminationEvent roundtrip', () => {
      let defender: FightingCard;
      let steps: ReturnType<ActionStage['computeNextAction']>;

      beforeEach(() => {
        const randomizer = new RandomizerFake().setNextRandomValue(0);
        const burnEffect = new BurnAttackEffect(
          0.1,
          1,
          new MathRandomizer(),
          new EffectTriggeredDebuff(
            1.0,
            'defense',
            0.1,
            2,
            randomizer,
            'my-end-event',
          ),
        );
        const attackWithBurn = new SimpleAttack(
          'attack',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          POSITION_BASED,
          [burnEffect],
        );
        const HIGH_ENERGY_SPECIAL = new SpecialAttack(
          'special',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          999,
          POSITION_BASED,
        );
        const attacker = makeCard(HIGH_ENERGY_SPECIAL, attackWithBurn);
        defender = makeCard(HIGH_ENERGY_SPECIAL);
        const player1 = new Player('Player 1', [attacker]);
        const player2 = new Player('Player 2', [defender]);
        const actionStage = new ActionStage(
          player1,
          player2,
          { onCardDeath: [] },
          new DeathSkillHandler(player1, player2),
        );
        steps = actionStage.computeNextAction([attacker]);
      });

      it('emits a debuff step', () => {
        expect(steps.find((s) => s.kind === StepKind.Debuff)).toBeDefined();
      });

      it('stores terminationEvent on the applied debuff so it can be removed by event', () => {
        expect(defender.removeEventBoundDebuffs('my-end-event')).toHaveLength(
          1,
        );
      });
    });

    describe('remainingHealth snapshot in healing step', () => {
      let healer: FightingCard;
      let target: FightingCard;
      let healStep: import('../../fight-simulator/@types/healing-report').HealingReport;

      beforeEach(() => {
        const specialHealing = new SpecialHealing('Heal', 1, 0, new Launcher());
        healer = makeCard(specialHealing);
        target = makeCard(
          new SpecialAttack(
            'special',
            [new DamageComposition(DamageType.PHYSICAL, 1)],
            999,
            POSITION_BASED,
          ),
        );
        const player1 = new Player('Player 1', [healer]);
        const player2 = new Player('Player 2', [target]);
        const actionStage = new ActionStage(
          player1,
          player2,
          { onCardDeath: [] },
          new DeathSkillHandler(player1, player2),
        );
        const steps = actionStage.computeNextAction([healer]);
        healStep = steps.find(
          (s) => s.kind === StepKind.Healing,
        ) as import('../../fight-simulator/@types/healing-report').HealingReport;
      });

      it('sets remainingHealth to the snapshot captured at heal time', () => {
        expect(healStep.heal[0].remainingHealth).toBe(target.actualHealth);
      });
    });

    describe('when launching an unknown special kind', () => {
      const attacker = makeCard(new UnknownSpecial());
      const defender = makeCard(
        new SpecialAttack(
          'special',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          999,
          POSITION_BASED,
        ),
      );
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

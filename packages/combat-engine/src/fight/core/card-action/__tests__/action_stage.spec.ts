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
import { AlterationSkill } from '../../cards/skills/alteration-skill';
import { AllyHealthBelowThresholdTrigger } from '../../trigger/ally-health-below-threshold-trigger';
import { DamageTakenTrigger } from '../../trigger/damage-taken';
import { ConditionalAttack } from '../../cards/skills/conditional-attack';
import { AlwaysTrueAttackCondition } from '../../cards/@types/attack/conditions/always-true-attack-condition';
import { LastAttackerOfAllyTargetingStrategy } from '../../targeting-card-strategies/last-attacker-of-ally';
import { Skill } from '../../cards/skills/skill';

class UnknownSpecial implements Special {
  name = 'unknown';
  ready(): boolean {
    return true;
  }
  launch(_source: FightingCard, _context: FightingContext): SpecialResult {
    return {
      name: 'unknown',
      actionResults: [],
      alterationResults: [],
      shieldResults: [],
    };
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
        expect(debuffStep.alterations[0].kind).toBe('defense');
      });

      it('debuff step has correct remainingTurns', () => {
        const debuffStep = steps.find(
          (s) => s.kind === StepKind.Debuff,
        ) as DebuffReport;
        expect(debuffStep.alterations[0].remainingTurns).toBe(2);
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

  describe('ally-health dispatch', () => {
    const ARIONIS_ID = 'arionis-01';
    const HIGH_ENERGY = new SpecialAttack(
      'special',
      [new DamageComposition(DamageType.PHYSICAL, 1)],
      999,
      POSITION_BASED,
    );

    function makeObserverCard(allyId: string, threshold: number): FightingCard {
      const buffSkill = new AlterationSkill({
        name: 'Watch Out',
        polarity: 'buff',
        attributeType: 'attack',
        rate: 0.1,
        duration: 1,
        trigger: new AllyHealthBelowThresholdTrigger(allyId, threshold),
        targetingStrategy: new Launcher(),
      });
      return new FightingCard(
        'observer-01',
        'Observer',
        {
          attack: 10,
          defense: 0,
          health: 1000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
        },
        {
          simpleAttack: SIMPLE_ATTACK,
          special: HIGH_ENERGY,
          others: [buffSkill],
        },
        { dodge: new SimpleDodge() },
        Element.PHYSICAL,
      );
    }

    describe('when ally is hit (non-dodge)', () => {
      let steps: ReturnType<ActionStage['computeNextAction']>;
      let arionis: FightingCard;

      beforeEach(() => {
        const attacker = makeCard(HIGH_ENERGY);
        arionis = new FightingCard(
          ARIONIS_ID,
          'Arionis',
          {
            attack: 10,
            defense: 0,
            health: 200,
            speed: 100,
            agility: 0,
            accuracy: 100,
            criticalChance: 0,
          },
          { simpleAttack: SIMPLE_ATTACK, special: HIGH_ENERGY, others: [] },
          { dodge: new SimpleDodge() },
          Element.PHYSICAL,
        );
        const observer = makeObserverCard(ARIONIS_ID, 0.6);
        const player1 = new Player('Player 1', [attacker]);
        const player2 = new Player('Player 2', [arionis, observer]);
        const actionStage = new ActionStage(
          player1,
          player2,
          { onCardDeath: [] },
          new DeathSkillHandler(player1, player2),
        );
        steps = actionStage.computeNextAction([attacker]);
      });

      it('emits a buff step from the observer ally-health trigger', () => {
        expect(steps.some((s) => s.kind === StepKind.Buff)).toBe(true);
      });
    });

    describe('when the hit is dodged', () => {
      let steps: ReturnType<ActionStage['computeNextAction']>;
      let arionis: FightingCard;

      beforeEach(() => {
        const LOW_ACCURACY = new SimpleAttack(
          'attack',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          POSITION_BASED,
        );
        const attacker = new FightingCard(
          faker.string.uuid(),
          'Attacker',
          {
            attack: 100,
            defense: 0,
            health: 1000,
            speed: 100,
            agility: 0,
            accuracy: 0,
            criticalChance: 0,
          },
          { simpleAttack: LOW_ACCURACY, special: HIGH_ENERGY, others: [] },
          { dodge: new SimpleDodge() },
          Element.PHYSICAL,
        );
        arionis = new FightingCard(
          ARIONIS_ID,
          'Arionis',
          {
            attack: 10,
            defense: 0,
            health: 200,
            speed: 100,
            agility: 1,
            accuracy: 100,
            criticalChance: 0,
          },
          { simpleAttack: SIMPLE_ATTACK, special: HIGH_ENERGY, others: [] },
          { dodge: new SimpleDodge() },
          Element.PHYSICAL,
        );
        const observer = makeObserverCard(ARIONIS_ID, 0.6);
        const player1 = new Player('Player 1', [attacker]);
        const player2 = new Player('Player 2', [arionis, observer]);
        const actionStage = new ActionStage(
          player1,
          player2,
          { onCardDeath: [] },
          new DeathSkillHandler(player1, player2),
        );
        steps = actionStage.computeNextAction([attacker]);
      });

      it('does not emit a buff step from the observer', () => {
        expect(steps.some((s) => s.kind === StepKind.Buff)).toBe(false);
      });

      it('does not set lastAttacker on the dodging card', () => {
        expect(arionis.lastAttacker).toBeUndefined();
      });
    });
  });

  describe('damage-taken dispatch', () => {
    const AEGIS_ID = 'aegis-01';
    const RIPOSTE_NAME = 'Contre-attaque';
    const HIGH_ENERGY = new SpecialAttack(
      'special',
      [new DamageComposition(DamageType.PHYSICAL, 1)],
      999,
      POSITION_BASED,
    );

    function makeRiposteSkill(monitoredId: string): ConditionalAttack {
      return new ConditionalAttack(
        RIPOSTE_NAME,
        new SimpleAttack(
          RIPOSTE_NAME,
          [new DamageComposition(DamageType.PHYSICAL, 0.5)],
          new LastAttackerOfAllyTargetingStrategy(monitoredId),
        ),
        new AlwaysTrueAttackCondition(),
        new DamageTakenTrigger(monitoredId),
      );
    }

    function makeDefender(agility: number, others: Skill[]): FightingCard {
      return new FightingCard(
        AEGIS_ID,
        'Aegis',
        {
          attack: 100,
          defense: 0,
          health: 1000,
          speed: 100,
          agility,
          accuracy: 100,
          criticalChance: 0,
        },
        { simpleAttack: SIMPLE_ATTACK, special: HIGH_ENERGY, others },
        { dodge: new SimpleDodge() },
        Element.PHYSICAL,
      );
    }

    function riposteSteps(
      steps: ReturnType<ActionStage['computeNextAction']>,
    ): unknown[] {
      return steps.filter(
        (s) => s.kind === StepKind.Attack && s.name === RIPOSTE_NAME,
      );
    }

    describe('when the monitored card is hit', () => {
      let steps: ReturnType<ActionStage['computeNextAction']>;
      let attacker: FightingCard;

      beforeEach(() => {
        attacker = makeCard(HIGH_ENERGY);
        const aegis = makeDefender(0, [makeRiposteSkill(AEGIS_ID)]);
        const player1 = new Player('Player 1', [attacker]);
        const player2 = new Player('Player 2', [aegis]);
        const actionStage = new ActionStage(
          player1,
          player2,
          { onCardDeath: [] },
          new DeathSkillHandler(player1, player2),
        );
        steps = actionStage.computeNextAction([attacker]);
      });

      it('emits the counter attack step', () => {
        expect(riposteSteps(steps)).toHaveLength(1);
      });

      it('damages the attacker back', () => {
        expect(attacker.actualHealth).toBeLessThan(1000);
      });
    });

    describe('when the monitored card is hit a second time', () => {
      let secondSteps: ReturnType<ActionStage['computeNextAction']>;

      beforeEach(() => {
        const attacker = makeCard(HIGH_ENERGY);
        const aegis = makeDefender(0, [makeRiposteSkill(AEGIS_ID)]);
        const player1 = new Player('Player 1', [attacker]);
        const player2 = new Player('Player 2', [aegis]);
        const actionStage = new ActionStage(
          player1,
          player2,
          { onCardDeath: [] },
          new DeathSkillHandler(player1, player2),
        );
        actionStage.computeNextAction([attacker]);
        secondSteps = actionStage.computeNextAction([attacker]);
      });

      it('counters again instead of arming only once', () => {
        expect(riposteSteps(secondSteps)).toHaveLength(1);
      });
    });

    describe('when the hit is dodged', () => {
      let steps: ReturnType<ActionStage['computeNextAction']>;

      beforeEach(() => {
        const attacker = new FightingCard(
          faker.string.uuid(),
          'Attacker',
          {
            attack: 100,
            defense: 0,
            health: 1000,
            speed: 100,
            agility: 0,
            accuracy: 0,
            criticalChance: 0,
          },
          { simpleAttack: SIMPLE_ATTACK, special: HIGH_ENERGY, others: [] },
          { dodge: new SimpleDodge() },
          Element.PHYSICAL,
        );
        const aegis = makeDefender(1, [makeRiposteSkill(AEGIS_ID)]);
        const player1 = new Player('Player 1', [attacker]);
        const player2 = new Player('Player 2', [aegis]);
        const actionStage = new ActionStage(
          player1,
          player2,
          { onCardDeath: [] },
          new DeathSkillHandler(player1, player2),
        );
        steps = actionStage.computeNextAction([attacker]);
      });

      it('does not counter', () => {
        expect(riposteSteps(steps)).toHaveLength(0);
      });
    });

    describe('when an ally monitors the damaged card', () => {
      let steps: ReturnType<ActionStage['computeNextAction']>;

      beforeEach(() => {
        const attacker = makeCard(HIGH_ENERGY);
        const aegis = makeDefender(0, []);
        const ally = new FightingCard(
          'ally-01',
          'Ally',
          {
            attack: 100,
            defense: 0,
            health: 1000,
            speed: 100,
            agility: 0,
            accuracy: 100,
            criticalChance: 0,
          },
          {
            simpleAttack: SIMPLE_ATTACK,
            special: HIGH_ENERGY,
            others: [makeRiposteSkill(AEGIS_ID)],
          },
          { dodge: new SimpleDodge() },
          Element.PHYSICAL,
        );
        const player1 = new Player('Player 1', [attacker]);
        const player2 = new Player('Player 2', [aegis, ally]);
        const actionStage = new ActionStage(
          player1,
          player2,
          { onCardDeath: [] },
          new DeathSkillHandler(player1, player2),
        );
        steps = actionStage.computeNextAction([attacker]);
      });

      it('lets the ally react to the hit', () => {
        expect(riposteSteps(steps)).toHaveLength(1);
      });
    });
  });

  describe('stance opened by a special', () => {
    const STANCE = 'forteresse-des-ages';

    function stanceSpecial() {
      return new SpecialAttack(
        'Forteresse des Âges',
        [new DamageComposition(DamageType.PHYSICAL, 0)],
        0,
        POSITION_BASED,
        undefined,
        undefined,
        undefined,
        undefined,
        { name: STANCE, duration: 3 },
      );
    }

    function run(special: SpecialAttack) {
      const caster = makeCard(special);
      const defender = makeCard(stanceSpecial());
      const player1 = new Player('Player 1', [caster]);
      const player2 = new Player('Player 2', [defender]);
      const actionStage = new ActionStage(
        player1,
        player2,
        { onCardDeath: [] },
        new DeathSkillHandler(player1, player2),
      );
      return { steps: actionStage.computeNextAction([caster]), caster };
    }

    it('emits a stance_started step', () => {
      const { steps } = run(stanceSpecial());

      expect(steps.some((s) => s.kind === StepKind.StanceStarted)).toBe(true);
    });

    it('names the stance in the step', () => {
      const { steps } = run(stanceSpecial());
      const started = steps.find((s) => s.kind === StepKind.StanceStarted);

      expect((started as any).name).toBe(STANCE);
    });

    it('holds the stance on the caster', () => {
      const { caster } = run(stanceSpecial());

      expect(caster.hasStance(STANCE)).toBe(true);
    });

    it('emits no stance step for a special without one', () => {
      const plain = new SpecialAttack(
        'Plain',
        [new DamageComposition(DamageType.PHYSICAL, 1)],
        0,
        POSITION_BASED,
      );

      const { steps } = run(plain);

      expect(steps.some((s) => s.kind === StepKind.StanceStarted)).toBe(false);
    });
  });
});

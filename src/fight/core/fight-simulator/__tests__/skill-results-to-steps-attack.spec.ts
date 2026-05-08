import { skillResultsToSteps } from '../skill-results-to-steps';
import {
  SkillKind,
  AttackSkillResults,
  BuffSkillResults,
} from '../../cards/skills/skill';
import { StepKind } from '../@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

describe('skillResultsToSteps: SkillKind.Attack branch', () => {
  const card = createFightingCard({ id: 'attacker' });
  const defender = createFightingCard({ id: 'defender' });

  const attackResult: AttackSkillResults = {
    skillKind: SkillKind.Attack,
    name: 'Slash',
    results: [
      {
        damage: 50,
        isCritical: false,
        dodge: false,
        defender,
        remainingHealth: 950,
      },
    ],
  };

  it('emits an Attack step', () => {
    const steps = skillResultsToSteps(card, [attackResult]);

    expect(steps[0].kind).toBe(StepKind.Attack);
  });

  it('includes the skill name in the Attack step', () => {
    const steps = skillResultsToSteps(card, [attackResult]);

    expect((steps[0] as any).name).toBe('Slash');
  });

  it('includes damage in the Attack step', () => {
    const steps = skillResultsToSteps(card, [attackResult]);

    expect((steps[0] as any).damages[0].damage).toBe(50);
  });

  it('includes remainingHealth snapshot from AttackResult', () => {
    const steps = skillResultsToSteps(card, [attackResult]);

    expect((steps[0] as any).damages[0].remainingHealth).toBe(950);
  });

  it('emits a status_change dead step when defender is dead', () => {
    const deadDefender = createFightingCard({ id: 'dead', health: 1 });
    deadDefender.addRealDamage(9999);
    const resultWithDead: AttackSkillResults = {
      skillKind: SkillKind.Attack,
      results: [
        {
          damage: 9999,
          isCritical: false,
          dodge: false,
          defender: deadDefender,
          remainingHealth: 0,
        },
      ],
    };
    const steps = skillResultsToSteps(card, [resultWithDead]);

    expect(steps[1].kind).toBe(StepKind.StatusChange);
  });

  it('emits a status_change step for applied effect', () => {
    const defenderWithEffect = createFightingCard({ id: 'burned' });
    const resultWithEffect: AttackSkillResults = {
      skillKind: SkillKind.Attack,
      results: [
        {
          damage: 10,
          isCritical: false,
          dodge: false,
          defender: defenderWithEffect,
          remainingHealth: 990,
          effects: [{ type: 'burn', card: defenderWithEffect }],
        },
      ],
    };
    const steps = skillResultsToSteps(card, [resultWithEffect]);

    expect(steps[1].kind).toBe(StepKind.StatusChange);
  });
});

describe('skillResultsToSteps: absent endEventProcessor with endEvent', () => {
  const card = createFightingCard({ id: 'source' });

  const buffResultWithEndEvent: BuffSkillResults = {
    skillKind: SkillKind.Buff,
    endEvent: 'rage-end',
    results: [
      {
        target: card.identityInfo,
        alteration: {
          polarity: 'buff',
          type: 'attack',
          value: 10,
          duration: 2,
        },
      },
    ],
  };

  it('does not throw when endEventProcessor is absent', () => {
    expect(() =>
      skillResultsToSteps(card, [buffResultWithEndEvent]),
    ).not.toThrow();
  });

  it('silently skips the endEvent when endEventProcessor is absent', () => {
    const steps = skillResultsToSteps(card, [buffResultWithEndEvent]);

    expect(steps).toHaveLength(1);
  });
});

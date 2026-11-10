import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { Player } from '../../../player';
import { SupportSkill, SupportConfig } from '../support';
import { NextAction } from '../../../trigger/next-action';
import { EveryNTurnsCondition } from '../../@types/attack/conditions/every-n-turns-condition';
import { LowestHealthAllyStrategy } from '../../../targeting-card-strategies/most-wounded-ally';
import { CardStatePoisoned } from '../../@types/state/card-state-poisoned';
import { skillResultsToSteps } from '../../../fight-simulator/skill-results-to-steps';
import { StepKind } from '../../../fight-simulator/@types/step';

const GUST: SupportConfig = {
  shield: { rate: 0.4, duration: 2 },
  cleanse: 1,
  alterations: [{ type: 'speed', rate: 0.2, duration: 1, polarity: 'buff' }],
};

describe('SupportSkill', () => {
  let caster: FightingCard;
  let ally: FightingCard;
  let skill: SupportSkill;

  const launch = () =>
    skill.launch(caster, {
      sourcePlayer: new Player('p1', [caster, ally]),
      opponentPlayer: new Player('p2', [createFightingCard()]),
    });
  const cooldown = (turns: number) =>
    Array.from({ length: turns }).forEach(() => skill.tick());

  beforeEach(() => {
    caster = createFightingCard({ health: 520 });
    ally = createFightingCard({ health: 2000, speed: 100, resistance: 0 });
    skill = new SupportSkill(
      'Bourrasque',
      new NextAction(),
      new LowestHealthAllyStrategy(),
      new EveryNTurnsCondition(3),
      GUST,
    );
  });

  it('sizes the shield on the caster max health', () => {
    expect(launch().results[0].shield.points).toBe(208);
  });

  it('cleanses a status of the target', () => {
    ally.setState(new CardStatePoisoned(1, 3, 10));

    expect(launch().results[0].cleansed).toEqual(['poison']);
  });

  it('alters the target', () => {
    launch();

    expect(ally.actualSpeed).toBe(120);
  });

  it('waits for its cooldown', () => {
    cooldown(2);

    expect(skill.isTriggered('next-action')).toBe(false);
  });

  it('fires once its cooldown ran out', () => {
    cooldown(3);

    expect(skill.isTriggered('next-action')).toBe(true);
  });

  it('restarts its cooldown once it helped somebody', () => {
    cooldown(3);
    launch();

    expect(skill.isTriggered('next-action')).toBe(false);
  });

  it('keeps its cooldown when nobody needed it', () => {
    cooldown(3);
    ally.addRealDamage(ally.maxHealth);
    launch();

    expect(skill.isTriggered('next-action')).toBe(true);
  });

  it('reports the shield, the cleanse, then the buff', () => {
    ally.setState(new CardStatePoisoned(1, 3, 10));

    expect(skillResultsToSteps(caster, [launch()]).map((s) => s.kind)).toEqual([
      StepKind.ShieldApplied,
      StepKind.EffectCleansed,
      StepKind.Buff,
    ]);
  });

  it('rejects a support that does nothing', () => {
    expect(
      () =>
        new SupportSkill(
          'Vide',
          new NextAction(),
          new LowestHealthAllyStrategy(),
          new EveryNTurnsCondition(3),
          {},
        ),
    ).toThrow('SUPPORT skill requires a shield, a cleanse or alterations');
  });
});

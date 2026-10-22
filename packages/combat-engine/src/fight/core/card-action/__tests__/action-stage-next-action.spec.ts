import { ActionStage } from '../action-stage';
import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { ConditionalAttack } from '../../cards/skills/conditional-attack';
import { ConcealmentSkill } from '../../cards/skills/concealment';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { AlwaysTrueAttackCondition } from '../../cards/@types/attack/conditions/always-true-attack-condition';
import { NextAction } from '../../trigger/next-action';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { DeathSkillHandler } from '../../fight-simulator/death-skill-handler';
import { Step, StepKind } from '../../fight-simulator/@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

const UNDERGROUND = { name: 'Sous terre', duration: 1 };

const strike = (stanceActivation?, endsStance?) =>
  new ConditionalAttack(
    'Frappe',
    new SimpleAttack(
      'Frappe',
      [new DamageComposition(DamageType.PHYSICAL, 1)],
      new TargetedFromPosition(),
    ),
    new AlwaysTrueAttackCondition(),
    new NextAction(),
    undefined,
    endsStance ? UNDERGROUND.name : undefined,
    undefined,
    undefined,
    undefined,
    stanceActivation,
    undefined,
    undefined,
    endsStance,
  );

describe('ActionStage next-action event', () => {
  let card: FightingCard;

  const play = (): Step[] => {
    const player1 = new Player('p1', [card]);
    const player2 = new Player('p2', [
      createFightingCard({ agility: 0, health: 100000 }),
    ]);
    return new ActionStage(
      player1,
      player2,
      { onCardDeath: [] },
      new DeathSkillHandler(player1, player2),
    ).computeNextAction([card]);
  };
  const kinds = (steps: Step[]) => steps.map((s) => s.kind);

  describe('with an attack closing its stance', () => {
    beforeEach(() => {
      card = createFightingCard({
        accuracy: 9999,
        extraSkills: [strike(undefined, true)],
      });
      card.activateStance(UNDERGROUND);
    });

    it('reports the stance it closed', () => {
      expect(kinds(play())).toContain(StepKind.StanceEnded);
    });
  });

  describe('with an attack opening a stance', () => {
    beforeEach(() => {
      card = createFightingCard({
        accuracy: 9999,
        extraSkills: [strike(UNDERGROUND)],
      });
    });

    it('reports the stance it opened', () => {
      expect(kinds(play())).toContain(StepKind.StanceStarted);
    });
  });

  describe('with a dive firing next to an attack', () => {
    beforeEach(() => {
      card = createFightingCard({
        accuracy: 9999,
        extraSkills: [
          new ConcealmentSkill('Plongée', new NextAction()),
          strike(),
        ],
      });
    });

    it('reports the concealment it opened before the attack', () => {
      expect(kinds(play()).slice(0, 3)).toEqual([
        StepKind.ConcealmentStarted,
        StepKind.Attack,
        StepKind.ConcealmentEnded,
      ]);
    });
  });
});

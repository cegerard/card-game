import { ActionStage } from '../action-stage';
import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { ConditionalAttack } from '../../cards/skills/conditional-attack';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { AlwaysTrueAttackCondition } from '../../cards/@types/attack/conditions/always-true-attack-condition';
import { Trigger } from '../../trigger/trigger';
import { TurnStart } from '../../trigger/turn-start';
import { NextAction } from '../../trigger/next-action';
import { DamageTakenTrigger } from '../../trigger/damage-taken';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { DeathSkillHandler } from '../../fight-simulator/death-skill-handler';
import { EndEventProcessor } from '../../fight-simulator/end-event-processor';
import { Step, StepKind } from '../../fight-simulator/@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

const END_EVENT = 'ultimate-over';

const oneShotAttack = (trigger: Trigger) =>
  new ConditionalAttack(
    'Ultime',
    new SimpleAttack(
      'Ultime',
      [new DamageComposition(DamageType.PHYSICAL, 1)],
      new TargetedFromPosition(),
    ),
    new AlwaysTrueAttackCondition(),
    trigger,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    1,
    END_EVENT,
  );

describe('ActionStage end event of an exhausted conditional attack', () => {
  let owner: FightingCard;
  let enemy: FightingCard;

  const play = (acting: FightingCard): Step[] => {
    const player1 = new Player('p1', [owner]);
    const player2 = new Player('p2', [enemy]);
    return new ActionStage(
      player1,
      player2,
      { onCardDeath: [] },
      new DeathSkillHandler(player1, player2),
      new EndEventProcessor(player1, player2),
    ).computeNextAction([acting]);
  };
  const kinds = (steps: Step[]) => steps.map((s) => s.kind);

  const ownerWith = (trigger: Trigger) => {
    owner = createFightingCard({
      id: 'owner',
      accuracy: 9999,
      health: 100000,
      extraSkills: [oneShotAttack(trigger)],
    });
    owner.applyBuff('attack', 0.5, 0, END_EVENT);
  };

  beforeEach(() => {
    enemy = createFightingCard({ id: 'enemy', agility: 0, health: 100000 });
  });

  it('releases its buffs when fired on turn-start', () => {
    ownerWith(new TurnStart());

    expect(kinds(play(owner))).toContain(StepKind.BuffRemoved);
  });

  it('releases its buffs when fired on next-action', () => {
    ownerWith(new NextAction());

    expect(kinds(play(owner))).toContain(StepKind.BuffRemoved);
  });

  it('releases its buffs when fired as a reaction to a hit', () => {
    ownerWith(new DamageTakenTrigger('owner'));
    enemy = createFightingCard({ id: 'enemy', accuracy: 9999 });

    expect(kinds(play(enemy))).toContain(StepKind.BuffRemoved);
  });
});

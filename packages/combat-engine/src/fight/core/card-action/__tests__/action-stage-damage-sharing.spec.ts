import { StepKind } from '@card-game/shared-types';
import { ActionStage } from '../action-stage';
import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { Battlefield } from '../../cards/@types/battlefield/battlefield';
import { HealthThresholdCondition } from '../../cards/@types/skill-activation-conditions/health-threshold-condition';
import { ShieldSkill } from '../../cards/skills/shield';
import { DeathSkillHandler } from '../../fight-simulator/death-skill-handler';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

const rampart = () =>
  new ShieldSkill(
    'Rempart',
    0.3,
    new Launcher(),
    new HealthThresholdCondition('below', 0.9),
  );

describe('ActionStage damage sharing', () => {
  let attacker: FightingCard;
  let stage: ActionStage;

  beforeEach(() => {
    attacker = createFightingCard({
      attack: 100,
      accuracy: 1000,
      criticalChance: 0,
      skills: { special: { kind: 'specialAttack', energy: 9999 } },
    });
    const member = createFightingCard({ health: 1000, defense: 0, agility: 0 });
    // Carries half of the hit, which sends it under its shield threshold.
    const carrier = createFightingCard({
      health: 100,
      extraSkills: [rampart()],
    });
    const player1 = new Player('p1', [attacker]);
    const player2 = new Player('p2', [member, carrier]);
    new Battlefield({
      name: 'Cercle',
      duration: 2,
      allies: { damageSharing: { rate: 0.5, maxShareRate: 1 } },
    }).deploy(member, { sourcePlayer: player2, opponentPlayer: player1 });
    stage = new ActionStage(
      player1,
      player2,
      { onCardDeath: [] },
      new DeathSkillHandler(player1, player2),
    );
  });

  it('reports the share right before what its carrier did on feeling it', () => {
    const kinds = stage.computeNextAction([attacker]).map((step) => step.kind);

    expect(kinds[kinds.indexOf(StepKind.DamageShared) + 1]).toBe(
      StepKind.ShieldApplied,
    );
  });
});

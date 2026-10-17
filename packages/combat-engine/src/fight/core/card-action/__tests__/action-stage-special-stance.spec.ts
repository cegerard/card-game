import { ActionStage } from '../action-stage';
import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { SpecialStance } from '../../cards/skills/special-stance';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { Alteration } from '../../cards/@types/alteration/alteration';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { SimpleDodge } from '../../cards/behaviors/simple-dodge';
import { MathRandomizer } from '../../../tools/math-randomizer';
import { DeathSkillHandler } from '../../fight-simulator/death-skill-handler';
import { Step, StepKind } from '../../fight-simulator/@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

const STATS = {
  attack: 100,
  defense: 0,
  health: 1000,
  speed: 10,
  agility: 0,
  accuracy: 100,
  criticalChance: 0,
};

describe('ActionStage stance special', () => {
  let selkhet: FightingCard;
  let steps: Step[];

  beforeEach(() => {
    selkhet = new FightingCard(
      'selkhet',
      'Selkhet',
      STATS,
      {
        simpleAttack: new SimpleAttack(
          'Lacération',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          new TargetedFromPosition(),
        ),
        special: new SpecialStance(
          'Fusion Tectonique',
          0,
          { name: 'fusion', duration: 2 },
          [new Alteration('accuracy', 0.3, 2, new Launcher())],
          undefined,
          2,
        ),
        others: [],
      },
      { dodge: new SimpleDodge() },
      new MathRandomizer(),
    );
    const player1 = new Player('p1', [selkhet]);
    const player2 = new Player('p2', [createFightingCard({})]);
    steps = new ActionStage(
      player1,
      player2,
      { onCardDeath: [] },
      new DeathSkillHandler(player1, player2),
    ).computeNextAction([selkhet]);
  });

  it('reports the special, then what the stance brought', () => {
    expect(steps.map((s) => s.kind)).toEqual([
      StepKind.SpecialStance,
      StepKind.StanceStarted,
      StepKind.Buff,
      StepKind.ConcealmentStarted,
    ]);
  });

  it('reports the special with its caster and an empty gauge', () => {
    expect(steps[0]).toEqual({
      kind: StepKind.SpecialStance,
      name: 'Fusion Tectonique',
      caster: selkhet.identityInfo,
      energy: 0,
    });
  });

  it('leaves its caster concealed, since it is no attack', () => {
    expect(selkhet.isConcealed()).toBe(true);
  });
});

import { ActionStage } from '../action-stage';
import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { ConditionalAttack } from '../../cards/skills/conditional-attack';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { AlwaysTrueAttackCondition } from '../../cards/@types/attack/conditions/always-true-attack-condition';
import { CardStateFrozen } from '../../cards/@types/state/card-state-frozen';
import { TurnStart } from '../../trigger/turn-start';
import { Splash } from '../../cards/@types/attack/splash';
import { TargetedFromPosition } from '../../targeting-card-strategies/targeted-from-position';
import { DeathSkillHandler } from '../../fight-simulator/death-skill-handler';
import { Step, StepKind } from '../../fight-simulator/@types/step';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

const ULTIMATE = 'Exsanguination Totale';

const ultimate = (splash?: Splash) =>
  new ConditionalAttack(
    ULTIMATE,
    new SimpleAttack(
      ULTIMATE,
      [new DamageComposition(DamageType.PHYSICAL, 1)],
      new TargetedFromPosition(),
    ),
    new AlwaysTrueAttackCondition(),
    new TurnStart(),
    { energyCost: 10, splash },
  );

describe('ActionStage turn-start event', () => {
  let scythra: FightingCard;

  const play = (): Step[] => {
    const player1 = new Player('p1', [scythra]);
    const player2 = new Player('p2', [
      createFightingCard({ agility: 0, health: 100000 }),
    ]);
    return new ActionStage(
      player1,
      player2,
      { onCardDeath: [] },
      new DeathSkillHandler(player1, player2),
    ).computeNextAction([scythra]);
  };
  const attackNames = (steps: Step[]) =>
    steps
      .filter(
        (s) => s.kind === StepKind.Attack || s.kind === StepKind.SpecialAttack,
      )
      .map((s: any) => s.name);

  beforeEach(() => {
    scythra = createFightingCard({
      accuracy: 9999,
      skills: {
        simpleAttack: { name: 'Lacération du Zéphyr' },
        special: { name: 'Dissection Éolienne', energy: 30 },
      },
      extraSkills: [ultimate()],
    });
    scythra.increaseSpecialEnergy();
    scythra.increaseSpecialEnergy();
    scythra.increaseSpecialEnergy();
  });

  it('fires before the action and lets the turn go on', () => {
    expect(attackNames(play())).toEqual([ULTIMATE, 'Lacération du Zéphyr']);
  });

  it('spends the energy before the special is checked', () => {
    play();

    expect(scythra.actualEnergy).toBe(30);
  });

  it('does not fire for a card that skips its turn', () => {
    scythra.setState(new CardStateFrozen(1, 1, 0.2));

    expect(play()).toEqual([]);
  });

  it('reports the splash right after the ultimate', () => {
    scythra = createFightingCard({
      accuracy: 9999,
      skills: {
        simpleAttack: { name: 'Lacération du Zéphyr' },
        special: { energy: 1000 },
      },
      extraSkills: [
        ultimate(
          new Splash('Vent Écarlate', [
            new DamageComposition(DamageType.AIR, 0.6),
          ]),
        ),
      ],
    });
    scythra.increaseSpecialEnergy();

    expect(attackNames(play())).toEqual([
      ULTIMATE,
      'Vent Écarlate',
      'Lacération du Zéphyr',
    ]);
  });
});

describe('ActionStage turn-start strike killing the last enemy', () => {
  let steps: Step[];

  beforeEach(() => {
    const striker = createFightingCard({
      accuracy: 9999,
      attack: 100000,
      extraSkills: [ultimate()],
    });
    striker.increaseSpecialEnergy();
    striker.increaseSpecialEnergy();
    const player1 = new Player('p1', [striker]);
    const player2 = new Player('p2', [
      createFightingCard({ agility: 0, health: 1, defense: 0 }),
    ]);
    steps = new ActionStage(
      player1,
      player2,
      { onCardDeath: [] },
      new DeathSkillHandler(player1, player2),
    ).computeNextAction([striker]);
  });

  it('reports the death right after the strike', () => {
    expect(steps[1].kind).toBe(StepKind.StatusChange);
  });

  it('does not launch an empty attack afterwards', () => {
    expect(steps.map((s) => s.kind)).toEqual([
      StepKind.Attack,
      StepKind.StatusChange,
    ]);
  });
});

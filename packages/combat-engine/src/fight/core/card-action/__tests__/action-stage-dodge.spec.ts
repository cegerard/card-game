import { ActionStage } from '../action-stage';
import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { DeathSkillHandler } from '../../fight-simulator/death-skill-handler';
import { EndEventProcessor } from '../../fight-simulator/end-event-processor';
import { Step, StepKind } from '../../fight-simulator/@types/step';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { AlterationSkill } from '../../cards/skills/alteration-skill';
import { ConditionalAttack } from '../../cards/skills/conditional-attack';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { AlwaysTrueAttackCondition } from '../../cards/@types/attack/conditions/always-true-attack-condition';
import { DodgeTrigger } from '../../trigger/dodge';
import { Launcher } from '../../targeting-card-strategies/launcher';
import { LastDodgedAttackerStrategy } from '../../targeting-card-strategies/last-attacker-of-ally';
import { Skill } from '../../cards/skills/skill';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';

const DANCER = 'dancer';
const COUNTER = 'Dard du Crépuscule';

const carapace = () =>
  new AlterationSkill({
    name: 'Carapace de Sable',
    polarity: 'buff',
    attributeType: 'defense',
    rate: 0.08,
    duration: Infinity,
    trigger: new DodgeTrigger(DANCER),
    targetingStrategy: new Launcher(),
    terminationEvent: `damage-taken-${DANCER}`,
    stacking: { id: 'carapace', maxStacks: 5 },
  });

const counter = () =>
  new ConditionalAttack(
    COUNTER,
    new SimpleAttack(
      COUNTER,
      [new DamageComposition(DamageType.PHYSICAL, 1)],
      new LastDodgedAttackerStrategy(DANCER),
    ),
    new AlwaysTrueAttackCondition(),
    new DodgeTrigger(DANCER),
  );

describe('ActionStage dodge reactions', () => {
  let attacker: FightingCard;
  let dancer: FightingCard;
  let stage: ActionStage;

  const setUp = (agility: number, skills: Skill[]) => {
    attacker = createFightingCard({
      accuracy: 50,
      attack: 100,
      health: 1000,
      criticalChance: 0,
      skills: { special: { kind: 'specialAttack', energy: 9999 } },
    });
    dancer = createFightingCard({
      id: DANCER,
      agility,
      defense: 0,
      health: 1000,
      criticalChance: 0,
      extraSkills: skills,
    });
    const player1 = new Player('p1', [attacker]);
    const player2 = new Player('p2', [dancer]);
    stage = new ActionStage(
      player1,
      player2,
      { onCardDeath: [] },
      new DeathSkillHandler(player1, player2),
      new EndEventProcessor(player1, player2),
    );
  };
  const attack = (): Step[] => stage.computeNextAction([attacker]);

  describe('when the attack is dodged', () => {
    let steps: Step[];

    beforeEach(() => {
      setUp(100, [carapace(), counter()]);
      steps = attack();
    });

    it('fires the dodge skills of the dodging card', () => {
      expect(dancer.buffStacks('carapace')).toBe(1);
    });

    it('counters the attacker it dodged', () => {
      expect(
        steps.some((s) => s.kind === StepKind.Attack && s.name === COUNTER),
      ).toBe(true);
    });

    it('remembers the dodged attacker', () => {
      expect(dancer.lastDodgedAttacker).toBe(attacker);
    });
  });

  it('piles the dodge buffs up to the cap', () => {
    setUp(100, [carapace()]);
    [...Array(6)].forEach(() => attack());

    expect(dancer.buffStacks('carapace')).toBe(5);
  });

  describe('when the card is hit afterwards', () => {
    let steps: Step[];

    beforeEach(() => {
      setUp(100, [carapace()]);
      attack();
      dancer.applyDebuff('agility', 1, 5);
      steps = attack();
    });

    it('ends the buffs bound to its damage-taken event', () => {
      expect(dancer.buffStacks('carapace')).toBe(0);
    });

    it('reports the removal', () => {
      expect(steps.map((s) => s.kind)).toContain(StepKind.BuffRemoved);
    });
  });

  it('does not fire the dodge skills on a landed hit', () => {
    setUp(0, [carapace()]);
    attack();

    expect(dancer.buffStacks('carapace')).toBe(0);
  });
});

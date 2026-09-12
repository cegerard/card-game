import { TransformationSkill } from '../transformation';
import { Alteration } from '../../@types/alteration/alteration';
import { HealthThresholdCondition } from '../../@types/skill-activation-conditions/health-threshold-condition';
import { Launcher } from '../../../targeting-card-strategies/launcher';
import { Player } from '../../../player';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../../@types/fighting-context';
import { SkillKind } from '../skill';

function makeContext(card: FightingCard): FightingContext {
  return {
    sourcePlayer: new Player('p1', [card]),
    opponentPlayer: new Player('p2', [createFightingCard({})]),
  };
}

function buildSkill(): TransformationSkill {
  return new TransformationSkill({
    name: 'Frénésie du Grand Blanc',
    activationCondition: new HealthThresholdCondition('below', 0.25),
    duration: 3,
    alterations: [new Alteration('attack', 0.35, 3, new Launcher())],
    lifestealRate: 0.1,
    statusImmunity: true,
  });
}

describe('TransformationSkill activation', () => {
  let card: FightingCard;
  let skill: TransformationSkill;

  beforeEach(() => {
    card = createFightingCard({ health: 1000 });
    skill = buildSkill();
  });

  it('stays dormant above the threshold', () => {
    card.addRealDamage(500);

    expect(skill.onHealthChanged(card)).toBe(false);
  });

  it('fires when the health crosses the threshold', () => {
    card.addRealDamage(800);

    expect(skill.onHealthChanged(card)).toBe(true);
  });

  it('never fires a second time in a fight', () => {
    card.addRealDamage(800);
    skill.onHealthChanged(card);
    skill.launch(card, makeContext(card));
    card.heal(1000);
    card.addRealDamage(900);

    expect(skill.onHealthChanged(card)).toBe(false);
  });

  it('is not triggered by regular events', () => {
    expect(skill.isTriggered('turn-end')).toBe(false);
  });
});

describe('TransformationSkill launch', () => {
  let card: FightingCard;
  let results;

  beforeEach(() => {
    card = createFightingCard({ attack: 100, health: 1000 });
    card.addRealDamage(500);
    results = buildSkill().launch(card, makeContext(card));
  });

  it('transforms the card', () => {
    expect(card.isTransformed).toBe(true);
  });

  it('grants the lifesteal', () => {
    expect(card.stealLife()).toBe(100);
  });

  it('grants the status immunity', () => {
    expect(card.isStatusImmune).toBe(true);
  });

  it('applies its alterations', () => {
    expect(card.actualAttack).toBe(135);
  });

  it('reports the transformation and its alterations', () => {
    expect(results).toMatchObject({
      skillKind: SkillKind.Transformation,
      name: 'Frénésie du Grand Blanc',
      remainingTurns: 3,
      results: [{ alteration: { type: 'attack', value: 35 } }],
    });
  });
});

describe('TransformationSkill without perks', () => {
  it('leaves the card free of lifesteal', () => {
    const card = createFightingCard({ health: 1000 });
    new TransformationSkill({
      name: 'Plain',
      activationCondition: new HealthThresholdCondition('below', 0.25),
      duration: 2,
    }).launch(card, null);

    expect(card.hasLifesteal).toBe(false);
  });
});

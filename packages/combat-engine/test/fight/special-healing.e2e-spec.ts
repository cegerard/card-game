import { card, dummy, useFight } from '../helpers/kit';

// The enemy hits every card for 300 at each action: by the healer second
// action, the special ready, its ally has 400 of its 1000 health points left.
const cocoon = (fields: object = {}) => ({
  kind: 'HEALING',
  name: 'Cocon',
  rate: 0.25,
  energy: 10,
  targetingStrategy: 'lowest-health-points-ally',
  healBasis: 'target-max-health',
  shieldApplication: {
    rate: 0.15,
    duration: 2,
    targetingStrategy: 'special-targets',
  },
  ...fields,
});

const SPECIAL_TARGETS_REFUSAL =
  'special-targets only names the targets of a HEALING special, for its shield';
const specialTargetsShield = {
  rate: 0.1,
  duration: 1,
  targetingStrategy: 'special-targets',
};
const specialTargetsBuff = {
  kind: 'ALTERATION',
  name: 'Ailes',
  event: 'turn-end',
  polarity: 'buff',
  buffType: 'attack',
  rate: 0.1,
  duration: 1,
  targetingStrategy: 'special-targets',
};
const skillsWith = (skill: object) => ({
  ...dummy('x').skills,
  others: [skill],
});

const healer = (special: object) =>
  dummy('healer', { skills: { ...dummy('healer').skills, special } });

const enemy = dummy('enemy', {
  attack: 300,
  skills: {
    ...dummy('enemy').skills,
    simpleAttack: {
      name: 'Onde',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'target-all',
    },
  },
});

describe('HEALING special', () => {
  const fight = useFight();
  const cast = (special: object) =>
    fight([healer(special), dummy('ally', { health: 1000 })], [enemy]);
  const healIndex = (steps: any[]) =>
    steps.findIndex((s) => s.kind === 'healing' && s.name === 'Cocon');

  it('heals a share of the target max health', async () => {
    const steps = await cast(cocoon());

    expect(steps[healIndex(steps)].heal[0].healed).toBe(250);
  });

  it('shields the healed ally right after the heal', async () => {
    const steps = await cast(cocoon());

    expect(steps[healIndex(steps) + 1]).toMatchObject({
      kind: 'shield_applied',
      targets: [{ target: card('ally'), points: 150 }],
    });
  });

  const refusal = async (special: object) =>
    (await fight.post([healer(special)], [enemy]).expect(400)).body.message;
  const attackWith = (fields: object) => ({
    ...dummy('x').skills.special,
    ...fields,
  });

  it('refuses a healBasis on an ATTACK special', async () => {
    const message = await refusal(
      attackWith({ healBasis: 'target-max-health' }),
    );

    expect(message).toBe('Only a HEALING special takes: healBasis');
  });

  it('refuses a shield without targeting', async () => {
    const shieldApplication = { rate: 0.1, duration: 1 };

    expect(await refusal(cocoon({ shieldApplication }))).toContainEqual(
      expect.stringContaining('shieldApplication.targetingStrategy'),
    );
  });

  it('refuses special-targets in the shield of an ATTACK special', async () => {
    const shieldApplication = specialTargetsShield;

    expect(await refusal(attackWith({ shieldApplication }))).toBe(
      SPECIAL_TARGETS_REFUSAL,
    );
  });

  it('refuses special-targets as the targeting of a skill', async () => {
    const steps = await fight
      .post([dummy('x', { skills: skillsWith(specialTargetsBuff) })], [enemy])
      .expect(400);

    expect(steps.body.message).toBe(SPECIAL_TARGETS_REFUSAL);
  });

  it('refuses a field a HEALING special would ignore', async () => {
    const effect = { type: 'POISON', rate: 0.1, level: 1 };

    expect(await refusal(cocoon({ effect }))).toBe(
      'HEALING special only heals and shields, it cannot carry: effect',
    );
  });

  it('refuses random enemies as the targets of a HEALING special', async () => {
    const special = cocoon({
      targetingStrategy: 'random-enemies',
      targetCount: 2,
    });

    expect(await refusal(special)).toBe(
      'A HEALING special heals allies: it cannot target random enemies',
    );
  });
});

describe('HEALING special heal over time', () => {
  const fight = useFight();
  const regenerating = cocoon({ healOverTime: { rate: 0.08, duration: 3 } });
  const cast = (special: object) =>
    fight([healer(special), dummy('ally', { health: 1000 })], [enemy]);
  // The special heal comes first, then the ticks of its heal over time
  const firstTickIndex = (steps: any[]) =>
    steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.kind === 'healing' && step.name === 'Cocon')[1]
      .index;

  it('heals a share of the healed ally max health at the start of its turn', async () => {
    const steps = await cast(regenerating);

    expect(steps[firstTickIndex(steps)].heal[0]).toMatchObject({
      target: card('ally'),
      healed: 80,
    });
  });

  it('ticks right before the healed ally acts', async () => {
    const steps = await cast(regenerating);

    expect(steps[firstTickIndex(steps) + 1].attacker).toEqual(card('ally'));
  });

  it('is refused on an ATTACK special', async () => {
    const special = {
      ...dummy('x').skills.special,
      healOverTime: { rate: 0.08, duration: 3 },
    };
    const response = await fight.post([healer(special)], [enemy]).expect(400);

    expect(response.body.message).toBe(
      'Only a HEALING special takes: healOverTime',
    );
  });
});

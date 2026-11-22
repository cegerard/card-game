import { dummy, useFight } from '../helpers/kit';

// Each action brings 10 energy: short of 15 at its first two actions, the
// caster attacks; at its third it pays the support.
const metamorphosis = (fields: object = {}) => ({
  kind: 'SUPPORT',
  name: 'Métamorphose Partagée',
  event: 'next-action',
  targetingStrategy: 'strongest-ally',
  alterations: [{ type: 'attack', rate: 0.3, duration: 3, polarity: 'buff' }],
  energyCost: 15,
  ...fields,
});

const caster = (skill: object) =>
  dummy('caster', { skills: { ...dummy('caster').skills, others: [skill] } });

const actionsOfCaster = (steps: any[]) =>
  steps
    .filter(
      (s) =>
        (s.kind === 'attack' && s.attacker.id === 'caster') ||
        (s.kind === 'buff' && s.source.id === 'caster'),
    )
    .map((s) => s.kind);

describe('SUPPORT energy cost', () => {
  const fight = useFight();

  it('attacks while short of its energy cost, then supports', async () => {
    const steps = await fight(
      [caster(metamorphosis()), dummy('ally')],
      [dummy('enemy')],
    );

    expect(actionsOfCaster(steps).slice(0, 3)).toEqual([
      'attack',
      'attack',
      'buff',
    ]);
  });

  it('is refused on a skill kind that spends no energy', async () => {
    const healing = {
      kind: 'HEALING',
      name: 'Soin',
      event: 'turn-end',
      targetingStrategy: 'self',
      rate: 0.1,
      energyCost: 5,
    };

    await fight.post([caster(healing)], [dummy('enemy')]).expect(400);
  });
});

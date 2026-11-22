import { dummy, useFight } from '../helpers/kit';

// Both strikers have 100 accuracy. The enemy starts at 90 agility, so the
// marker lands its first hit and reveals the weak point; each hit taken then
// raises the enemy agility by 20% (108), a dodge unless a 15% accuracy bonus
// (115) carries the strike.
const marker = (weakPoint: Record<string, unknown>) =>
  dummy('marker', {
    attack: 10,
    accuracy: 100,
    skills: {
      ...dummy('marker').skills,
      simpleAttack: {
        name: 'Étincelle',
        damages: [{ type: 'PHYSICAL', rate: 1 }],
        targetingStrategy: 'position-based',
        effects: [
          {
            type: 'WEAK_POINT',
            rate: 0,
            weakPoint: { name: 'Cible Prioritaire', duration: 2, ...weakPoint },
          },
        ],
      },
    },
  });

const enemy = dummy('enemy', {
  agility: 90,
  skills: {
    ...dummy('enemy').skills,
    others: [
      {
        kind: 'ALTERATION',
        name: 'Envol',
        event: 'damage-taken',
        targetCardId: 'enemy',
        polarity: 'buff',
        buffType: 'agility',
        rate: 0.2,
        duration: 5,
        targetingStrategy: 'self',
      },
    ],
  },
});

/** Whether the first attack of `id` after the weak point was revealed was dodged. */
const dodgesAfterReveal = (steps: any[], id: string): boolean => {
  const revealed = steps.findIndex((s) => s.kind === 'weak_point_revealed');
  if (revealed < 0) throw new Error('The weak point was never revealed');

  return steps
    .slice(revealed)
    .find((s) => s.kind === 'attack' && s.attacker.id === id).damages[0].dodge;
};

describe('Weak point accuracy bonus', () => {
  const fight = useFight();
  const fightWith = (weakPoint: Record<string, unknown>) =>
    fight([marker(weakPoint), dummy('ally', { accuracy: 100 })], [enemy]);

  it('lets every attacker of the bearer land with its accuracy bonus', async () => {
    const steps = await fightWith({ accuracyRate: 0.15 });

    expect(dodgesAfterReveal(steps, 'ally')).toBe(false);
  });

  it('lets the revealer land with its own bonus', async () => {
    const steps = await fightWith({ revealerAccuracyRate: 0.15 });

    expect(dodgesAfterReveal(steps, 'marker')).toBe(false);
  });

  it('keeps the revealer bonus from the other attackers', async () => {
    const steps = await fightWith({ revealerAccuracyRate: 0.15 });

    expect(dodgesAfterReveal(steps, 'ally')).toBe(true);
  });
});

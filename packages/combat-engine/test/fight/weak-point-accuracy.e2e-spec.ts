import { dummy, useFight } from '../helpers/kit';

// The marker reveals the weak point at each hit; the ally strikes with 100
// accuracy into 110 agility, a dodge unless the weak point lends it 15%.
const marker = (weakPoint: Record<string, unknown>) =>
  dummy('marker', {
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

const allyDodgesAfterReveal = (steps: any[]) => {
  const revealed = steps.findIndex((s) => s.kind === 'weak_point_revealed');
  return steps
    .slice(revealed)
    .find((s) => s.kind === 'attack' && s.attacker.id === 'ally').damages[0]
    .dodge;
};

describe('Weak point accuracy bonus', () => {
  const fight = useFight();
  const fightWith = (weakPoint: Record<string, unknown>) =>
    fight(
      [marker(weakPoint), dummy('ally', { accuracy: 100 })],
      [dummy('enemy', { agility: 110 })],
    );

  it('lets every attacker of the bearer land with its accuracy bonus', async () => {
    const steps = await fightWith({ accuracyRate: 0.15 });

    expect(allyDodgesAfterReveal(steps)).toBe(false);
  });

  it('gives the revealer bonus to the revealer alone', async () => {
    const steps = await fightWith({ revealerAccuracyRate: 0.15 });

    expect(allyDodgesAfterReveal(steps)).toBe(true);
  });
});

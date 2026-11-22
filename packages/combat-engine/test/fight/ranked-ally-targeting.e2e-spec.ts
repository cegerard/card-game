import { dummy, named, useFight } from '../helpers/kit';

// A buff at the turn end of the caster names its target, whatever its health
const marker = (targetingStrategy: string) => ({
  kind: 'ALTERATION',
  name: 'Marker',
  event: 'turn-end',
  polarity: 'buff',
  buffType: 'defense',
  rate: 0.1,
  duration: 1,
  targetingStrategy,
});

const caster = (targetingStrategy: string) =>
  dummy('caster', {
    attack: 9000,
    health: 10,
    skills: { ...dummy('caster').skills, others: [marker(targetingStrategy)] },
  });

const targetOf = (steps: any[]) =>
  named(steps, 'buff', 'Marker')[0].alterations[0].target.id;

describe('Ranked ally targeting', () => {
  const fight = useFight();

  const targetAmong = async (strategy: string, allies: any[]) =>
    targetOf(await fight([caster(strategy), ...allies], [dummy('enemy')]));

  it('strongest-ally buffs the ally with the highest attack', async () => {
    const target = await targetAmong('strongest-ally', [
      dummy('weak', { attack: 10 }),
      dummy('strong', { attack: 50 }),
    ]);

    expect(target).toBe('strong');
  });

  it('lowest-health-points-ally buffs the ally with the fewest health points', async () => {
    const target = await targetAmong('lowest-health-points-ally', [
      dummy('big', { health: 2000 }),
      dummy('small', { health: 500 }),
    ]);

    expect(target).toBe('small');
  });
});

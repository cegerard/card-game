import { card, dummy, named, useFight } from '../helpers/kit';

const selfBuff = (name: string, event: string) => ({
  kind: 'ALTERATION',
  name,
  event,
  polarity: 'buff',
  buffType: 'attack',
  rate: 0.1,
  duration: 1,
  targetingStrategy: 'self',
});

const withSkill = (id: string, skill: object) =>
  dummy(id, { skills: { ...dummy(id).skills, others: [skill] } });

const caster = withSkill('caster', selfBuff('Aube', 'turn-start'));
const listener = withSkill('listener', selfBuff('Écho', 'ally-skill-used'));

describe('Turn-start skills that strike nobody', () => {
  const fight = useFight();
  const steps = () => fight([caster, listener], [dummy('enemy')]);

  it('reports what they did', async () => {
    expect(named(await steps(), 'buff', 'Aube')[0]).toMatchObject({
      source: card('caster'),
    });
  });

  it('reports it right before the action of that turn', async () => {
    const all = await steps();
    const attackAt = all.findIndex((s) => s.attacker?.id === 'caster');

    expect(all[attackAt - 1]).toMatchObject({ kind: 'buff', name: 'Aube' });
  });

  it('do not make the allies hear a skill used', async () => {
    expect(named(await steps(), 'buff', 'Écho')).toEqual([]);
  });
});

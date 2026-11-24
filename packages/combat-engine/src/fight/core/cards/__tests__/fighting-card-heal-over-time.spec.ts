import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';

describe('FightingCard heals over time', () => {
  let caster: FightingCard;
  let bearer: FightingCard;

  const lay = (duration = 3, name = 'Cocon', rate = 0.08) =>
    bearer.receiveHealOverTime({ name, source: caster, rate, duration });
  const tick = () => bearer.tickHealsOverTime();

  beforeEach(() => {
    caster = createFightingCard({});
    bearer = createFightingCard({ health: 1000, resistance: 0 });
    bearer.addRealDamage(500);
  });

  it('heals a share of the bearer max health at each tick', () => {
    lay();

    expect(tick()).toEqual([{ name: 'Cocon', source: caster, healed: 80 }]);
  });

  it('runs out after its duration', () => {
    lay(2);
    tick();
    tick();

    expect(tick()).toEqual([]);
  });

  it('is refreshed when laid again under the same name', () => {
    lay(1);
    lay(2);
    tick();

    expect(tick()).toHaveLength(1);
  });

  it('runs heals of different names side by side', () => {
    lay(3, 'Cocon');
    lay(3, 'Flamme de Vie');

    expect(tick()).toHaveLength(2);
  });

  it('is refused to a card cut off its allies support', () => {
    bearer.blockSupport(2);

    expect(lay()).toBe(false);
  });

  it('heals nothing while its bearer is cut off its allies support', () => {
    lay();
    bearer.blockSupport(2);

    expect(tick()).toEqual([]);
  });

  it('reports nothing on a card at full health', () => {
    lay();
    bearer.heal(500);

    expect(tick()).toEqual([]);
  });

  it('heals nothing on a dead card', () => {
    lay();
    bearer.addRealDamage(1000);

    expect(tick()).toEqual([]);
  });

  it('is cleared by a revival', () => {
    lay();
    bearer.addRealDamage(1000);
    bearer.revive(0.2);

    expect(tick()).toEqual([]);
  });

  it('rejects a rate that is not above 0', () => {
    expect(() => lay(3, 'Cocon', 0)).toThrow(
      'A heal over time needs a rate above 0 and a duration of 1 turn at least',
    );
  });

  it('rejects a duration under 1 turn', () => {
    expect(() => lay(0)).toThrow(
      'A heal over time needs a rate above 0 and a duration of 1 turn at least',
    );
  });
});

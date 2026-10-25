import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { ConcealmentSkill } from '../concealment';
import { ConcealmentSkillResults } from '../skill';
import { NextAction } from '../../../trigger/next-action';
import { EveryNTurnsCondition } from '../../@types/attack/conditions/every-n-turns-condition';

const UNDERGROUND = { name: 'Sous terre', duration: 1 };

const dive = (interval = 1) =>
  new ConcealmentSkill('Plongée Tectonique', new NextAction(), {
    stanceActivation: UNDERGROUND,
    condition: new EveryNTurnsCondition(interval),
    requiresUndamaged: true,
  });

describe('ConcealmentSkill opening a stance on a cooldown', () => {
  let owner: FightingCard;

  beforeEach(() => {
    owner = createFightingCard({});
  });

  it('opens its stance on its owner', () => {
    dive().launch(owner, null);

    expect(owner.hasStance('Sous terre')).toBe(true);
  });

  it('reports the stance it opened', () => {
    const result = dive().launch(owner, null) as ConcealmentSkillResults;

    expect(result.stanceStarted).toEqual(
      expect.objectContaining({ name: 'Sous terre', remainingTurns: 1 }),
    );
  });

  it('waits for its interval before firing', () => {
    const skill = dive(2);
    skill.tick();

    expect(skill.isTriggered('next-action')).toBe(false);
  });

  it('fires once its interval elapsed', () => {
    const skill = dive(2);
    skill.tick();
    skill.tick();

    expect(skill.isTriggered('next-action')).toBe(true);
  });

  it('restarts its cooldown once launched', () => {
    const skill = dive(2);
    skill.tick();
    skill.tick();
    skill.launch(owner, null);

    expect(skill.isTriggered('next-action')).toBe(false);
  });

  it('declares whether it requires its owner undamaged', () => {
    expect(dive().requiresUndamaged).toBe(true);
  });
});

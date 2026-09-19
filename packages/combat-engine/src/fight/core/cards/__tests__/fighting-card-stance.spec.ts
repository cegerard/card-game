import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../fighting-card';
import { Player } from '../../player';
import { Skill, SkillKind } from '../skills/skill';

const FORTRESS = 'forteresse-des-ages';

describe('FightingCard — stances', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({});
  });

  describe('opening a stance', () => {
    it('holds no stance to begin with', () => {
      expect(card.hasStance(FORTRESS)).toBe(false);
    });

    it('holds the stance once activated', () => {
      card.activateStance(FORTRESS, 3);

      expect(card.hasStance(FORTRESS)).toBe(true);
    });

    it('reports the duration it was opened with', () => {
      expect(card.activateStance(FORTRESS, 3).remainingTurns).toBe(3);
    });

    it('ignores a stance it does not hold', () => {
      card.activateStance(FORTRESS, 3);

      expect(card.hasStance('another-stance')).toBe(false);
    });
  });

  describe('re-activating a running stance', () => {
    it('refreshes the duration instead of stacking', () => {
      card.activateStance(FORTRESS, 3);
      card.decreaseStanceDurations();

      expect(card.activateStance(FORTRESS, 3).remainingTurns).toBe(3);
    });

    it('keeps a single stance of that name', () => {
      card.activateStance(FORTRESS, 3);
      card.activateStance(FORTRESS, 3);
      card.decreaseStanceDurations();
      card.decreaseStanceDurations();
      card.decreaseStanceDurations();
      card.decreaseStanceDurations();

      expect(card.hasStance(FORTRESS)).toBe(false);
    });
  });

  describe('running out', () => {
    beforeEach(() => {
      card.activateStance(FORTRESS, 2);
    });

    it('still holds it while turns remain', () => {
      card.decreaseStanceDurations();
      card.decreaseStanceDurations();

      expect(card.hasStance(FORTRESS)).toBe(true);
    });

    it('drops it on the turn after the last one', () => {
      card.decreaseStanceDurations();
      card.decreaseStanceDurations();
      card.decreaseStanceDurations();

      expect(card.hasStance(FORTRESS)).toBe(false);
    });

    it('names the stance that ended', () => {
      card.decreaseStanceDurations();
      card.decreaseStanceDurations();

      expect(card.decreaseStanceDurations()).toEqual([FORTRESS]);
    });

    it('reports nothing while none ended', () => {
      expect(card.decreaseStanceDurations()).toEqual([]);
    });
  });

  describe('several stances at once', () => {
    it('tracks their durations independently', () => {
      card.activateStance(FORTRESS, 1);
      card.activateStance('other', 3);
      card.decreaseStanceDurations();

      expect(card.decreaseStanceDurations()).toEqual([FORTRESS]);
    });
  });
});

describe('FightingCard — a skill bound to a stance', () => {
  const TRIGGER = 'turn-end';

  function stanceBoundSkill(requiredStance?: string): Skill {
    return {
      id: 'probe',
      name: 'Probe',
      requiredStance,
      isTriggered: (trigger: string) => trigger === TRIGGER,
      launch: () => ({
        skillKind: SkillKind.Buff,
        results: [],
        name: 'Probe',
      }),
    };
  }

  function launch(card: FightingCard) {
    return card.launchSkills(TRIGGER, {
      sourcePlayer: new Player('p', [card]),
      opponentPlayer: new Player('o', []),
    });
  }

  function cardWith(skill: Skill): FightingCard {
    const host = createFightingCard({});
    (host as any).skills = [skill];
    return host;
  }

  it('stays silent while the stance is not held', () => {
    const card = cardWith(stanceBoundSkill(FORTRESS));

    expect(launch(card)).toHaveLength(0);
  });

  it('fires while the stance is held', () => {
    const card = cardWith(stanceBoundSkill(FORTRESS));
    card.activateStance(FORTRESS, 3);

    expect(launch(card)).toHaveLength(1);
  });

  it('goes silent again once the stance runs out', () => {
    const card = cardWith(stanceBoundSkill(FORTRESS));
    card.activateStance(FORTRESS, 1);
    card.decreaseStanceDurations();
    card.decreaseStanceDurations();

    expect(launch(card)).toHaveLength(0);
  });

  it('is unaffected when it requires no stance', () => {
    const card = cardWith(stanceBoundSkill(undefined));

    expect(launch(card)).toHaveLength(1);
  });

  it('is not unlocked by another stance', () => {
    const card = cardWith(stanceBoundSkill(FORTRESS));
    card.activateStance('another-stance', 3);

    expect(launch(card)).toHaveLength(0);
  });
});

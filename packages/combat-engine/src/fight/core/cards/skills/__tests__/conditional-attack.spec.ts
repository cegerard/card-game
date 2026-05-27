import { EveryNTurnsCondition } from '../../@types/attack/conditions/every-n-turns-condition';
import { ConditionalAttack } from '../conditional-attack';
import { SimpleAttack } from '../simple-attack';
import { SkillKind } from '../skill';
import { TargetedFromPosition } from '../../../targeting-card-strategies/targeted-from-position';
import { Player } from '../../../player';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { ActionStage } from '../../../card-action/action-stage';
import { Fight } from '../../../fight-simulator/fight';
import { PlayerByPlayerCardSelector } from '../../../fight-simulator/card-selectors/player-by-player';
import { CardStateFrozen } from '../../@types/state/card-state-frozen';
import { FightingCard } from '../../fighting-card';
import { SpecialAttack } from '../special-attack';
import { SimpleDodge } from '../../behaviors/simple-dodge';
import { DeathSkillHandler } from '../../../fight-simulator/death-skill-handler';
import { Element } from '../../@types/damage/element';
import { faker } from '@faker-js/faker';
import { NextAction } from '../../../trigger/next-action';
import { DeathTrigger } from '../../../trigger/death-trigger';
import { TargetedCard } from '../../../targeting-card-strategies/targeted-card';
import { TargetedAll } from '../../../targeting-card-strategies/targeted-all';

const POSITION_BASED = new TargetedFromPosition();

function makeSimpleAttack(rate = 1.0): SimpleAttack {
  return new SimpleAttack(
    'attack',
    [new DamageComposition(DamageType.PHYSICAL, rate)],
    POSITION_BASED,
  );
}

function makeCard(opts: {
  name?: string;
  attack?: number;
  defense?: number;
  health?: number;
  speed?: number;
  agility?: number;
  accuracy?: number;
  conditionalAttack?: ConditionalAttack;
}): FightingCard {
  return new FightingCard(
    faker.string.uuid(),
    opts.name ?? 'Card',
    {
      attack: opts.attack ?? 100,
      defense: opts.defense ?? 0,
      health: opts.health ?? 1000,
      speed: opts.speed ?? 100,
      agility: opts.agility ?? 0,
      accuracy: opts.accuracy ?? 9999,
      criticalChance: 0,
    },
    {
      simpleAttack: makeSimpleAttack(1.0),
      special: new SpecialAttack(
        'special',
        [new DamageComposition(DamageType.PHYSICAL, 1)],
        999,
        POSITION_BASED,
      ),
      others: opts.conditionalAttack ? [opts.conditionalAttack] : [],
    },
    { dodge: new SimpleDodge() },
    Element.PHYSICAL,
  );
}

describe('EveryNTurnsCondition', () => {
  let condition: EveryNTurnsCondition;

  beforeEach(() => {
    condition = new EveryNTurnsCondition(3);
  });

  it('is not triggered before N ticks', () => {
    condition.tick();
    condition.tick();
    expect(condition.isTriggered()).toBe(false);
  });

  it('is triggered after N ticks', () => {
    condition.tick();
    condition.tick();
    condition.tick();
    expect(condition.isTriggered()).toBe(true);
  });

  it('is not triggered after reset', () => {
    condition.tick();
    condition.tick();
    condition.tick();
    condition.reset();
    expect(condition.isTriggered()).toBe(false);
  });
});

describe('ConditionalAttack', () => {
  let condition: EveryNTurnsCondition;
  let conditionalAttack: ConditionalAttack;

  beforeEach(() => {
    condition = new EveryNTurnsCondition(2);
    conditionalAttack = new ConditionalAttack(
      'attack',
      makeSimpleAttack(),
      condition,
      new NextAction(),
    );
  });

  describe('isTriggered', () => {
    it('returns false for non next-action trigger even if condition is met', () => {
      condition.tick();
      condition.tick();
      expect(conditionalAttack.isTriggered('turn-end')).toBe(false);
    });

    it('returns false for next-action when condition is not triggered', () => {
      condition.tick();
      expect(conditionalAttack.isTriggered('next-action')).toBe(false);
    });

    it('returns true for next-action when condition is triggered', () => {
      condition.tick();
      condition.tick();
      expect(conditionalAttack.isTriggered('next-action')).toBe(true);
    });

    it('returns true for ally-death trigger when condition is already met', () => {
      const allyDeathAttack = new ConditionalAttack(
        'attack',
        makeSimpleAttack(),
        new EveryNTurnsCondition(0),
        new DeathTrigger('ally-death', 'kaelion'),
      );
      expect(allyDeathAttack.isTriggered('ally-death:kaelion')).toBe(true);
    });

    it('returns false for ally-death trigger when card id does not match', () => {
      const allyDeathAttack = new ConditionalAttack(
        'attack',
        makeSimpleAttack(),
        new EveryNTurnsCondition(0),
        new DeathTrigger('ally-death', 'kaelion'),
      );
      expect(allyDeathAttack.isTriggered('ally-death:other')).toBe(false);
    });
  });

  describe('launch', () => {
    let source: FightingCard;
    let context: { sourcePlayer: Player; opponentPlayer: Player };

    beforeEach(() => {
      source = makeCard({ attack: 100 });
      const target = makeCard({ health: 1000, defense: 0, agility: 0 });
      context = {
        sourcePlayer: new Player('p1', [source]),
        opponentPlayer: new Player('p2', [target]),
      };
      condition.tick();
      condition.tick();
    });

    it('returns SkillKind.Attack', () => {
      expect(conditionalAttack.launch(source, context).skillKind).toBe(
        SkillKind.Attack,
      );
    });

    it('resets condition after launch so next tick starts fresh', () => {
      conditionalAttack.launch(source, context);
      expect(conditionalAttack.isTriggered('next-action')).toBe(false);
    });
  });

  describe('tick', () => {
    it('advances condition counter so it eventually triggers', () => {
      conditionalAttack.tick();
      conditionalAttack.tick();
      expect(conditionalAttack.isTriggered('next-action')).toBe(true);
    });
  });
});

describe('FightingCard.tickSkills', () => {
  it('ticks ConditionalAttack skills, advancing their condition', () => {
    const condition = new EveryNTurnsCondition(1);
    const ca = new ConditionalAttack(
      'attack',
      makeSimpleAttack(),
      condition,
      new NextAction(),
    );
    const card = makeCard({ conditionalAttack: ca });

    card.tickSkills();

    expect(condition.isTriggered()).toBe(true);
  });

  it('does not error when no skill has tick()', () => {
    const card = makeCard({});
    expect(() => card.tickSkills()).not.toThrow();
  });
});

describe('ConditionalAttack integration via Fight (interval=3)', () => {
  const ATTACK = 100;
  const CONDITIONAL_RATE = 5.0;
  const DEFENDER_HEALTH = 350;

  let attacker: FightingCard;
  let defender: FightingCard;
  let fight: Fight;

  beforeEach(() => {
    const ca = new ConditionalAttack(
      'conditional-attack',
      new SimpleAttack(
        'attack',
        [new DamageComposition(DamageType.PHYSICAL, CONDITIONAL_RATE)],
        POSITION_BASED,
      ),
      new EveryNTurnsCondition(3),
      new NextAction(),
    );

    attacker = new FightingCard(
      faker.string.uuid(),
      'Attacker',
      {
        attack: ATTACK,
        defense: 0,
        health: 10000,
        speed: 100,
        agility: 0,
        accuracy: 9999,
        criticalChance: 0,
      },
      {
        simpleAttack: makeSimpleAttack(1.0),
        special: new SpecialAttack(
          'special',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          999,
          POSITION_BASED,
        ),
        others: [ca],
      },
      { dodge: new SimpleDodge() },
      Element.PHYSICAL,
    );

    defender = new FightingCard(
      faker.string.uuid(),
      'Defender',
      {
        attack: 0,
        defense: 0,
        health: DEFENDER_HEALTH,
        speed: 1,
        agility: 0,
        accuracy: 0,
        criticalChance: 0,
      },
      {
        simpleAttack: makeSimpleAttack(1.0),
        special: new SpecialAttack(
          'special',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          999,
          POSITION_BASED,
        ),
        others: [],
      },
      { dodge: new SimpleDodge() },
      Element.PHYSICAL,
    );

    const player1 = new Player('player1', [attacker]);
    const player2 = new Player('player2', [defender]);
    fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );
  });

  it('fires simple attack on attacker turn 1 (step 1)', () => {
    const result = fight.start();
    expect(result[1]).toMatchObject({
      kind: 'attack',
      damages: [{ damage: 100 }],
    });
  });

  it('fires simple attack on attacker turn 2 (step 3)', () => {
    const result = fight.start();
    expect(result[3]).toMatchObject({
      kind: 'attack',
      damages: [{ damage: 100 }],
    });
  });

  it('fires conditional attack on attacker turn 3 (step 5) with 5x damage', () => {
    const result = fight.start();
    expect(result[5]).toMatchObject({
      kind: 'attack',
      damages: [{ damage: 500 }],
    });
  });

  it('marks defender dead after conditional attack', () => {
    const result = fight.start();
    expect(result[6]).toEqual({
      kind: 'status_change',
      card: defender.identityInfo,
      status: 'dead',
    });
  });
});

describe('ConditionalAttack respects targeting override', () => {
  it('uses override strategy when attack is position-based', () => {
    const attacker = makeCard({ attack: 100 });
    const target1 = makeCard({ health: 1000, defense: 0, agility: 0 });
    const target2 = makeCard({ health: 1000, defense: 0, agility: 0 });
    const player1 = new Player('p1', [attacker]);
    const player2 = new Player('p2', [target1, target2]);
    const context = { sourcePlayer: player1, opponentPlayer: player2 };

    const override = new TargetedCard(target2.id);
    const condition = new EveryNTurnsCondition(0);
    const ca = new ConditionalAttack(
      'attack',
      makeSimpleAttack(),
      condition,
      new NextAction(),
    );
    condition.tick();
    const result = ca.launch(attacker, context, override);

    expect((result.results as { defender: FightingCard }[])[0].defender).toBe(
      target2,
    );
  });

  it('ignores override when attack uses non-position-based targeting', () => {
    const attacker = makeCard({ attack: 100 });
    const target1 = makeCard({ health: 1000, defense: 0, agility: 0 });
    const target2 = makeCard({ health: 1000, defense: 0, agility: 0 });
    const player1 = new Player('p1', [attacker]);
    const player2 = new Player('p2', [target1, target2]);
    const context = { sourcePlayer: player1, opponentPlayer: player2 };

    const override = new TargetedCard(target2.id);
    const targetAllAttack = new SimpleAttack(
      'attack',
      [new DamageComposition(DamageType.PHYSICAL, 1.0)],
      new TargetedAll(),
    );
    const condition = new EveryNTurnsCondition(0);
    const ca = new ConditionalAttack(
      'attack',
      targetAllAttack,
      condition,
      new NextAction(),
    );
    condition.tick();
    const result = ca.launch(attacker, context, override);

    expect((result.results as { defender: FightingCard }[]).length).toBe(2);
  });
});

describe('SpecialAttack respects targeting override', () => {
  it('uses override strategy when special uses position-based targeting', () => {
    const attacker = makeCard({ attack: 100 });
    const target1 = makeCard({ health: 1000, defense: 0, agility: 0 });
    const target2 = makeCard({ health: 1000, defense: 0, agility: 0 });
    const player1 = new Player('p1', [attacker]);
    const player2 = new Player('p2', [target1, target2]);
    const context = { sourcePlayer: player1, opponentPlayer: player2 };

    const override = new TargetedCard(target2.id);
    const special = new SpecialAttack(
      'special',
      [new DamageComposition(DamageType.PHYSICAL, 1)],
      0,
      POSITION_BASED,
    );
    const result = special.launch(attacker, context, override);

    expect(
      (result.actionResults[0] as { defender: FightingCard }).defender,
    ).toBe(target2);
  });

  it('ignores override when special uses non-position-based targeting', () => {
    const attacker = makeCard({ attack: 100 });
    const target1 = makeCard({ health: 1000, defense: 0, agility: 0 });
    const target2 = makeCard({ health: 1000, defense: 0, agility: 0 });
    const player1 = new Player('p1', [attacker]);
    const player2 = new Player('p2', [target1, target2]);
    const context = { sourcePlayer: player1, opponentPlayer: player2 };

    const override = new TargetedCard(target2.id);
    const special = new SpecialAttack(
      'special',
      [new DamageComposition(DamageType.PHYSICAL, 1)],
      0,
      new TargetedAll(),
    );
    const result = special.launch(attacker, context, override);

    expect(result.actionResults.length).toBe(2);
  });
});

describe('Frozen card skips tick', () => {
  // simpleAttack rate=1.0 → damage=10; conditionalAttack rate=3.0 → damage=30
  // interval=2: if freeze skips tick (correct), first unfrozen call does simple (damage=10)
  //             if freeze ticks (bug), first unfrozen call fires conditional (damage=30)
  const ATTACK = 10;
  let attacker: FightingCard;
  let actionStage: ActionStage;

  beforeEach(() => {
    const ca = new ConditionalAttack(
      'conditional-attack',
      new SimpleAttack(
        'attack',
        [new DamageComposition(DamageType.PHYSICAL, 3.0)],
        POSITION_BASED,
      ),
      new EveryNTurnsCondition(2),
      new NextAction(),
    );
    attacker = makeCard({
      name: 'Attacker',
      attack: ATTACK,
      conditionalAttack: ca,
    });
    const defender = makeCard({
      name: 'Defender',
      health: 1000,
      defense: 0,
      agility: 0,
      speed: 1,
    });

    const player1 = new Player('p1', [attacker]);
    const player2 = new Player('p2', [defender]);
    actionStage = new ActionStage(
      player1,
      player2,
      { onCardDeath: [] },
      new DeathSkillHandler(player1, player2),
    );

    attacker.setState(new CardStateFrozen(1, 5, 0));
  });

  it('returns no steps when card is frozen', () => {
    const steps = actionStage.computeNextAction([attacker]);
    expect(steps).toHaveLength(0);
  });

  it('fires simple attack (not conditional) on first unfrozen turn, proving freeze skipped the tick', () => {
    actionStage.computeNextAction([attacker]); // frozen: no tick, no action
    attacker.unFreeze();

    const steps = actionStage.computeNextAction([attacker]); // tick(1) < 2 → simple attack

    expect(steps[0]).toMatchObject({
      kind: 'attack',
      damages: [{ damage: ATTACK }],
    });
  });
});

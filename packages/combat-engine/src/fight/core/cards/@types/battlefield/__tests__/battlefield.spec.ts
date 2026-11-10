import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { Player } from '../../../../player';
import { Battlefield, BattlefieldConfig } from '../battlefield';
import { DamageType } from '../../damage/damage-type';
import { Element } from '../../damage/element';

const STORM: BattlefieldConfig = {
  name: 'Tempête',
  duration: 3,
  allies: {
    alterations: [{ type: 'attack', rate: 0.35, polarity: 'buff' }],
    healRate: 0.1,
  },
  enemies: {
    alterations: [{ type: 'accuracy', rate: 0.2, polarity: 'debuff' }],
    damage: { rate: 0.5, damageType: DamageType.AIR },
  },
  revival: { rate: 0.3, withinTurns: 2 },
  legacy: { duration: 2, empowerment: { name: 'Rage', rate: 0.5 } },
};

describe('Battlefield', () => {
  let caster: FightingCard;
  let ally: FightingCard;
  let enemy: FightingCard;
  let players: Player[];

  const card = (overrides = {}) =>
    createFightingCard({
      health: 1000,
      attack: 100,
      resistance: 0,
      ...overrides,
    });
  const deploy = (config: BattlefieldConfig = STORM) =>
    new Battlefield(config).deploy(caster, {
      sourcePlayer: players[0],
      opponentPlayer: players[1],
    });
  const turnEnd = (target: FightingCard) => {
    target.decreaseBattlefieldDurations();
    return target.tickBattlefields();
  };

  beforeEach(() => {
    caster = card();
    ally = card();
    enemy = card({ element: Element.EARTH, accuracy: 100 });
    players = [new Player('p1', [caster, ally]), new Player('p2', [enemy])];
  });

  it('alters every card of both sides, the caster included', () => {
    expect(deploy().alterations).toHaveLength(3);
  });

  it('weakens the enemies', () => {
    deploy();

    expect(enemy.actualAccuracy).toBe(80);
  });

  it('heals an ally a share of its max health at its turn end', () => {
    ally.addRealDamage(500);
    deploy();

    expect(turnEnd(ally)[0].healed).toBe(100);
  });

  it('strikes an enemy with the caster attack, through the elemental matrix', () => {
    deploy();

    expect(turnEnd(enemy)[0].damage).toBe(75);
  });

  it('ends on each card once its duration ran out', () => {
    deploy();
    [1, 2, 3].forEach(() => enemy.decreaseBattlefieldDurations());

    expect(enemy.decreaseBattlefieldDurations()).toEqual(['Tempête']);
  });

  it('brings back an ally fallen within the last turns', () => {
    ally.addRealDamage(ally.maxHealth);
    ally.countTurnDead();

    expect(deploy().revived).toEqual([{ card: ally, remainingHealth: 300 }]);
  });

  it('leaves an ally fallen for longer in the grave', () => {
    ally.addRealDamage(ally.maxHealth);
    [1, 2].forEach(() => ally.countTurnDead());

    expect(deploy().revived).toEqual([]);
  });

  it('rejects a duration below one turn', () => {
    expect(() => new Battlefield({ ...STORM, duration: 0 })).toThrow(
      'Battlefield duration must be an integer >= 1',
    );
  });

  describe('when its caster falls under it', () => {
    let deployment;

    beforeEach(() => {
      deploy();
      deployment = enemy.battlefieldDeployments[0];
      caster.addRealDamage(caster.maxHealth);
    });

    it('lasts longer on every card still under it', () => {
      deployment.fallOfSource(players);
      [1, 2, 3, 4, 5].forEach(() => enemy.decreaseBattlefieldDurations());

      expect(enemy.decreaseBattlefieldDurations()).toEqual(['Tempête']);
    });

    it('prolongs the alterations it laid', () => {
      deployment.fallOfSource(players);
      [1, 2, 3, 4].forEach(() => ally.decreaseBuffAndDebuffDuration());

      expect(ally.actualAttack).toBe(135);
    });

    it('empowers the living allies of the caster', () => {
      expect(deployment.fallOfSource(players).empowerment.cards).toEqual([
        ally,
      ]);
    });

    it('leaves its legacy once', () => {
      deployment.fallOfSource(players);

      expect(deployment.fallOfSource(players)).toBeUndefined();
    });
  });

  describe('damage sharing', () => {
    let partners: FightingCard[];

    const circle = (members: FightingCard[]) => {
      players = [new Player('p1', members), new Player('p2', [enemy])];
      deploy({
        name: 'Cercle',
        duration: 2,
        allies: { damageSharing: { rate: 0.2, maxShareRate: 0.05 } },
      });
    };

    beforeEach(() => {
      partners = [card(), card()];
      circle([caster, ...partners]);
    });

    it('spares the struck member the shared rate', () => {
      expect(caster.applyFinalDamage(200).damageToHealth).toBe(160);
    });

    it('hands each partner its capped share', () => {
      expect(
        caster.applyFinalDamage(200).damageShared.shares.map((s) => s.damage),
      ).toEqual([10, 10]);
    });

    it('never kills a partner', () => {
      partners[0].addRealDamage(partners[0].maxHealth - 1);
      caster.applyFinalDamage(200);

      expect(partners[0].actualHealth).toBe(1);
    });

    it('keeps the whole hit without a living partner', () => {
      partners.forEach((p) => p.addRealDamage(p.maxHealth));

      expect(caster.applyFinalDamage(200).damageToHealth).toBe(200);
    });
  });
});

import { MostWoundedAllyStrategy } from '../most-wounded-ally';
import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';

const THRESHOLD = 0.2;

describe('MostWoundedAllyStrategy', () => {
  let opponentPlayer: Player;
  let caster: FightingCard;
  let strategy: MostWoundedAllyStrategy;

  function ally(id: string, damageTaken: number): FightingCard {
    const card = createFightingCard({ id, health: 100 });
    card.addRealDamage(damageTaken);
    return card;
  }

  function target(...allies: FightingCard[]): FightingCard[] {
    return strategy.targetedCards(
      caster,
      new Player('source', [caster, ...allies]),
      opponentPlayer,
    );
  }

  beforeEach(() => {
    opponentPlayer = new Player('opponent', [createFightingCard()]);
    caster = createFightingCard({ id: 'caster', health: 100 });
    strategy = new MostWoundedAllyStrategy(THRESHOLD);
  });

  describe('when one ally is below the threshold', () => {
    it('targets that ally', () => {
      const wounded = ally('wounded', 85);

      expect(target(ally('healthy', 10), wounded)).toEqual([wounded]);
    });
  });

  describe('when several allies are below the threshold', () => {
    it('targets the one in the worst shape', () => {
      const worst = ally('worst', 95);

      expect(target(ally('bad', 85), worst)).toEqual([worst]);
    });

    it('keeps deck order on a tie', () => {
      const first = ally('first', 90);

      expect(target(first, ally('second', 90))).toEqual([first]);
    });
  });

  describe('when no ally is below the threshold', () => {
    it('targets nobody', () => {
      expect(target(ally('healthy', 10))).toEqual([]);
    });
  });

  describe('when the caster itself is the most wounded', () => {
    it('never targets the caster', () => {
      caster.addRealDamage(95);

      expect(target(ally('healthy', 10))).toEqual([]);
    });
  });

  describe('when the only ally below the threshold is dead', () => {
    it('targets nobody', () => {
      expect(target(ally('dead', 100))).toEqual([]);
    });
  });

  describe('when a wounded ally is healed back above the threshold', () => {
    it('stops targeting it', () => {
      const wounded = ally('wounded', 85);
      wounded.heal(50);

      expect(target(wounded)).toEqual([]);
    });
  });
});

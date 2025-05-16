import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { Player } from '../player';
import { FightingCard } from '../cards/fighting-card';

describe('when launching a special attack', () => {
  const attackerAccuracy = 25;
  const attacker = createFightingCard({
    attack: 10,
    criticalChance: 0,
    accuracy: attackerAccuracy,
    skills: {
      special: { damageRate: 1.0, energy: 0, kind: 'specialAttack' },
    },
  });
  const player1 = new Player('player1', [attacker]);

  describe('and the attack is not dodge', () => {
    const defenderWithoutDodge = createFightingCard({
      defense: 0,
      agility: attackerAccuracy,
    });
    const player2 = new Player('player2', [defenderWithoutDodge]);

    it('should compute the damage with the special attack', () => {
      expect(
        attacker.launchSpecial({
          sourcePlayer: player1,
          opponentPlayer: player2,
        }),
      ).toEqual([
        {
          damage: 10,
          isCritical: false,
          dodge: false,
          defender: defenderWithoutDodge,
        },
      ]);
    });
  });

  describe('and the attack is dodge', () => {
    const defenderWithDodge = createFightingCard({
      defense: 0,
      agility: attackerAccuracy + 1,
    });
    const player2 = new Player('player2', [defenderWithDodge]);

    it('should not deal any damage', () => {
      expect(
        attacker.launchSpecial({
          sourcePlayer: player1,
          opponentPlayer: player2,
        }),
      ).toEqual([
        {
          damage: 0,
          isCritical: false,
          dodge: true,
          defender: defenderWithDodge,
        },
      ]);
    });
  });
});

describe('when launching a special healing', () => {
  const healer = createFightingCard({
    attack: 100,
    skills: {
      special: { kind: 'specialHealing', damageRate: 2.5, energy: 0 },
    },
  });
  const player1 = new Player('player1', [healer]);
  let target: FightingCard;
  let player2: Player;

  describe('and the target is not full health', () => {
    beforeEach(() => {
      target = createFightingCard({ health: 500, defense: 0 });
      player2 = new Player('player2', [target]);

      target.collectsDamages(400);
    });

    it('should return the healing result', () => {
      const result = healer.launchSpecial({
        sourcePlayer: player1,
        opponentPlayer: player2,
      });

      expect(result).toEqual([{ healed: 250, target }]);
    });

    it('should increase the health of the card', () => {
      healer.launchSpecial({
        sourcePlayer: player1,
        opponentPlayer: player2,
      });

      expect(target.actualHealth).toEqual(350);
    });
  });

  describe('and the target is full health', () => {
    const maxHealth = 500;

    beforeEach(() => {
      target = createFightingCard({ health: maxHealth, defense: 0 });
      player2 = new Player('player2', [target]);
    });

    it('should return a null healing result', () => {
      const result = healer.launchSpecial({
        sourcePlayer: player1,
        opponentPlayer: player2,
      });

      expect(result).toEqual([{ healed: 0, target }]);
    });

    it('should not change the health of the card', () => {
      healer.launchSpecial({
        sourcePlayer: player1,
        opponentPlayer: player2,
      });

      expect(target.actualHealth).toEqual(maxHealth);
    });
  });

  describe('and the target is dead', () => {
    const maxHealth = 500;

    beforeEach(() => {
      target = createFightingCard({ health: maxHealth, defense: 0 });
      player2 = new Player('player2', [target]);

      target.collectsDamages(maxHealth);
    });

    it('should return a null healing result', () => {
      const result = healer.launchSpecial({
        sourcePlayer: player1,
        opponentPlayer: player2,
      });

      expect(result).toEqual([]);
    });

    it('should not change the health of the card', () => {
      healer.launchSpecial({
        sourcePlayer: player1,
        opponentPlayer: player2,
      });

      expect(target.actualHealth).toEqual(0);
    });
  });

  describe('when the healing if more than the card max health', () => {
    const maxHealth = 500;
    const damage = 100;

    beforeEach(() => {
      target = createFightingCard({ health: maxHealth, defense: 0 });
      player2 = new Player('player2', [target]);

      target.collectsDamages(damage);
    });

    it('should return the healing result', () => {
      const result = healer.launchSpecial({
        sourcePlayer: player1,
        opponentPlayer: player2,
      });

      expect(result).toEqual([{ healed: damage, target }]);
    });

    it('should increase the health of the card to the max health', () => {
      healer.launchSpecial({
        sourcePlayer: player1,
        opponentPlayer: player2,
      });

      expect(target.actualHealth).toEqual(maxHealth);
    });
  });
});

describe('when launching a self healing skill', () => {
  const fightingContext = {
    sourcePlayer: null,
    opponentPlayer: null,
  };
  let healer: FightingCard;

  beforeEach(() => {
    healer = createFightingCard({
      attack: 100,
      defense: 0,
      health: 500,
      skills: {
        others: [
          {
            effectRate: 1.5,
            trigger: 'turn-end',
            targetingStrategy: 'self',
          },
        ],
      },
    });
  });

  describe('and the card is not full health', () => {
    beforeEach(() => {
      healer.collectsDamages(400);
    });

    it('should return the healing result', () => {
      const result = healer.launchSkill('turn-end', fightingContext);

      expect(result).toEqual([
        {
          healAmount: 150,
          remainingHealth: 250,
          target: healer.identityInfo,
        },
      ]);
    });
  });

  describe('and the card is full health', () => {
    it('should return a null healing result', () => {
      const result = healer.launchSkill('turn-end', fightingContext);

      expect(result).toEqual([
        {
          healAmount: 0,
          remainingHealth: 500,
          target: healer.identityInfo,
        },
      ]);
    });

    it('should not change the health of the card', () => {
      healer.launchSkill('turn-end', fightingContext);

      expect(healer.actualHealth).toEqual(500);
    });
  });

  describe('when the healing is more than the card max health', () => {
    const damage = 50;

    beforeEach(() => {
      healer.collectsDamages(damage);
    });

    it('should return the healing result', () => {
      const result = healer.launchSkill('turn-end', fightingContext);

      expect(result).toEqual([
        {
          healAmount: damage,
          remainingHealth: 500,
          target: healer.identityInfo,
        },
      ]);
    });
  });
});

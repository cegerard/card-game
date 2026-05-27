import { Fight } from '../fight-simulator/fight';
import { Player } from '../player';
import { PlayerByPlayerCardSelector } from '../fight-simulator/card-selectors/player-by-player';
import { createFightingCard } from '../../../../test/helpers/fighting-card';
import { DamageComposition } from '../cards/@types/damage/damage-composition';
import { DamageType } from '../cards/@types/damage/damage-type';

describe('Shield mechanic', () => {
  describe('when special attack applies a shield', () => {
    const attacker = createFightingCard({
      attack: 10,
      criticalChance: 0,
      health: 500,
      accuracy: 100,
      agility: 0,
      speed: 100,
      defense: 0,
      skills: {
        special: {
          damages: [new DamageComposition(DamageType.PHYSICAL, 0.1)],
          energy: 20,
          kind: 'specialAttack',
          shieldApplication: {
            rate: 0.3,
            duration: 1,
            targetingStrategy: 'self',
          },
        },
      },
    });
    const defender = createFightingCard({
      attack: 5,
      defense: 0,
      health: 1000,
      speed: 0,
      agility: 0,
      accuracy: 0,
      criticalChance: 0,
    });

    const player1 = new Player('Player 1', [attacker]);
    const player2 = new Player('Player 2', [defender]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    const result = fight.start();
    const steps = Object.values(result);

    it('emits a shield_applied step after the special attack', () => {
      const shieldApplied = steps.find((s) => s.kind === 'shield_applied');

      expect(shieldApplied).toBeDefined();
    });

    it('sets shield points to 30% of attacker max health', () => {
      const shieldApplied = steps.find(
        (s) => s.kind === 'shield_applied',
      ) as any;

      expect(shieldApplied.targets[0].points).toBe(150);
    });

    it('emits a shield_expired step at end of turn if shield was not depleted', () => {
      const shieldExpired = steps.find((s) => s.kind === 'shield_expired');

      expect(shieldExpired).toBeDefined();
    });
  });

  describe('when a shielded card takes damage exceeding shield points', () => {
    const shieldedCard = createFightingCard({
      id: 'shielded',
      attack: 1,
      criticalChance: 0,
      health: 400,
      accuracy: 0,
      agility: 0,
      speed: 50,
      defense: 0,
      skills: {
        special: {
          damages: [new DamageComposition(DamageType.PHYSICAL, 0.01)],
          energy: 0,
          kind: 'specialAttack',
          shieldApplication: { rate: 0.3, duration: 2 },
        },
      },
    });
    const attacker = createFightingCard({
      attack: 500,
      criticalChance: 0,
      health: 1000,
      accuracy: 100,
      agility: 0,
      speed: 100,
      defense: 0,
    });

    shieldedCard.applyShield(0.3, 2);

    const player1 = new Player('Player 1', [attacker]);
    const player2 = new Player('Player 2', [shieldedCard]);
    const fight = new Fight(
      player1,
      player2,
      new PlayerByPlayerCardSelector(player1, player2),
    );

    const result = fight.start();
    const steps = Object.values(result);

    it('emits a shield_broken step after the attack', () => {
      const shieldBroken = steps.find((s) => s.kind === 'shield_broken');

      expect(shieldBroken).toBeDefined();
    });

    it('shield_broken references the shielded card', () => {
      const shieldBroken = steps.find((s) => s.kind === 'shield_broken') as any;

      expect(shieldBroken.card.id).toBe('shielded');
    });
  });
});

import { SimpleAttack } from '../simple-attack';
import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../fighting-card';
import { Player } from '../../../player';
import { FightingContext } from '../../@types/fighting-context';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { TargetedAll } from '../../../targeting-card-strategies/targeted-all';

const ATTACK = 100;

describe('attack interception by a guardian', () => {
  let attacker: FightingCard;
  let guardian: FightingCard;
  let ally: FightingCard;
  let context: FightingContext;
  let attack: SimpleAttack;

  function launch() {
    return attack.launch(attacker, context).results;
  }

  beforeEach(() => {
    attacker = createFightingCard({
      attack: ATTACK,
      accuracy: 9999,
      criticalChance: 0,
    });
    // The guardian is tougher, so the redirect is visible in the damage.
    guardian = createFightingCard({
      id: 'guardian',
      health: 1000,
      defense: 40,
      agility: 0,
    });
    ally = createFightingCard({
      id: 'ally',
      health: 1000,
      defense: 0,
      agility: 0,
    });
    context = {
      sourcePlayer: new Player('attackers', [attacker]),
      opponentPlayer: new Player('defenders', [ally, guardian]),
    };
    attack = new SimpleAttack(
      'Strike',
      [new DamageComposition(DamageType.PHYSICAL, 1)],
      new TargetedAll(),
    );
  });

  describe('while a guardian protects the ally', () => {
    beforeEach(() => {
      guardian.protect(ally, 2);
    });

    it('resolves the hit against the guardian', () => {
      const aimedAtAlly = launch()[0];

      expect(aimedAtAlly.defender).toBe(guardian);
    });

    it('reports which ally the hit was aimed at', () => {
      expect(launch()[0].interceptedFor).toBe(ally);
    });

    it('leaves the protected ally untouched', () => {
      launch();

      expect(ally.actualHealth).toBe(1000);
    });

    it('uses the guardian own defence', () => {
      expect(launch()[0].damage).toBe(ATTACK - 40);
    });

    it('lets the guardian take both hits of an attack on all', () => {
      launch();

      expect(guardian.actualHealth).toBe(1000 - 2 * (ATTACK - 40));
    });
  });

  describe('once the protection is over', () => {
    it('lets the hit reach the ally again', () => {
      guardian.protect(ally, 0);
      guardian.decreaseProtectionDuration();

      expect(launch()[0].defender).toBe(ally);
    });
  });

  describe('without any protection', () => {
    it('hits the aimed card', () => {
      expect(launch()[0].defender).toBe(ally);
    });

    it('reports no interception', () => {
      expect(launch()[0].interceptedFor).toBeUndefined();
    });
  });

  describe('when the guardian is dead', () => {
    it('lets the hit reach the ally', () => {
      guardian.protect(ally, 2);
      guardian.addRealDamage(1000);

      expect(launch()[0].defender).toBe(ally);
    });
  });
});

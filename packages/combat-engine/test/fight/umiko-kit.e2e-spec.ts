import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const roster = JSON.parse(
  readFileSync(join(__dirname, '../../samples/cards.json'), 'utf-8'),
);

// Without criticals every hit lands the same from one run to the next.
const umiko = {
  ...roster.find((card) => card.id === 'umiko'),
  criticalChance: 0,
};

const WHIP = 'Fouet des Marées';
const PRISON = 'Prison des Huit Courants';
const WATER_ZONE = "Prison des Huit Courants - Zone d'eau";
const FLUX_SPEED = 'Flux Adaptatif - Vitesse';
const WHIRLPOOL = 'Tourbillon Entravant';
const TIDE = 'Marée des Possibilités';

const card = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name: id,
  attack: 0,
  defense: 0,
  health: 10000,
  speed: 50,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'FIRE',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 9999,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
  ...overrides,
});

const named = (steps: any[], kind: string, name: string) =>
  steps.filter((s) => s.kind === kind && s.name === name);
const ofKind = (steps: any[], kind: string) =>
  steps.filter((s) => s.kind === kind);

describe('Umiko full kit', () => {
  let app: INestApplication;

  const fight = async (player1: object[], player2: object[]) => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: player1 },
        player2: { name: 'P2', deck: player2 },
      })
      .expect(200);
    return Object.values(response.body) as any[];
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  describe('Fouet des Marées', () => {
    it('strikes with physical and water damage', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(named(steps, 'attack', WHIP)[0].damages[0].kind).toEqual([
        'PHYSICAL',
        'WATER',
      ]);
    });

    it('slows its target for a turn', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(named(steps, 'debuff', WHIP)[0].alterations).toEqual([
        expect.objectContaining({ kind: 'speed', remainingTurns: 1 }),
      ]);
    });
  });

  describe('Flux Adaptatif', () => {
    it('quickens her at each turn end, five times at most', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(named(steps, 'buff', FLUX_SPEED)).toHaveLength(5);
    });

    it('fades on a hit costing more than 30% of her health', async () => {
      const steps = await fight([umiko], [card('foe', { attack: 250 })]);

      expect(
        ofKind(steps, 'buff_removed').some(
          (s) => s.eventName === 'damage-taken-umiko',
        ),
      ).toBe(true);
    });

    it('holds against lighter hits', async () => {
      const steps = await fight([umiko], [card('foe', { attack: 60 })]);

      expect(ofKind(steps, 'buff_removed')).toEqual([]);
    });
  });

  describe('Intelligence des Profondeurs', () => {
    // Accuracy 75: hits her base agility of 70, misses it raised by 10%.
    it('dodges an enemy once it has attacked her', async () => {
      const steps = await fight(
        [umiko],
        [card('foe', { attack: 10, accuracy: 75 })],
      );
      const dodges = steps
        .filter((s) => s.kind === 'attack' && s.attacker.id === 'foe')
        .map((s) => s.damages[0].dodge);

      expect(dodges.slice(0, 2)).toEqual([false, true]);
    });
  });

  describe('Tourbillon Entravant', () => {
    it('strikes with water every three turns', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(named(steps, 'attack', WHIRLPOOL)[0].damages[0].kind).toEqual([
        'WATER',
      ]);
    });

    it('weakens the defense of its target', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(named(steps, 'debuff', WHIRLPOOL)[0].alterations).toEqual([
        expect.objectContaining({ kind: 'defense', remainingTurns: 2 }),
      ]);
    });

    it('cuts its target off its allies support for a turn', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(ofKind(steps, 'support_blocked')[0]).toMatchObject({
        card: { id: 'foe' },
        remainingTurns: 1,
      });
    });
  });

  describe('Prison des Huit Courants', () => {
    const imprison = () => fight([umiko], [card('a'), card('b'), card('c')]);

    it('seizes two enemies', async () => {
      const steps = await imprison();

      expect(named(steps, 'special_attack', PRISON)[0].damages).toHaveLength(2);
    });

    it('entangles them', async () => {
      const steps = await imprison();

      expect(
        ofKind(steps, 'status_change').filter((s) => s.status === 'entangle')
          .length,
      ).toBeGreaterThan(0);
    });

    it('drains their energy', async () => {
      // Alone, the enemy acts as often as Umiko and has charged its gauge.
      const steps = await fight([umiko], [card('foe')]);

      expect(ofKind(steps, 'energy_drained')[0].amount).toBe(15);
    });

    it('leaves them vulnerable to water for two turns', async () => {
      const steps = await imprison();

      expect(ofKind(steps, 'vulnerability_applied')[0]).toMatchObject({
        damageType: 'WATER',
        rate: 0.5,
        remainingTurns: 2,
      });
    });

    it('lays a zone of water between two adjacent targets', async () => {
      const steps = await fight([umiko], [card('a'), card('b')]);

      expect(named(steps, 'debuff', WATER_ZONE)[0].alterations).toEqual([
        expect.objectContaining({ kind: 'agility' }),
        expect.objectContaining({ kind: 'agility' }),
      ]);
    });

    it('makes an entangled enemy fail its action on a low roll', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
      const steps = await imprison();

      expect(ofKind(steps, 'action_failed')[0].cause).toBe('entangle');
    });
  });

  describe('Marée des Possibilités', () => {
    // High rolls: no clone takes a hit and no entanglement fails an action,
    // unless a test says otherwise.
    beforeEach(() => {
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
    });

    const pressed = () =>
      fight([umiko, card('ally')], [card('foe', { attack: 150 })]);

    it('rises when she falls to half her health', async () => {
      const steps = await pressed();

      expect(named(steps, 'transformation_started', TIDE)).toHaveLength(1);
    });

    it('turns the battlefield into water for three turns', async () => {
      const steps = await pressed();

      expect(named(steps, 'battlefield_started', TIDE)[0].remainingTurns).toBe(
        3,
      );
    });

    it('quickens and sharpens her allies', async () => {
      const steps = await pressed();

      expect(
        named(steps, 'buff', TIDE)[0]
          .alterations.filter((a) => a.target.id === 'ally')
          .map((a) => a.kind),
      ).toEqual(['speed', 'accuracy']);
    });

    it('slows the dodge of the enemies', async () => {
      const steps = await pressed();

      expect(named(steps, 'debuff', TIDE)[0].alterations).toEqual([
        expect.objectContaining({ kind: 'agility' }),
      ]);
    });

    it('lets a clone take an attack on a low roll', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
      const steps = await pressed();

      expect(named(steps, 'decoy_struck', TIDE)[0].remainingDecoys).toBe(2);
    });

    describe('when Umiko falls under it', () => {
      const killed = () =>
        fight([umiko, card('ally')], [card('foe', { attack: 400 })]);

      it('lasts two more turns', async () => {
        const steps = await killed();

        expect(named(steps, 'battlefield_extended', TIDE)[0].extraTurns).toBe(
          2,
        );
      });

      it('lets her clone cast the prison one last time', async () => {
        const steps = await killed();
        const death = steps.findIndex(
          (s) =>
            s.kind === 'status_change' &&
            s.status === 'dead' &&
            s.card.id === 'umiko',
        );

        expect(
          steps
            .slice(death)
            .some((s) => s.kind === 'attack' && s.name === PRISON),
        ).toBe(true);
      });
    });
  });
});

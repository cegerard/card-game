import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const selkhet = JSON.parse(
  readFileSync(join(__dirname, '../../samples/cards.json'), 'utf-8'),
).find((card) => card.id === 'selkhet');

const SURPRISE_ATTACK = 'Embuscade Tectonique - Attaque surprise';
const JUDGEMENT = 'Jugement de l’Obsidienne';
const LEGACY = 'heritage-de-la-panthere';

const card = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name: id,
  attack: 0,
  defense: 0,
  health: 1000,
  speed: 50,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'WATER',
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

// Without criticals every hit lands the same from one run to the next: dodges
// are deterministic, and her opponents carry no resistance to roll.
const hunter = { ...selkhet, criticalChance: 0 };

// Strikes the whole board, so Selkhet takes a hit as soon as she is revealed.
const brute = card('brute', {
  attack: 135,
  health: 100000,
  speed: 10,
  skills: {
    ...card('brute').skills,
    simpleAttack: {
      name: 'Smash',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'target-all',
    },
  },
});

describe('Selkhet full kit', () => {
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
    await app.close();
  });

  describe('on the hunt', () => {
    let steps: any[];

    const named = (name: string) => steps.filter((s) => s.name === name);
    const lacerations = () =>
      named('Lacération Silencieuse').map((s) => s.damages[0].damage);

    beforeEach(async () => {
      steps = await fight([hunter], [card('prey', { health: 5000 })]);
    });

    it('opens the fight concealed with Marche Fantôme', () => {
      expect(steps[1]).toEqual(
        expect.objectContaining({
          kind: 'concealment_started',
          name: 'Marche Fantôme',
        }),
      );
    });

    it('strikes harder from concealment', () => {
      const [fromConcealment, inTheOpen] = lacerations();

      expect(fromConcealment).toBeGreaterThan(inTheOpen);
    });

    it('makes its prey bleed with Lacération Silencieuse', () => {
      expect(
        steps.some((s) => s.kind === 'status_change' && s.status === 'bleed'),
      ).toBe(true);
    });

    it('hits a prey under 40% a quarter harder (Instinct de Chasseresse)', () => {
      const [, base] = lacerations();

      expect(lacerations().map((d) => Math.round((d / base) * 100))).toContain(
        125,
      );
    });

    it('dives underground with Embuscade Tectonique', () => {
      expect(named('sous-terre').map((s) => s.kind)).toContain(
        'stance_started',
      );
    });

    it('stuns with the surprise attack', () => {
      const strike = steps.findIndex((s) => s.name === SURPRISE_ATTACK);
      const stun = steps.findIndex(
        (s, i) => i > strike && s.kind === 'status_change',
      );

      expect(steps[stun].status).toBe('stunt');
    });

    it('fractures the defense of its target', () => {
      const [fracture] = named(SURPRISE_ATTACK).filter(
        (s) => s.kind === 'debuff',
      );

      expect(fracture.alterations[0].kind).toBe('defense');
    });

    it('casts Fusion Tectonique', () => {
      expect(named('Fusion Tectonique').map((s) => s.kind)).toEqual([
        'special_stance',
        'buff',
        'concealment_started',
      ]);
    });

    it('sharpens its accuracy with Sens Sismique', () => {
      const [sense] = named('Fusion Tectonique').filter(
        (s) => s.kind === 'buff',
      );

      expect(sense.alterations[0].kind).toBe('accuracy');
    });

    it('cuts the regeneration of its prey with Griffures', () => {
      const griffures = steps.filter(
        (s) => s.kind === 'debuff' && s.alterations[0].kind === 'regeneration',
      );

      expect(griffures.length).toBeGreaterThan(0);
    });
  });

  describe('when cornered', () => {
    let steps: any[];

    const named = (name: string) => steps.filter((s) => s.name === name);
    const deathOf = (id: string) =>
      steps.findIndex(
        (s) =>
          s.kind === 'status_change' && s.status === 'dead' && s.card.id === id,
      );

    beforeEach(async () => {
      steps = await fight(
        [
          hunter,
          card('slow-ally', { speed: 20, health: 100000 }),
          card('fast-ally', { speed: 200, health: 100000 }),
        ],
        [
          card('weakling', { health: 160, speed: 10 }),
          brute,
          card('straggler', { health: 350, speed: 10 }),
        ],
      );
    });

    it('conceals itself again after a kill (Marche Fantôme)', () => {
      expect(steps[deathOf('weakling') + 1]).toEqual(
        expect.objectContaining({
          kind: 'concealment_started',
          name: 'Marche Fantôme',
        }),
      );
    });

    // The weakling falls from 10% and the executed straggler from 13%.
    it('speeds up for each target it kills under 30%', () => {
      expect(named('Instinct de Chasseresse - Vitesse')).toHaveLength(2);
    });

    it('strikes every enemy with Jugement de l’Obsidienne', () => {
      const [judgement] = named(JUDGEMENT);

      expect(judgement.damages.map((d) => d.defender.id)).toEqual([
        'brute',
        'straggler',
      ]);
    });

    it('executes the enemy left under 25%', () => {
      const [execution] = named(JUDGEMENT).filter((s) => s.kind === 'executed');

      expect(execution.card.id).toBe('straggler');
    });

    it('lowers the dodge of the survivors (Terrain d’Obsidienne)', () => {
      const [field] = named(JUDGEMENT).filter((s) => s.kind === 'debuff');

      expect(field.alterations[0].kind).toBe('agility');
    });

    it('fires its ultimate only once', () => {
      expect(named(JUDGEMENT).filter((s) => s.kind === 'attack')).toHaveLength(
        1,
      );
    });

    it('opens the window of Héritage de la Panthère', () => {
      expect(named(LEGACY).map((s) => s.kind)).toContain('stance_started');
    });

    it('leaves its speed to the fastest ally when it falls', () => {
      expect(steps[deathOf('selkhet') + 1]).toEqual(
        expect.objectContaining({
          kind: 'buff_transferred',
          target: expect.objectContaining({ id: 'fast-ally' }),
        }),
      );
    });
  });
});

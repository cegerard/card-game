import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const redWindStance = {
  kind: 'STANCE',
  name: 'Lames du Vent Rouge',
  event: 'bleed-stacks-applied',
  stackThreshold: 2,
  stanceActivation: { name: 'vent-rouge', duration: 3 },
};

const redWindBleed = {
  kind: 'BLEED_EMPOWERMENT',
  name: 'Lames du Vent Rouge',
  requiresStance: 'vent-rouge',
  extraStacks: 1,
  rate: 0.08,
};

const fusionAtStart = {
  kind: 'STANCE',
  name: 'Fusion Tectonique',
  event: 'fight-start',
  stanceActivation: { name: 'fusion-tectonique', duration: 50 },
};

const griffures = {
  kind: 'BLEED_EMPOWERMENT',
  name: 'Griffures',
  requiresStance: 'fusion-tectonique',
  rate: 0.03,
  duration: 4,
  triggeredDebuff: {
    debuffType: 'regeneration',
    debuffRate: 0.5,
    duration: 4,
    probability: 1,
  },
};

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 100000,
  speed: 10,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      energy: 1000,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
  ...overrides,
});

const scythra = (others: object[]) =>
  card('scythra', {
    skills: {
      ...card('scythra').skills,
      simpleAttack: {
        name: 'Lacération du Zéphyr',
        damages: [{ type: 'PHYSICAL', rate: 1.0 }],
        targetingStrategy: 'position-based',
        effects: [{ type: 'BLEED', rate: 0.05, duration: 10, maxStacks: 20 }],
      },
      others,
    },
  });

const selkhet = (others: object[]) =>
  card('selkhet', {
    skills: {
      ...card('selkhet').skills,
      simpleAttack: {
        name: 'Lacération Silencieuse',
        damages: [{ type: 'PHYSICAL', rate: 1.0 }],
        targetingStrategy: 'position-based',
        effects: [
          {
            type: 'BLEED',
            rate: 0.02,
            duration: 3,
            maxStacks: 8,
            basis: 'target-max-health',
          },
        ],
      },
      others,
    },
  });

describe('BLEED_EMPOWERMENT skill', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const stacksAfterEachBleed = async (others: object[]) => {
    const response = await post({
      cardSelectorStrategy: 'player-by-player',
      player1: { name: 'P1', deck: [scythra(others)] },
      player2: { name: 'P2', deck: [card('prey')] },
    });
    return (Object.values(response.body) as any[])
      .filter((s) => s.kind === 'status_change' && s.status === 'bleed')
      .slice(0, 3)
      .map((s) => s.stacks);
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

  it('lays an extra stack once the stance is open', async () => {
    expect(await stacksAfterEachBleed([redWindStance, redWindBleed])).toEqual([
      1, 2, 4,
    ]);
  });

  it('lays nothing more without the stance', async () => {
    expect(await stacksAfterEachBleed([redWindBleed])).toEqual([1, 2, 3]);
  });

  it('rejects the skill without its stance', async () => {
    const { requiresStance: _omitted, ...withoutStance } = redWindBleed;

    const response = await post({
      cardSelectorStrategy: 'player-by-player',
      player1: { name: 'P1', deck: [scythra([withoutStance])] },
      player2: { name: 'P2', deck: [card('prey')] },
    });

    expect(response.status).toBe(400);
  });

  describe('with a duration, a basis kept from the effect and a debuff (Griffures)', () => {
    const griffuresFight = (others: object[]) =>
      post({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: [selkhet(others)] },
        player2: { name: 'P2', deck: [card('prey', { regeneration: 20 })] },
      });
    const steps = async (others: object[]) =>
      Object.values((await griffuresFight(others)).body) as any[];
    const firstBleedTick = (all: any[]) =>
      all.find((s) => s.kind === 'state_effect' && s.type === 'bleed');

    it('bleeds 3% of the target max health during the stance', async () => {
      const tick = firstBleedTick(await steps([fusionAtStart, griffures]));

      expect(tick.damage).toBe(3000);
    });

    it('bleeds for 4 turns during the stance', async () => {
      const tick = firstBleedTick(await steps([fusionAtStart, griffures]));

      expect(tick.remainingTurns).toBe(3);
    });

    it('halves the target regeneration during the stance', async () => {
      const debuff = (await steps([fusionAtStart, griffures])).find(
        (s) => s.kind === 'debuff',
      );

      expect(debuff.alterations[0]).toEqual(
        expect.objectContaining({ kind: 'regeneration', value: 10 }),
      );
    });

    it('keeps the effect own bleed outside the stance', async () => {
      const tick = firstBleedTick(await steps([griffures]));

      expect(tick.damage).toBe(2000);
    });

    it('returns 400 with a duration of 0', async () => {
      const response = await griffuresFight([
        fusionAtStart,
        { ...griffures, duration: 0 },
      ]);

      expect(response.status).toBe(400);
    });
  });
});

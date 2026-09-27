import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const THRESHOLD = 0.2;
const ALLY_MAX_HEALTH = 1000;

const protectionSkill = {
  kind: 'PROTECTION',
  name: 'Gardien Éternel',
  duration: 99,
  event: 'any-ally-health-below',
  targetingStrategy: 'most-wounded-ally',
  activationLimit: 1,
  activationCondition: {
    type: 'health-threshold',
    operator: 'below',
    threshold: THRESHOLD,
  },
};

// « Si Aegis tombe à 0 PV pendant Gardien Éternel, l'allié protégé récupère
// 40 % de PV et gagne +20 % de Défense pour le reste du combat. »
const sacrificeHeal = {
  kind: 'HEALING',
  name: 'Sacrifice',
  rate: 0.4,
  event: 'self-death',
  targetingStrategy: 'protected-ally',
  healBasis: 'target-max-health',
};

const sacrificeBuff = {
  kind: 'ALTERATION',
  name: 'Sacrifice - La carapace brisée',
  polarity: 'buff',
  buffType: 'defense',
  rate: 0.2,
  duration: 0,
  event: 'self-death',
  targetingStrategy: 'protected-ally',
};

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 100,
  health: ALLY_MAX_HEALTH,
  speed: 100,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 2.0 }],
      energy: 100000,
      targetingStrategy: 'target-all',
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

const guardianWith = (others: unknown[]) =>
  card('guardian', {
    health: 600,
    defense: 0,
    skills: { ...card('guardian').skills, others },
  });

// enemy-0 wears the guardian down; enemy-1 pushes the ally under the
// threshold so the protection opens in the first place.
const payload = (others: unknown[]) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [guardianWith(others), card('ally')] },
  player2: {
    name: 'P2',
    deck: [card('enemy-0', { attack: 400 }), card('enemy-1', { attack: 950 })],
  },
});

describe('self-death sacrifice on the protected ally', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);

  const stepsOf = (body, kind: string) =>
    Object.values(body).filter((s: any) => s.kind === kind);

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

  it('heals the protected ally when the guardian falls', async () => {
    const response = await post(
      payload([protectionSkill, sacrificeHeal, sacrificeBuff]),
    );
    const heals = stepsOf(response.body, 'healing').filter(
      (s: any) => s.name === 'Sacrifice',
    );

    expect(heals[0]).toMatchObject({
      source: expect.objectContaining({ id: 'guardian' }),
      heal: [
        expect.objectContaining({
          target: expect.objectContaining({ id: 'ally' }),
        }),
      ],
    });
  });

  it('heals a share of the ally own maximum health', async () => {
    const response = await post(
      payload([protectionSkill, sacrificeHeal, sacrificeBuff]),
    );
    const heals = stepsOf(response.body, 'healing').filter(
      (s: any) => s.name === 'Sacrifice',
    );

    expect((heals[0] as any).heal[0].healed).toBe(0.4 * ALLY_MAX_HEALTH);
  });

  it('leaves the ally a permanent defence buff', async () => {
    const response = await post(
      payload([protectionSkill, sacrificeHeal, sacrificeBuff]),
    );
    const buffs = stepsOf(response.body, 'buff').filter(
      (s: any) => s.name === 'Sacrifice - La carapace brisée',
    );

    expect((buffs[0] as any).alterations[0]).toMatchObject({
      target: expect.objectContaining({ id: 'ally' }),
      kind: 'defense',
    });
  });

  it('gives nothing when the guardian dies protecting nobody', async () => {
    const response = await post(payload([sacrificeHeal, sacrificeBuff]));

    expect(
      stepsOf(response.body, 'healing').filter(
        (s: any) => s.name === 'Sacrifice',
      ),
    ).toHaveLength(0);
  });
});

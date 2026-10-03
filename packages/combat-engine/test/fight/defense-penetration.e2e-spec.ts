import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const detonation = (defensePenetration?: number) => ({
  kind: 'CONDITIONAL_ATTACK',
  name: 'Détonation Hémorragique',
  event: 'next-action',
  interval: 1,
  damages: [{ type: 'PHYSICAL', rate: 1.0 }],
  targetingStrategy: 'position-based',
  ...(defensePenetration !== undefined && { defensePenetration }),
});

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 40,
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

const payload = (skill: object) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'P1',
    deck: [
      card('scythra', { skills: { ...card('x').skills, others: [skill] } }),
    ],
  },
  player2: { name: 'P2', deck: [card('prey')] },
});

describe('defensePenetration on a conditional attack', () => {
  let app: INestApplication;

  const post = (skill: object) =>
    request(app.getHttpServer()).post('/fight').send(payload(skill));
  const firstDetonationDamage = async (skill: object) => {
    const response = await post(skill);
    return (Object.values(response.body) as any[]).find(
      (s) => s.name === 'Détonation Hémorragique',
    ).damages[0].damage;
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

  it('subtracts the whole defense without penetration', async () => {
    expect(await firstDetonationDamage(detonation())).toBe(60);
  });

  it('ignores half the defense at 0.5', async () => {
    expect(await firstDetonationDamage(detonation(0.5))).toBe(80);
  });

  it('rejects a penetration above 1', async () => {
    expect((await post(detonation(1.5))).status).toBe(400);
  });
});

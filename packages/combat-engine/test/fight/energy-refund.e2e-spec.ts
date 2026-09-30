import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const card = (id: string, stats: object, special: object) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 100000,
  speed: 10,
  agility: 0,
  accuracy: 0,
  criticalChance: 0,
  element: 'PHYSICAL',
  ...stats,
  skills: {
    special,
    simpleAttack: {
      name: 'Strike',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
});

const dissection = (energyRefund?: object) => ({
  kind: 'ATTACK',
  name: 'Dissection Éolienne',
  damages: [{ type: 'PHYSICAL', rate: 0.35 }],
  energy: 30,
  hits: 4,
  targetingStrategy: 'position-based',
  energyRefund,
});

const payload = (preyAgility: number, energyRefund?: object) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'P1',
    deck: [card('scythra', { accuracy: 95 }, dissection(energyRefund))],
  },
  player2: {
    name: 'P2',
    deck: [
      card('prey', { agility: preyAgility }, { ...dissection(), energy: 1000 }),
    ],
  },
});

describe('Special energy refund', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);
  const specialEnergy = async (preyAgility: number) => {
    const response = await post(
      payload(preyAgility, { amount: 10, minAccuracyMargin: 20 }),
    );

    return (Object.values(response.body) as any[]).find(
      (s) => s.kind === 'special_attack' && s.attacker?.name === 'scythra',
    ).energy;
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

  it('keeps 10 energy when the accuracy margin is exceeded', async () => {
    expect(await specialEnergy(65)).toBe(10);
  });

  it('empties the energy at the exact margin', async () => {
    expect(await specialEnergy(75)).toBe(0);
  });

  it('returns 400 with a refund of no energy', () => {
    return post(payload(65, { amount: 0, minAccuracyMargin: 20 })).expect(400);
  });
});

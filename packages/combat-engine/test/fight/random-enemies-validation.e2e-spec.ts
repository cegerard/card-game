import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const card = (skills: Record<string, unknown> = {}) => ({
  id: 'card',
  name: 'card',
  attack: 10,
  defense: 0,
  health: 100,
  speed: 50,
  agility: 0,
  accuracy: 100,
  criticalChance: 0,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 40,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'position-based',
    },
    others: [],
    ...skills,
  },
  behaviors: { dodge: 'simple-dodge' },
});

describe('random-enemies targeting validation', () => {
  let app: INestApplication;

  const fight = (deck: object[]) =>
    request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck },
        player2: { name: 'P2', deck: [card()] },
      });

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

  it('refuses random-enemies on a plain attack', async () => {
    const response = await fight([
      card({
        simpleAttack: {
          name: 'Attack',
          damages: [{ type: 'PHYSICAL', rate: 1 }],
          targetingStrategy: 'random-enemies',
        },
      }),
    ]);

    expect(response.status).toBe(400);
  });

  it('refuses a targetCount without random-enemies', async () => {
    const special = { ...card().skills.special, targetCount: 2 };
    const response = await fight([card({ special })]);

    expect(response.status).toBe(400);
  });
});

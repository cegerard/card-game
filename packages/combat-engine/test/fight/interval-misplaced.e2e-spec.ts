import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const card = (others: object[]) => ({
  id: 'card',
  name: 'card',
  attack: 100,
  defense: 0,
  health: 1000,
  speed: 100,
  agility: 0,
  accuracy: 1000,
  criticalChance: 0,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Unused',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 9999,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Griffe',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const buffWithInterval = {
  kind: 'BUFF',
  name: 'Rage',
  event: 'turn-end',
  buffType: 'attack',
  rate: 0.1,
  duration: 1,
  targetingStrategy: 'self',
  interval: 2,
};

describe('interval on a skill kind that has no cooldown', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
  });

  afterEach(() => app.close());

  it('is refused with a 400 instead of being silently ignored', async () => {
    const { status } = await request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: [card([buffWithInterval])] },
        player2: { name: 'P2', deck: [card([])] },
      });

    expect(status).toBe(400);
  });
});

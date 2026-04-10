import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const baseCard = (id: string, others = []) => ({
  id,
  name: id,
  attack: 10,
  defense: 6,
  health: 100,
  speed: 3,
  agility: 25,
  accuracy: 15,
  criticalChance: 0.05,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      rate: 2.0,
      energy: 100,
      targetingStrategy: 'target-all',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const basePayload = (others = []) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [baseCard('card-a', others)] },
  player2: { name: 'P2', deck: [baseCard('card-b')] },
});

describe('Dormant trigger DTO validation', () => {
  let app: INestApplication;

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

  it('returns 400 when event=dormant and activationEvent is missing', () => {
    const payload = basePayload([
      {
        kind: 'HEALING',
        name: 'Dormant Heal',
        rate: 0.3,
        targetingStrategy: 'self',
        event: 'dormant',
        activationTargetCardId: 'card-b',
        replacementEvent: 'enemy-death',
      },
    ]);

    return request(app.getHttpServer()).post('/fight').send(payload).expect(400);
  });

  it('returns 400 when event=dormant and activationTargetCardId is missing', () => {
    const payload = basePayload([
      {
        kind: 'HEALING',
        name: 'Dormant Heal',
        rate: 0.3,
        targetingStrategy: 'self',
        event: 'dormant',
        activationEvent: 'ally-death',
        replacementEvent: 'enemy-death',
      },
    ]);

    return request(app.getHttpServer()).post('/fight').send(payload).expect(400);
  });

  it('returns 400 when event=dormant and replacementEvent is missing', () => {
    const payload = basePayload([
      {
        kind: 'HEALING',
        name: 'Dormant Heal',
        rate: 0.3,
        targetingStrategy: 'self',
        event: 'dormant',
        activationEvent: 'ally-death',
        activationTargetCardId: 'card-b',
      },
    ]);

    return request(app.getHttpServer()).post('/fight').send(payload).expect(400);
  });
});

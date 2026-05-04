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
      damages: [{ type: 'PHYSICAL', rate: 2.0 }],
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

describe('OtherSkillDto validation', () => {
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

  describe('BUFF kind', () => {
    it('returns 400 when buffType is missing', () => {
      const payload = basePayload([
        {
          kind: 'BUFF',
          name: 'Power Up',
          rate: 1.5,
          duration: 3,
          targetingStrategy: 'self',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });

    it('returns 400 when duration is missing', () => {
      const payload = basePayload([
        {
          kind: 'BUFF',
          name: 'Power Up',
          rate: 1.5,
          buffType: 'attack',
          targetingStrategy: 'self',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });

    it('returns 400 when rate is missing', () => {
      const payload = basePayload([
        {
          kind: 'BUFF',
          name: 'Power Up',
          buffType: 'attack',
          duration: 3,
          targetingStrategy: 'self',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });
  });

  describe('DEBUFF kind', () => {
    it('returns 400 when buffType is missing', () => {
      const payload = basePayload([
        {
          kind: 'DEBUFF',
          name: 'Weaken',
          rate: 0.7,
          duration: 2,
          targetingStrategy: 'position-based',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });

    it('returns 400 when duration is missing', () => {
      const payload = basePayload([
        {
          kind: 'DEBUFF',
          name: 'Weaken',
          rate: 0.7,
          buffType: 'defense',
          targetingStrategy: 'position-based',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });
  });

  describe('HEALING kind', () => {
    it('returns 400 when rate is missing', () => {
      const payload = basePayload([
        {
          kind: 'HEALING',
          name: 'Regen',
          targetingStrategy: 'self',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });
  });

  describe('CONDITIONAL_ATTACK kind', () => {
    it('returns 400 when damages is missing', () => {
      const payload = basePayload([
        {
          kind: 'CONDITIONAL_ATTACK',
          name: 'Every 3 Turns',
          interval: 3,
          targetingStrategy: 'position-based',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });

    it('returns 400 when interval is missing', () => {
      const payload = basePayload([
        {
          kind: 'CONDITIONAL_ATTACK',
          name: 'Every 3 Turns',
          damages: [{ type: 'PHYSICAL', rate: 1.5 }],
          targetingStrategy: 'position-based',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });
  });

  describe('ally-death event', () => {
    it('returns 400 when targetCardId is missing', () => {
      const payload = basePayload([
        {
          kind: 'HEALING',
          name: 'Avenge',
          rate: 0.3,
          targetingStrategy: 'self',
          event: 'ally-death',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });
  });

  describe('enemy-death event', () => {
    it('returns 400 when targetCardId is missing', () => {
      const payload = basePayload([
        {
          kind: 'HEALING',
          name: 'Feed',
          rate: 0.2,
          targetingStrategy: 'self',
          event: 'enemy-death',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });
  });
});

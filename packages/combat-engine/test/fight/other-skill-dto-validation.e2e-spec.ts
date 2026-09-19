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

  describe('ALTERATION kind', () => {
    it('returns 400 when buffType is missing', () => {
      const payload = basePayload([
        {
          kind: 'ALTERATION',
          name: 'Power Up',
          rate: 1.5,
          duration: 3,
          polarity: 'buff',
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
          kind: 'ALTERATION',
          name: 'Power Up',
          rate: 1.5,
          buffType: 'attack',
          polarity: 'buff',
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
          kind: 'ALTERATION',
          name: 'Power Up',
          buffType: 'attack',
          duration: 3,
          polarity: 'buff',
          targetingStrategy: 'self',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });

    it('returns 400 when polarity is missing', () => {
      const payload = basePayload([
        {
          kind: 'ALTERATION',
          name: 'Power Up',
          rate: 1.5,
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

    it('returns 400 for invalid polarity value', () => {
      const payload = basePayload([
        {
          kind: 'ALTERATION',
          name: 'Invalid',
          rate: 1.5,
          buffType: 'attack',
          duration: 3,
          polarity: 'neutral',
          targetingStrategy: 'self',
          event: 'turn-end',
        },
      ]);
      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });

    it('returns 200 for buff polarity', () => {
      const payload = basePayload([
        {
          kind: 'ALTERATION',
          name: 'Power Up',
          rate: 1.5,
          buffType: 'attack',
          duration: 3,
          polarity: 'buff',
          targetingStrategy: 'self',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(200);
    });

    it('returns 200 for debuff polarity', () => {
      const payload = basePayload([
        {
          kind: 'ALTERATION',
          name: 'Weaken',
          rate: 0.7,
          buffType: 'defense',
          duration: 2,
          polarity: 'debuff',
          targetingStrategy: 'position-based',
          event: 'turn-end',
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(200);
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

  describe('activationCondition threshold validation', () => {
    it('returns 400 when threshold is below 0', () => {
      const payload = basePayload([
        {
          kind: 'SHIELD',
          name: 'Iron Wall',
          rate: 0.3,
          targetingStrategy: 'self',
          activationCondition: {
            type: 'health-threshold',
            operator: 'below',
            threshold: -0.1,
          },
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });

    it('returns 400 when threshold is above 1', () => {
      const payload = basePayload([
        {
          kind: 'SHIELD',
          name: 'Iron Wall',
          rate: 0.3,
          targetingStrategy: 'self',
          activationCondition: {
            type: 'health-threshold',
            operator: 'below',
            threshold: 1.5,
          },
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });

    it('returns 400 when operator is not a valid value', () => {
      const payload = basePayload([
        {
          kind: 'SHIELD',
          name: 'Iron Wall',
          rate: 0.3,
          targetingStrategy: 'self',
          activationCondition: {
            type: 'health-threshold',
            operator: 'invalid-operator',
            threshold: 0.3,
          },
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(400);
    });

    it('accepts threshold of 0', () => {
      const payload = basePayload([
        {
          kind: 'SHIELD',
          name: 'Iron Wall',
          rate: 0.3,
          targetingStrategy: 'self',
          activationCondition: {
            type: 'health-threshold',
            operator: 'below',
            threshold: 0,
          },
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(200);
    });

    it('accepts threshold of 1', () => {
      const payload = basePayload([
        {
          kind: 'SHIELD',
          name: 'Iron Wall',
          rate: 0.3,
          targetingStrategy: 'self',
          activationCondition: {
            type: 'health-threshold',
            operator: 'below',
            threshold: 1,
          },
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(200);
    });

    it('accepts operator "above"', () => {
      const payload = basePayload([
        {
          kind: 'SHIELD',
          name: 'Iron Wall',
          rate: 0.3,
          targetingStrategy: 'self',
          activationCondition: {
            type: 'health-threshold',
            operator: 'above',
            threshold: 0.7,
          },
        },
      ]);

      return request(app.getHttpServer())
        .post('/fight')
        .send(payload)
        .expect(200);
    });
  });

  describe('DAMAGE_REDUCTION kind', () => {
    const reduction = (extra: Record<string, unknown>) => [
      { kind: 'DAMAGE_REDUCTION', name: 'Resilience', ...extra },
    ];

    it('accepts a rate inside the allowed range', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(reduction({ rate: 0.15 }) as []))
        .expect(200);
    });

    it('accepts an optional probability', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(reduction({ rate: 0.15, probability: 0.3 }) as []))
        .expect(200);
    });

    it('returns 400 when rate is missing', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(reduction({}) as []))
        .expect(400);
    });

    it('returns 400 on a rate of 0', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(reduction({ rate: 0 }) as []))
        .expect(400);
    });

    it('returns 400 on a rate above 1', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(reduction({ rate: 1.5 }) as []))
        .expect(400);
    });

    it('explains the rejected rate', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(reduction({ rate: 1.5 }) as []))
        .expect((res) =>
          expect(res.body.message).toContain('rate must be in ]0, 1]'),
        );
    });

    it('returns 400 on a probability above 1', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(reduction({ rate: 0.15, probability: 2 }) as []))
        .expect(400);
    });
  });

  describe('debuff stack budget', () => {
    const alteration = (extra: Record<string, unknown>) => [
      {
        kind: 'ALTERATION',
        name: 'Enlisement',
        event: 'turn-end',
        polarity: 'debuff',
        buffType: 'speed',
        rate: 0.1,
        duration: 3,
        targetingStrategy: 'target-all',
        ...extra,
      },
    ];

    it('accepts a complete stack budget', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(
          basePayload(
            alteration({ stackId: 'enlisement', debuffMaxStacks: 3 }) as [],
          ),
        )
        .expect(200);
    });

    it('accepts no stack budget at all', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(alteration({}) as []))
        .expect(200);
    });

    it('returns 400 when only stackId is given', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(alteration({ stackId: 'enlisement' }) as []))
        .expect(400);
    });

    it('returns 400 when only the cap is given', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(alteration({ debuffMaxStacks: 3 }) as []))
        .expect(400);
    });

    it('explains which half is missing', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(basePayload(alteration({ stackId: 'enlisement' }) as []))
        .expect((res) =>
          expect(res.body.message).toContain(
            'requires both stackId and a max stacks value',
          ),
        );
    });

    it('returns 400 on a cap below 1', () => {
      return request(app.getHttpServer())
        .post('/fight')
        .send(
          basePayload(
            alteration({ stackId: 'enlisement', debuffMaxStacks: 0 }) as [],
          ),
        )
        .expect(400);
    });
  });
});

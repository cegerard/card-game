import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const markEffect = {
  type: 'MARK',
  rate: 0.05,
  damageType: 'WATER',
  maxStacks: 5,
};

const card = (id: string, effects = undefined) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 800,
  speed: 10,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'WATER', rate: 2.0 }],
      energy: 1000,
      targetingStrategy: 'target-all',
    },
    simpleAttack: {
      name: 'Tidal Fangs',
      damages: [{ type: 'WATER', rate: 1.0 }],
      targetingStrategy: 'position-based',
      effects,
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payloadWithEffects = (effects) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('marker', effects)] },
  player2: { name: 'P2', deck: [card('marked')] },
});

describe('MARK effect', () => {
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

  it('emits a mark_applied step on hit', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payloadWithEffects([markEffect]))
      .expect(200);

    const steps = Object.values(response.body) as any[];

    expect(steps).toContainEqual(
      expect.objectContaining({
        kind: 'mark_applied',
        damageType: 'WATER',
        stacks: 1,
      }),
    );
  });

  it('amplifies the marked damage type on the following hits', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payloadWithEffects([markEffect]))
      .expect(200);

    const damages = (Object.values(response.body) as any[])
      .filter((s) => s.kind === 'attack' && s.attacker?.name === 'marker')
      .map((s) => s.damages[0].damage);

    expect(damages.slice(0, 3)).toEqual([100, 105, 110]);
  });

  it('returns 400 when a mark effect has no damageType', () => {
    const { damageType: _damageType, ...withoutDamageType } = markEffect;

    return request(app.getHttpServer())
      .post('/fight')
      .send(payloadWithEffects([withoutDamageType]))
      .expect(400);
  });

  it('returns 400 when a non-mark effect has no level', () => {
    return request(app.getHttpServer())
      .post('/fight')
      .send(payloadWithEffects([{ type: 'POISON', rate: 0.2 }]))
      .expect(400);
  });
});

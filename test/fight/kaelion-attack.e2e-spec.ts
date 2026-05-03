import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const KAELION = {
  id: 'kaelion-01',
  name: 'Kaelion',
  attack: 200,
  defense: 50,
  health: 5000,
  speed: 10,
  agility: 20,
  accuracy: 80,
  criticalChance: 0.1,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Inferno Surge',
      rate: 2.0,
      energy: 100,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Flamme Terreuse',
      targetingStrategy: 'position-based',
      damages: [
        { type: 'PHYSICAL', rate: 0.8 },
        { type: 'FIRE', rate: 0.2 },
        { type: 'EARTH', rate: 0.1 },
      ],
      effects: [
        { type: 'BURN', rate: 0.1, level: 2, probability: 0.5 },
        { type: 'STUNT', rate: 0.0, level: 1, probability: 0.2 },
      ],
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
};

const DUMMY_OPPONENT = {
  id: 'dummy-01',
  name: 'Dummy',
  attack: 1,
  defense: 0,
  health: 99999,
  speed: 1,
  agility: 0,
  accuracy: 0,
  criticalChance: 0,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Weak Hit',
      rate: 0.01,
      energy: 9999,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Poke',
      damages: [{ type: 'PHYSICAL', rate: 0.01 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
};

describe('Kaelion — Flamme Terreuse attack', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepts the Kaelion payload and returns a valid fight result', () => {
    const payload = {
      cardSelectorStrategy: 'player-by-player',
      player1: { name: 'Kaelion Player', deck: [KAELION] },
      player2: { name: 'Dummy Player', deck: [DUMMY_OPPONENT] },
    };

    return request(app.getHttpServer())
      .post('/fight')
      .send(payload)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeDefined();
        expect(typeof res.body).toBe('object');
      });
  });

  it('reports multi-type damage compositions in attack steps', () => {
    const payload = {
      cardSelectorStrategy: 'player-by-player',
      player1: { name: 'Kaelion Player', deck: [KAELION] },
      player2: { name: 'Dummy Player', deck: [DUMMY_OPPONENT] },
    };

    return request(app.getHttpServer())
      .post('/fight')
      .send(payload)
      .expect(200)
      .expect((res) => {
        const steps = Object.values(res.body) as any[];
        const attackStep = steps.find(
          (s) => s.kind === 'attack' && s.attacker?.id === 'kaelion-01',
        );
        expect(attackStep).toBeDefined();
        const kinds = attackStep.damages[0].kind;
        expect(kinds).toContain('PHYSICAL');
        expect(kinds).toContain('FIRE');
        expect(kinds).toContain('EARTH');
      });
  });

  it('validates STUNT is accepted as an effect type', () => {
    const payload = {
      cardSelectorStrategy: 'player-by-player',
      player1: {
        name: 'P1',
        deck: [
          {
            ...KAELION,
            skills: {
              ...KAELION.skills,
              simpleAttack: {
                name: 'Stun Strike',
                targetingStrategy: 'position-based',
                damages: [{ type: 'PHYSICAL', rate: 1.0 }],
                effects: [
                  { type: 'STUNT', rate: 0.0, level: 1, probability: 1.0 },
                ],
              },
            },
          },
        ],
      },
      player2: { name: 'P2', deck: [DUMMY_OPPONENT] },
    };

    return request(app.getHttpServer())
      .post('/fight')
      .send(payload)
      .expect(200)
      .expect((res) => {
        const steps = Object.values(res.body) as any[];
        const stuntStep = steps.find(
          (s) => s.kind === 'status_change' && s.status === 'stunt',
        );
        expect(stuntStep).toBeDefined();
      });
  });
});

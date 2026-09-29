import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const bleedEffect = {
  type: 'BLEED',
  rate: 0.05,
  duration: 3,
  maxStacks: 8,
};

const card = (id: string, effects = []) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
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
      name: 'Lacération du Zéphyr',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
      effects,
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (effect: object) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('bleeder', [effect])] },
  player2: { name: 'P2', deck: [card('bled')] },
});

describe('BLEED effect', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);
  const steps = async (effect: object) =>
    Object.values((await post(payload(effect))).body) as any[];

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

  it('reports the stack count after each application', async () => {
    const bleedSteps = (await steps(bleedEffect)).filter(
      (s) => s.kind === 'status_change' && s.status === 'bleed',
    );

    expect(bleedSteps.slice(0, 3).map((s) => s.stacks)).toEqual([1, 2, 3]);
  });

  it('bleeds at the end of the turn', async () => {
    const tick = (await steps(bleedEffect)).find(
      (s) => s.kind === 'state_effect' && s.type === 'bleed',
    );

    expect(tick).toEqual(
      expect.objectContaining({
        damage: 5,
        remainingTurns: 2,
        remainingStacks: 1,
      }),
    );
  });

  it('caps the stacks at the maximum', async () => {
    const stacks = (await steps({ ...bleedEffect, maxStacks: 2 }))
      .filter((s) => s.kind === 'state_effect' && s.type === 'bleed')
      .map((s) => s.remainingStacks);

    expect(Math.max(...stacks)).toBe(2);
  });

  it('does not require a level', () => {
    return post(payload(bleedEffect)).expect(200);
  });

  it.each(['duration', 'maxStacks'])('returns 400 without %s', (field) => {
    const { [field]: _omitted, ...incomplete } = bleedEffect;

    return post(payload(incomplete)).expect(400);
  });
});

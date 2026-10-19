import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const PREY_ID = 'prey';

const instinct = {
  kind: 'LOW_HEALTH_TARGET_BONUS',
  name: 'Instinct de Chasseresse',
  rate: 0.25,
  activationCondition: { type: 'health-threshold', threshold: 0.4 },
};

const card = (id: string, attack: number, health: number, others = []) => ({
  id,
  name: id,
  attack,
  defense: 0,
  health,
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

const payload = (others: object[]) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'P1',
    deck: [card('selkhet', 100, 100000, others as [])],
  },
  player2: { name: 'P2', deck: [card(PREY_ID, 0, 1000)] },
});

describe('LOW_HEALTH_TARGET_BONUS', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const damageAtHealth = async (healthBeforeHit: number) => {
    const steps = Object.values((await post(payload([instinct]))).body);
    const hit = (steps as any[])
      .filter((s) => s.kind === 'attack')
      .flatMap((s) => s.damages)
      .find(
        (d) =>
          d.defender.id === PREY_ID &&
          d.remainingHealth + d.damage === healthBeforeHit,
      );
    return hit.damage;
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

  it('deals the plain damage to a target at 50% health', async () => {
    expect(await damageAtHealth(500)).toBe(100);
  });

  it('deals 25% more to a target at 30% health', async () => {
    expect(await damageAtHealth(300)).toBe(125);
  });

  it('gives no bonus at the exact threshold', async () => {
    expect(await damageAtHealth(400)).toBe(100);
  });

  it('returns 400 without a threshold', () => {
    const { activationCondition: _omitted, ...incomplete } = instinct;

    return post(payload([incomplete])).expect(400);
  });

  it('returns 400 with a rate of 0', () => {
    return post(payload([{ ...instinct, rate: 0 }])).expect(400);
  });
});

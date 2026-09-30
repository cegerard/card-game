import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const laceration = (minStacks: number) => ({
  name: 'Lacération du Zéphyr',
  damages: [
    { type: 'PHYSICAL', rate: 0.6 },
    { type: 'AIR', rate: 0.4 },
  ],
  targetingStrategy: 'position-based',
  effects: [{ type: 'BLEED', rate: 0.05, duration: 5, maxStacks: 8 }],
  bleedStackBonus: { minStacks, damageType: 'PHYSICAL', multiplier: 1.2 },
});

const card = (id: string, simpleAttack: object) => ({
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
    simpleAttack,
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
});

const strike = {
  name: 'Strike',
  damages: [{ type: 'PHYSICAL', rate: 1.0 }],
  targetingStrategy: 'position-based',
};

const payload = (minStacks: number) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('scythra', laceration(minStacks))] },
  player2: { name: 'P2', deck: [card('prey', strike)] },
});

describe('Bleed stack bonus', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);

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

  it('boosts the physical part once the target bleeds from 3 stacks', async () => {
    const damages = (Object.values((await post(payload(3))).body) as any[])
      .filter((s) => s.kind === 'attack' && s.attacker?.name === 'scythra')
      .slice(0, 4)
      .map((s) => s.damages[0].damage);

    expect(damages).toEqual([100, 100, 100, 112]);
  });

  it('returns 400 with a threshold below one stack', () => {
    return post(payload(0)).expect(400);
  });
});

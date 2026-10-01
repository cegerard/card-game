import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const card = (id: string, attackEffects = [], others = []) => ({
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
      effects: attackEffects,
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const bleed = { type: 'BLEED', rate: 0.05, duration: 10, maxStacks: 20 };
const anatomy = (rate = 0.02) => ({
  kind: 'STACK_SCALING',
  name: 'Anatomie Prédatrice',
  rate,
  maxRate: 0.3,
});

const payload = (others: object[]) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('scythra', [bleed], others)] },
  player2: { name: 'P2', deck: [card('prey')] },
});

describe('STACK_SCALING skill', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);
  const damages = async (others: object[]) =>
    (Object.values((await post(payload(others))).body) as any[])
      .filter((s) => s.kind === 'attack' && s.attacker?.name === 'scythra')
      .slice(0, 3)
      .map((s) => s.damages[0].damage);

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

  it('grows the attack with every bleed stack on the board', async () => {
    expect(await damages([anatomy()])).toEqual([100, 102, 104]);
  });

  it('leaves a card without the passive at its plain attack', async () => {
    expect(await damages([])).toEqual([100, 100, 100]);
  });

  it('returns 400 without a cap', () => {
    const { maxRate: _maxRate, ...uncapped } = anatomy();

    return post(payload([uncapped])).expect(400);
  });
});

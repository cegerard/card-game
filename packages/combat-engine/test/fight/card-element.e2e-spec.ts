import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

// WATER contre FIRE : x1.8 dans la matrice élémentaire, x1.0 contre PHYSICAL.
const ATTACK = 100;
const WATER_ON_FIRE = 180;
const WATER_ON_PHYSICAL = 100;

const card = (id: string, element: string) => ({
  id,
  name: id,
  attack: ATTACK,
  defense: 0,
  health: 100000,
  speed: 100,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'WATER', rate: 1.0 }],
      energy: 1000,
      targetingStrategy: 'target-all',
    },
    simpleAttack: {
      name: 'Vague',
      damages: [{ type: 'WATER', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (defenderElement: string) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('attacker', 'WATER')] },
  player2: { name: 'P2', deck: [card('defender', defenderElement)] },
});

describe('card element', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);

  const firstHitOnDefender = (body) =>
    Object.values(body)
      .filter((step: any) => step.kind === 'attack')
      .flatMap((step: any) => step.damages)
      .find((damage: any) => damage.defender.id === 'defender');

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

  it('amplifies water damage against a fire defender', async () => {
    const response = await post(payload('FIRE'));

    expect(firstHitOnDefender(response.body)).toMatchObject({
      damage: WATER_ON_FIRE,
    });
  });

  it('leaves water damage untouched against a physical defender', async () => {
    const response = await post(payload('PHYSICAL'));

    expect(firstHitOnDefender(response.body)).toMatchObject({
      damage: WATER_ON_PHYSICAL,
    });
  });

  it('defaults to physical when the card declares no element', async () => {
    const body = payload('PHYSICAL');
    delete body.player2.deck[0].element;

    const response = await post(body);

    expect(firstHitOnDefender(response.body)).toMatchObject({
      damage: WATER_ON_PHYSICAL,
    });
  });
});

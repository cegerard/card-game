import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

// Charges its special in one action: attacks, lays a water battlefield, attacks again.
const caster = (battlefieldBonus: object) => ({
  id: 'caster',
  name: 'caster',
  attack: 100,
  defense: 0,
  health: 100000,
  speed: 50,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'STANCE',
      name: 'Tide',
      energy: 10,
      stanceActivation: { name: 'Tide', duration: 3 },
      battlefield: { name: 'Tide', duration: 3, element: 'WATER' },
    },
    simpleAttack: {
      name: 'Whip',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'position-based',
      battlefieldBonus,
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
});

const { battlefieldBonus: _none, ...plainAttack } = caster({}).skills
  .simpleAttack as Record<string, unknown>;

const foe = {
  ...caster({}),
  id: 'foe',
  name: 'foe',
  attack: 0,
  skills: {
    simpleAttack: plainAttack,
    others: [],
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 9999,
      targetingStrategy: 'position-based',
    },
  },
};

describe('battlefieldBonus through POST /fight', () => {
  let app: INestApplication;

  const fight = (battlefieldBonus: object) =>
    request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: [caster(battlefieldBonus)] },
        player2: { name: 'P2', deck: [foe] },
      });

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

  it('boosts the attack once a battlefield of that element runs', async () => {
    const response = await fight({ element: 'WATER', multiplier: 1.2 });
    const whips = Object.values(response.body as object)
      .filter((s) => s.kind === 'attack' && s.attacker.id === 'caster')
      .map((s) => s.damages[0].damage);

    expect(whips.slice(0, 2)).toEqual([100, 120]);
  });

  it('rejects a battlefield bonus without element', async () => {
    const response = await fight({ multiplier: 1.2 });

    expect(response.status).toBe(400);
  });
});

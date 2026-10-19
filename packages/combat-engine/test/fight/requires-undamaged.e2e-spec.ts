import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const SELKHET_ID = 'selkhet';
const AMBUSH = 'Embuscade Tectonique';

const ambush = (extra: object = {}) => ({
  kind: 'CONDITIONAL_ATTACK',
  name: AMBUSH,
  event: 'next-action',
  targetingStrategy: 'position-based',
  damages: [{ type: 'EARTH', rate: 1 }],
  interval: 2,
  ...extra,
});

// Its plain strike breaks on Selkhet defense; only its every-third-action
// blow wounds her, so she knows exactly when she was hurt.
const heavyBlow = {
  kind: 'CONDITIONAL_ATTACK',
  name: 'Coup Lourd',
  event: 'next-action',
  targetingStrategy: 'position-based',
  damages: [{ type: 'PHYSICAL', rate: 2 }],
  interval: 3,
};

const card = (id: string, defense: number, others: object[]) => ({
  id,
  name: id,
  attack: 100,
  defense,
  health: 100000,
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
      damages: [{ type: 'PHYSICAL', rate: 0.1 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (selkhetSkills: object[]) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card(SELKHET_ID, 50, selkhetSkills)] },
  player2: { name: 'P2', deck: [card('hunter', 0, [heavyBlow])] },
});

describe('CONDITIONAL_ATTACK requiresUndamaged', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const selkhetActions = async (selkhetSkills: object[]) => {
    const steps = Object.values((await post(payload(selkhetSkills))).body);
    return (steps as any[])
      .filter((s) => s.kind === 'attack' && s.attacker.id === SELKHET_ID)
      .map((s) => s.name);
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

  it('fires on cooldown when the condition is not required', async () => {
    const actions = await selkhetActions([ambush()]);

    expect(actions.slice(0, 5)).toEqual([
      'Griffe',
      AMBUSH,
      'Griffe',
      AMBUSH,
      'Griffe',
    ]);
  });

  it('holds back when just wounded, then fires at the first eligible turn', async () => {
    const actions = await selkhetActions([ambush({ requiresUndamaged: true })]);

    expect(actions.slice(0, 5)).toEqual([
      'Griffe',
      AMBUSH,
      'Griffe',
      'Griffe',
      AMBUSH,
    ]);
  });

  it('returns 400 on a skill kind other than CONDITIONAL_ATTACK', () => {
    return post(
      payload([
        {
          kind: 'ALTERATION',
          name: 'Instinct',
          event: 'turn-end',
          polarity: 'buff',
          buffType: 'speed',
          rate: 0.15,
          duration: 2,
          targetingStrategy: 'self',
          requiresUndamaged: true,
        },
      ]),
    ).expect(400);
  });
});

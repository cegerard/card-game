import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const LEGACY = 'Héritage de la Panthère';
const STANCE = 'Fenêtre de l’Héritage';
const FAST_ALLY = 'fast-ally';

const card = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name: id,
  attack: 0,
  defense: 0,
  health: 100000,
  speed: 100,
  agility: 0,
  accuracy: 9999,
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
      name: `${id} strike`,
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
  ...overrides,
});

const hunterInstinct = {
  kind: 'ALTERATION',
  name: 'Instinct de Chasseresse',
  event: 'fight-start',
  targetingStrategy: 'self',
  polarity: 'buff',
  buffType: 'speed',
  rate: 0.15,
  duration: 0,
  stackId: 'instinct',
  maxStacks: 3,
};

const selkhet = (withStance: boolean) =>
  card('selkhet', {
    health: 100,
    speed: 200,
    skills: {
      ...card('selkhet').skills,
      others: [
        hunterInstinct,
        hunterInstinct,
        ...(withStance
          ? [
              {
                kind: 'STANCE',
                name: STANCE,
                event: 'fight-start',
                stanceActivation: { name: STANCE, duration: 3 },
              },
            ]
          : []),
        {
          kind: 'BUFF_TRANSFER',
          name: LEGACY,
          event: 'self-death',
          targetingStrategy: 'fastest-ally',
          buffType: 'speed',
          requiresStance: STANCE,
        },
      ],
    },
  });

const payload = (withStance: boolean) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'Team Selkhet',
    deck: [
      selkhet(withStance),
      card('slow-ally', { speed: 100 }),
      card(FAST_ALLY, { speed: 150 }),
    ],
  },
  player2: {
    name: 'Team Enemy',
    deck: [card('brute', { attack: 10000, speed: 9999 })],
  },
});

describe('Héritage de la Panthère — speed buffs left to the fastest ally', () => {
  let app: INestApplication;

  const fight = async (withStance: boolean): Promise<any[]> => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload(withStance))
      .expect(200);
    return Object.values(response.body);
  };
  const transfers = (steps: any[]) =>
    steps.filter((s) => s.kind === 'buff_transferred');

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('hands the speed buffs to the fastest ally on death under the stance', async () => {
    const [transfer] = transfers(await fight(true));

    expect([transfer.target.id, transfer.alterations.length]).toEqual([
      FAST_ALLY,
      2,
    ]);
  });

  it('reports the transfer right after the death', async () => {
    const steps = await fight(true);
    const death = steps.findIndex(
      (s) => s.kind === 'status_change' && s.card.id === 'selkhet',
    );

    expect(steps[death + 1].kind).toBe('buff_transferred');
  });

  it('hands nothing over outside the stance', async () => {
    expect(transfers(await fight(false))).toEqual([]);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const AVENGER = 'avenger';
const COUNTER = 'Riposte';

const card = (id: string, attack: number, others: object[]) => ({
  id,
  name: id,
  attack,
  defense: 0,
  health: 1000,
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
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const counterOnEveryEnemy = {
  kind: 'CONDITIONAL_ATTACK',
  name: COUNTER,
  event: 'ally-health-below',
  targetCardId: AVENGER,
  activationCondition: { type: 'health-threshold', threshold: 0.9 },
  targetingStrategy: 'target-all',
  damages: [{ type: 'PHYSICAL', rate: 1 }],
};

describe('ally-health-below conditional attack with its own targetingStrategy', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
  });

  afterEach(() => app.close());

  it('strikes what that strategy returns, not only the last attacker', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: {
          name: 'P1',
          deck: [card(AVENGER, 10, [counterOnEveryEnemy])],
        },
        player2: {
          name: 'P2',
          deck: [card('hunter', 200, []), card('bystander', 10, [])],
        },
      });
    const counter = Object.values(response.body as object).find(
      (s) => s.kind === 'attack' && s.name === COUNTER,
    );

    expect(counter.damages.map((d) => d.defender.id)).toEqual([
      'hunter',
      'bystander',
    ]);
  });
});

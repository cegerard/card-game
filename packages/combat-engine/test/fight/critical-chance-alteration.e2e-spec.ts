import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const coldBlood = {
  kind: 'ALTERATION',
  name: 'Sang-froid du chasseur',
  rate: 2.5,
  duration: 0,
  buffType: 'criticalChance',
  polarity: 'buff',
  event: 'ally-health-below',
  targetCardId: 'hunter',
  activationCondition: {
    type: 'health-threshold',
    operator: 'below',
    threshold: 0.4,
  },
  targetingStrategy: 'self',
};

const card = (
  id: string,
  attack: number,
  criticalChance: number,
  others = [],
) => ({
  id,
  name: id,
  attack,
  defense: 0,
  health: 1000,
  speed: id === 'striker' ? 100 : 1,
  agility: 0,
  accuracy: 9999,
  criticalChance,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 2.0 }],
      energy: 1000,
      targetingStrategy: 'target-all',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = () => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('striker', 300, 0)] },
  player2: { name: 'P2', deck: [card('hunter', 1, 0.1, [coldBlood])] },
});

describe('critical chance alteration', () => {
  let app: INestApplication;

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

  it('buffs the card own critical chance when its health crosses the threshold', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload())
      .expect(200);

    expect(Object.values(response.body)).toContainEqual(
      expect.objectContaining({
        kind: 'buff',
        name: 'Sang-froid du chasseur',
        alterations: [
          expect.objectContaining({ kind: 'criticalChance', value: 0.25 }),
        ],
      }),
    );
  });

  it('does not buff before the health threshold is crossed', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload())
      .expect(200);

    const steps = Object.values(response.body) as any[];
    const buffIndex = steps.findIndex((s) => s.kind === 'buff');
    const damageBefore = steps
      .slice(0, buffIndex)
      .filter((s) => s.kind === 'attack' && s.attacker?.name === 'striker');

    expect(damageBefore).toHaveLength(3);
  });
});

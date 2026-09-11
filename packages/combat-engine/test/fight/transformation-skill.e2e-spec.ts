import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const frenzy = {
  kind: 'TRANSFORMATION',
  name: 'Frénésie du Grand Blanc',
  duration: 3,
  activationCondition: {
    type: 'health-threshold',
    operator: 'below',
    threshold: 0.25,
  },
  statAlterations: [
    {
      type: 'attack',
      rate: 0.35,
      duration: 3,
      polarity: 'buff',
      targetingStrategy: 'self',
    },
    {
      type: 'speed',
      rate: 0.2,
      duration: 3,
      polarity: 'buff',
      targetingStrategy: 'self',
    },
  ],
  lifestealRate: 0.1,
  statusImmunity: true,
};

const card = (id: string, attack: number, others = []) => ({
  id,
  name: id,
  attack,
  defense: 0,
  health: 1000,
  speed: id === 'striker' ? 100 : 1,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
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

const payload = (skill = frenzy) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('striker', 60)] },
  player2: { name: 'P2', deck: [card('shark', 10, [skill])] },
});

describe('TRANSFORMATION skill', () => {
  let app: INestApplication;
  let steps: any[];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload())
      .expect(200);
    steps = Object.values(response.body);
  });

  afterEach(async () => {
    await app.close();
  });

  it('starts the transformation when the health threshold is crossed', () => {
    expect(steps).toContainEqual(
      expect.objectContaining({
        kind: 'transformation_started',
        name: 'Frénésie du Grand Blanc',
        remainingTurns: 3,
      }),
    );
  });

  it('applies the transformation buffs', () => {
    const buff = steps.find((s) => s.kind === 'buff');

    expect(buff.alterations).toEqual([
      expect.objectContaining({ kind: 'attack', value: 3.5 }),
      expect.objectContaining({ kind: 'speed', value: 0.2 }),
    ]);
  });

  it('heals the transformed card on its own attacks', () => {
    const healing = steps.filter(
      (s) => s.kind === 'healing' && s.name === 'Frénésie du Grand Blanc',
    );

    expect(healing.length).toBeGreaterThan(0);
  });

  it('ends the transformation once its duration runs out', () => {
    expect(steps).toContainEqual(
      expect.objectContaining({
        kind: 'transformation_ended',
        name: 'Frénésie du Grand Blanc',
      }),
    );
  });

  it('starts the transformation only once', () => {
    const starts = steps.filter((s) => s.kind === 'transformation_started');

    expect(starts).toHaveLength(1);
  });
});

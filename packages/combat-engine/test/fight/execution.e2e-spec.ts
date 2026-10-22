import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const JUDGEMENT = 'Jugement de l’Obsidienne';

const judgement = (extra: object = {}) => ({
  kind: 'CONDITIONAL_ATTACK',
  name: JUDGEMENT,
  event: 'turn-start',
  targetingStrategy: 'position-based',
  damages: [{ type: 'EARTH', rate: 1 }],
  execution: { threshold: 0.25 },
  ...extra,
});

const card = (
  id: string,
  attack: number,
  others: object[] = [],
  special: object = {},
) => ({
  id,
  name: id,
  attack,
  defense: 0,
  health: 1000,
  speed: 100,
  agility: 0,
  accuracy: 1000,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Unused',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 9999,
      targetingStrategy: 'position-based',
      ...special,
    },
    simpleAttack: {
      name: 'Griffe',
      damages: [{ type: 'PHYSICAL', rate: 0 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (selkhet: object, prey: object = card('prey', 0)) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [selkhet] },
  player2: { name: 'P2', deck: [prey] },
});

describe('execution', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const steps = async (body: object) =>
    Object.values((await post(body)).body) as any[];
  const afterFirstStrike = async (body: object, name = JUDGEMENT) => {
    const all = await steps(body);
    const struck = all.findIndex((s) => s.name === name && s.damages);
    return all.slice(struck + 1);
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

  it('executes a target the attack left at 20% health, right after the attack', async () => {
    const [next] = await afterFirstStrike(
      payload(card('selkhet', 800, [judgement()])),
    );

    expect(next).toEqual({
      kind: 'executed',
      name: JUDGEMENT,
      attacker: expect.objectContaining({ id: 'selkhet' }),
      card: expect.objectContaining({ id: 'prey' }),
    });
  });

  it('kills the executed target in the same action', async () => {
    const rest = await afterFirstStrike(
      payload(card('selkhet', 800, [judgement()])),
    );

    expect(rest).toContainEqual(
      expect.objectContaining({ kind: 'status_change', status: 'dead' }),
    );
  });

  it('credits the attacker with the kill', async () => {
    const instinct = {
      kind: 'ALTERATION',
      name: 'Instinct de Chasseresse',
      event: 'enemy-killed',
      activationCondition: { type: 'health-threshold', threshold: 0.3 },
      polarity: 'buff',
      buffType: 'speed',
      rate: 0.15,
      duration: 0,
      targetingStrategy: 'self',
    };
    const rest = await afterFirstStrike(
      payload(card('selkhet', 800, [judgement(), instinct])),
    );

    expect(rest).toContainEqual(
      expect.objectContaining({
        kind: 'buff',
        name: 'Instinct de Chasseresse',
      }),
    );
  });

  it('spares a target the attack left above the threshold', async () => {
    const all = await steps(payload(card('selkhet', 700, [judgement()])));

    expect(all.map((s) => s.kind).slice(0, 4)).not.toContain('executed');
  });

  it('lets SURVIVE hold the target at 1 HP', async () => {
    const prey = card('prey', 0, [
      { kind: 'SURVIVE', name: 'Dernier Souffle' },
    ]);
    const [executed, survived] = await afterFirstStrike(
      payload(card('selkhet', 800, [judgement()]), prey),
    );

    expect([executed.kind, survived]).toEqual([
      'executed',
      expect.objectContaining({ kind: 'survived', name: 'Dernier Souffle' }),
    ]);
  });

  it('executes from an attack special too', async () => {
    const special = {
      name: JUDGEMENT,
      energy: 0,
      damages: [{ type: 'EARTH', rate: 1 }],
      execution: { threshold: 0.25 },
    };
    const [next] = await afterFirstStrike(
      payload(card('selkhet', 800, [], special)),
    );

    expect(next.kind).toBe('executed');
  });

  it.each([0, 1])('returns 400 on a threshold of %f', (threshold) => {
    return post(
      payload(card('selkhet', 800, [judgement({ execution: { threshold } })])),
    ).expect(400);
  });

  it('returns 400 on a skill kind other than CONDITIONAL_ATTACK', () => {
    return post(
      payload(
        card('selkhet', 800, [
          {
            kind: 'CONCEALMENT',
            name: 'Plongée',
            event: 'fight-start',
            execution: { threshold: 0.25 },
          },
        ]),
      ),
    ).expect(400);
  });
});

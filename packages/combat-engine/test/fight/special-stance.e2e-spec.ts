import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const fusion = (extra: object = {}) => ({
  kind: 'STANCE',
  name: 'Fusion Tectonique',
  energy: 10,
  stanceActivation: { name: 'fusion-tectonique', duration: 2 },
  statAlterations: [
    {
      type: 'accuracy',
      rate: 0.3,
      duration: 2,
      targetingStrategy: 'self',
      polarity: 'buff',
    },
  ],
  concealment: { duration: 2 },
  ...extra,
});

const strike = {
  kind: 'ATTACK',
  name: 'Special',
  damages: [{ type: 'PHYSICAL', rate: 1.0 }],
  energy: 1000,
  targetingStrategy: 'position-based',
};

const concealedAtStart = {
  kind: 'CONCEALMENT',
  name: 'Marche Fantôme',
  event: 'fight-start',
};

const card = (
  id: string,
  speed: number,
  special: object = strike,
  others: object[] = [],
) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 100000,
  speed,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special,
    simpleAttack: {
      name: `${id} attack`,
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const fight = (special: object) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('selkhet', 1, special), card('bait', 1)] },
  player2: { name: 'P2', deck: [card('hunter', 50)] },
});

describe('STANCE special', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const stepsOf = async (body: object) =>
    Object.values((await post(body)).body) as any[];
  const specialIndex = (all: any[]) =>
    all.findIndex((s) => s.kind === 'special_stance');

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

  it('reports the special with its caster', async () => {
    const all = await stepsOf(fight(fusion()));

    expect(all[specialIndex(all)]).toEqual(
      expect.objectContaining({
        name: 'Fusion Tectonique',
        caster: expect.objectContaining({ id: 'selkhet' }),
        energy: 0,
      }),
    );
  });

  it('follows it with the stance, the buff and the concealment', async () => {
    const all = await stepsOf(fight(fusion()));
    const index = specialIndex(all);

    expect(all.slice(index + 1, index + 4).map((s) => s.kind)).toEqual([
      'stance_started',
      'buff',
      'concealment_started',
    ]);
  });

  it('strikes nobody', async () => {
    const all = await stepsOf(fight(fusion()));

    expect(all[specialIndex(all)].damages).toBeUndefined();
  });

  it('keeps the caster out of reach until its concealment ends', async () => {
    const all = await stepsOf(fight(fusion()));
    const index = specialIndex(all);
    const end = all.findIndex(
      (s, i) => i > index && s.kind === 'concealment_ended',
    );
    const hitOnSelkhet = all
      .slice(index, end)
      .some((s) => (s.damages ?? []).some((d) => d.defender.id === 'selkhet'));

    expect(hitOnSelkhet).toBe(false);
  });

  it('lets a revealing stance strike a concealed enemy', async () => {
    const seer = fusion({
      statAlterations: undefined,
      concealment: undefined,
      stanceActivation: {
        name: 'sens-sismique',
        duration: 3,
        revealsConcealed: true,
      },
    });
    const body = {
      cardSelectorStrategy: 'player-by-player',
      player1: {
        name: 'P1',
        deck: [card('seer', 1, seer, [concealedAtStart])],
      },
      player2: {
        name: 'P2',
        deck: [card('hidden', 1, strike, [concealedAtStart])],
      },
    };
    const all = await stepsOf(body);
    const firstSeerAttack = all
      .slice(specialIndex(all))
      .find((s) => s.kind === 'attack' && s.attacker.id === 'seer');

    expect(firstSeerAttack.damages[0].defender.id).toBe('hidden');
  });

  it.each([
    ['damages', { damages: [{ type: 'PHYSICAL', rate: 1 }] }],
    ['targetingStrategy', { targetingStrategy: 'target-all' }],
    ['a missing stanceActivation', { stanceActivation: undefined }],
  ])('returns 400 with %s', (_case, extra) => {
    return post(fight(fusion(extra))).expect(400);
  });

  it('returns 400 when a striking special conceals its caster', () => {
    return post(fight({ ...strike, concealment: { duration: 2 } })).expect(400);
  });
});

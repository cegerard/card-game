import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const stackedPoison = {
  type: 'POISON',
  rate: 0.03,
  duration: 3,
  maxStacks: 3,
  stackMultiplier: 2,
};

const card = (
  id: string,
  { effects = [], others = [] }: { effects?: object[]; others?: object[] } = {},
) => ({
  id,
  name: id,
  attack: 10,
  defense: 6,
  health: 100,
  speed: 3,
  agility: 25,
  accuracy: 15,
  criticalChance: 0.05,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 2.0 }],
      energy: 100,
      targetingStrategy: 'target-all',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
      effects,
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

describe('EffectDto validation', () => {
  let app: INestApplication;

  const post = (deck: object[]) =>
    request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck },
        player2: { name: 'P2', deck: [card('card-b')] },
      });
  const withEffect = (effect: object) => [
    card('card-a', { effects: [effect] }),
  ];

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

  describe('fields reserved to the stacked poison', () => {
    it.each(['BURN', 'FREEZE', 'STUNT'])('refuses maxStacks on a %s', (type) =>
      post(withEffect({ type, rate: 0.1, level: 1, maxStacks: 3 })).expect(400),
    );

    it('refuses a stackMultiplier on a bleed', () =>
      post(
        withEffect({
          type: 'BLEED',
          rate: 0.1,
          duration: 3,
          maxStacks: 3,
          stackMultiplier: 2,
        }),
      ).expect(400));

    it('refuses a stackMultiplier on a level poison', () =>
      post(
        withEffect({ type: 'POISON', rate: 0.1, level: 1, stackMultiplier: 2 }),
      ).expect(400));

    it('refuses ignoresImmunity on a burn', () =>
      post(
        withEffect({
          type: 'BURN',
          rate: 0.1,
          level: 1,
          ignoresImmunity: true,
        }),
      ).expect(400));

    it('refuses a level on a stacked poison', () =>
      post(withEffect({ ...stackedPoison, level: 2 })).expect(400));

    it('accepts a stacked poison with its own fields', () =>
      post(withEffect({ ...stackedPoison, ignoresImmunity: true })).expect(
        200,
      ));
  });

  describe('effect of a CONDITIONAL_ATTACK', () => {
    const counter = (effect: object | null) => ({
      kind: 'CONDITIONAL_ATTACK',
      name: 'Counter',
      event: 'turn-end',
      interval: 1,
      targetingStrategy: 'position-based',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      effect,
    });

    it('still accepts a null effect', () =>
      post([card('card-a', { others: [counter(null)] })]).expect(200));
  });

  describe('AFFLICTION', () => {
    const affliction = (effect: object | null) => ({
      kind: 'AFFLICTION',
      name: 'Venom',
      event: 'turn-end',
      targetingStrategy: 'target-all',
      effect,
    });

    it('refuses a null effect', () =>
      post([card('card-a', { others: [affliction(null)] })]).expect(400));

    it('accepts a stacked poison', () =>
      post([card('card-a', { others: [affliction(stackedPoison)] })]).expect(
        200,
      ));
  });

  describe('WEAK_POINT', () => {
    const weakPoint = (fields: object = {}) => ({
      type: 'WEAK_POINT',
      rate: 0,
      weakPoint: { name: 'Marque', ...fields },
    });

    it('refuses a weak point without its description', () =>
      post(withEffect({ type: 'WEAK_POINT', rate: 0 })).expect(400));

    it('refuses a weak point description on another effect', () =>
      post(
        withEffect({
          type: 'BURN',
          rate: 0.1,
          level: 1,
          weakPoint: { name: 'Marque' },
        }),
      ).expect(400));

    it('refuses a duration outside the weak point description', () =>
      post(withEffect({ ...weakPoint(), duration: 2 })).expect(400));

    it('refuses an exploit effect on a weak point never consumed', () =>
      post(
        withEffect(
          weakPoint({
            exploitEffect: { type: 'HYPOTHERMIA', rate: 0.15, duration: 3 },
          }),
        ),
      ).expect(400));

    it('accepts a consumable weak point with its exploit effect', () =>
      post(
        withEffect(
          weakPoint({
            consumable: true,
            exploitEffect: { type: 'HYPOTHERMIA', rate: 0.15, duration: 3 },
          }),
        ),
      ).expect(200));
  });

  describe('HYPOTHERMIA', () => {
    it('refuses a hypothermia without duration', () =>
      post(withEffect({ type: 'HYPOTHERMIA', rate: 0.15 })).expect(400));
  });

  describe('FREEZE duration', () => {
    it('refuses a duration below one turn', () =>
      post(
        withEffect({ type: 'FREEZE', rate: 0.2, level: 1, duration: 0 }),
      ).expect(400));
  });

  describe('Svana skills', () => {
    const analysis = (fields: object = {}) => ({
      kind: 'ANALYSIS',
      name: 'Analyse',
      event: 'enemy-attack',
      effect: {
        type: 'WEAK_POINT',
        rate: 0,
        weakPoint: { name: 'Point Faible' },
      },
      ...fields,
    });

    it('refuses an ANALYSIS without its charge cap', () =>
      post([card('card-a', { others: [analysis()] })]).expect(400));

    it('accepts an ANALYSIS with its charge cap', () =>
      post([card('card-a', { others: [analysis({ maxStacks: 3 })] })]).expect(
        200,
      ));

    it('refuses an AFTERSHOCK without damages', () =>
      post([
        card('card-a', {
          others: [
            { kind: 'AFTERSHOCK', name: 'Cristaux', event: 'after-attack' },
          ],
        }),
      ]).expect(400));

    it('refuses a weakPointPenetration outside a CONDITIONAL_ATTACK', () =>
      post([
        card('card-a', {
          others: [
            {
              kind: 'REAL_DAMAGE',
              name: 'Zone',
              rate: 0.1,
              event: 'turn-end',
              targetingStrategy: 'target-all',
              weakPointPenetration: 0.4,
            },
          ],
        }),
      ]).expect(400));

    it('refuses a criticalDamageRate outside a TRANSFORMATION', () =>
      post([
        card('card-a', {
          others: [
            {
              kind: 'REAL_DAMAGE',
              name: 'Zone',
              rate: 0.1,
              event: 'turn-end',
              targetingStrategy: 'target-all',
              criticalDamageRate: 0.3,
            },
          ],
        }),
      ]).expect(400));
  });
});

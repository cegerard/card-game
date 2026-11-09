import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const STANCE_SPECIAL = {
  kind: 'STANCE',
  name: 'Cercle',
  energy: 100,
  stanceActivation: { name: 'cercle', duration: 2 },
};

const card = (id: string, others: object[] = [], special: object = {}) => ({
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
      ...special,
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

const payload = (others: object[] = [], special: object = {}) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('card-a', others, special)] },
  player2: { name: 'P2', deck: [card('card-b')] },
});

const support = (fields: object = {}) => ({
  kind: 'SUPPORT',
  name: 'Bourrasque',
  event: 'next-action',
  targetingStrategy: 'lowest-health-ally',
  interval: 3,
  shield: { rate: 0.4, duration: 2 },
  ...fields,
});

const colonySpirit = (fields: object = {}) => ({
  kind: 'ALTERATION',
  name: 'Esprit',
  event: 'fight-start',
  targetingStrategy: 'self',
  polarity: 'buff',
  buffType: 'attack',
  rate: 0.05,
  duration: 0,
  ...fields,
});

const storm = (fields: object = {}) => ({
  kind: 'TRANSFORMATION',
  name: 'Tempête',
  duration: 3,
  activationCondition: {
    type: 'health-threshold',
    operator: 'below',
    threshold: 0.4,
  },
  battlefield: { name: 'Tempête', duration: 3 },
  ...fields,
});

describe('Colony mechanics validation', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);

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

  describe('SUPPORT', () => {
    it('accepts a support with an interval', () =>
      post(payload([support()])).expect(200));

    it('returns 400 for a support that does nothing', () =>
      post(payload([support({ shield: undefined })])).expect(400));

    it('returns 400 when another kind carries a cleanse', () =>
      post(payload([colonySpirit({ cleanse: 1 })])).expect(400));
  });

  describe('ENERGY_GAIN', () => {
    const energy = (fields: object = {}) => ({
      kind: 'ENERGY_GAIN',
      name: 'Souffle',
      event: 'ally-skill-used',
      amount: 3,
      ...fields,
    });

    it('accepts a gain without targeting', () =>
      post(payload([energy()])).expect(200));

    it('returns 400 without an amount', () =>
      post(payload([energy({ amount: undefined })])).expect(400));

    it('returns 400 when another kind carries an amount', () =>
      post(payload([colonySpirit({ amount: 3 })])).expect(400));
  });

  describe('ALTERATION live rates', () => {
    it('accepts a rate per living ally', () =>
      post(payload([colonySpirit({ perLivingAlly: { maxRate: 0.2 } })])).expect(
        200,
      ));

    it('returns 400 when it combines both live rates', () =>
      post(
        payload([
          colonySpirit({
            perLivingAlly: { maxRate: 0.2 },
            whileHealthBelow: 0.3,
          }),
        ]),
      ).expect(400));

    it('returns 400 for a health ceiling above 1', () =>
      post(payload([colonySpirit({ whileHealthBelow: 1.5 })])).expect(400));
  });

  describe('battlefield', () => {
    it('accepts a battlefield on a STANCE special', () =>
      post(
        payload([], {
          ...STANCE_SPECIAL,
          damages: undefined,
          targetingStrategy: undefined,
          battlefield: { name: 'Cercle', duration: 2 },
        }),
      ).expect(200));

    it('returns 400 for a battlefield on an ATTACK special', () =>
      post(
        payload([], { battlefield: { name: 'Cercle', duration: 2 } }),
      ).expect(400));

    it('returns 400 for a battlefield lasting no turn', () =>
      post(
        payload([storm({ battlefield: { name: 'Tempête', duration: 0 } })]),
      ).expect(400));

    it('returns 400 when another kind than TRANSFORMATION lays one', () =>
      post(
        payload([
          colonySpirit({ battlefield: { name: 'Tempête', duration: 3 } }),
        ]),
      ).expect(400));

    it('returns 400 for an ally activation event without its threshold', () =>
      post(
        payload([storm({ activationEvent: 'any-ally-health-below' })]),
      ).expect(400));

    it('accepts an ally activation event with its threshold', () =>
      post(
        payload([
          storm({
            activationEvent: 'any-ally-health-below',
            activationEventThreshold: 0.25,
          }),
        ]),
      ).expect(200));
  });
});

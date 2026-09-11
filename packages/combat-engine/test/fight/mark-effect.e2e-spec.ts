import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const markEffect = {
  type: 'MARK',
  rate: 0.05,
  damageType: 'WATER',
  maxStacks: 5,
};

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 100000,
  speed: 10,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'WATER', rate: 2.0 }],
      energy: 1000,
      targetingStrategy: 'target-all',
    },
    simpleAttack: {
      name: 'Tidal Fangs',
      damages: [{ type: 'WATER', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others: [],
    ...overrides,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (attackerSkills = {}) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('marker', attackerSkills)] },
  player2: { name: 'P2', deck: [card('marked')] },
});

const simpleAttackWith = (effects) => ({
  simpleAttack: {
    name: 'Tidal Fangs',
    damages: [{ type: 'WATER', rate: 1.0 }],
    targetingStrategy: 'position-based',
    effects,
  },
});

const markingSpecial = {
  special: {
    kind: 'ATTACK',
    name: 'Abysses Impitoyables',
    damages: [{ type: 'WATER', rate: 1.0 }],
    energy: 0,
    targetingStrategy: 'target-all',
    effect: { ...markEffect, stacks: 2 },
    markedTargetBonus: { damageType: 'WATER', multiplier: 1.3 },
  },
};

const comboAttack = {
  others: [
    {
      kind: 'CONDITIONAL_ATTACK',
      name: 'Tourbillon Carnassier',
      event: 'next-action',
      interval: 1,
      hits: 2,
      damages: [{ type: 'PHYSICAL', rate: 0.35 }],
      comboFinisher: [{ type: 'WATER', rate: 0.9 }],
      comboFinisherEffects: [{ ...markEffect, stacks: 2 }],
      targetingStrategy: 'position-based',
    },
  ],
};

describe('MARK effect', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);

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

  describe('applied by a simple attack', () => {
    it('emits a mark_applied step on hit', async () => {
      const response = await post(payload(simpleAttackWith([markEffect])));

      expect(Object.values(response.body)).toContainEqual(
        expect.objectContaining({
          kind: 'mark_applied',
          damageType: 'WATER',
          stacks: 1,
        }),
      );
    });

    it('amplifies the marked damage type on the following hits', async () => {
      const response = await post(payload(simpleAttackWith([markEffect])));

      const damages = (Object.values(response.body) as any[])
        .filter((s) => s.kind === 'attack' && s.attacker?.name === 'marker')
        .map((s) => s.damages[0].damage);

      expect(damages.slice(0, 3)).toEqual([100, 105, 110]);
    });

    it('returns 400 when a mark effect has no damageType', () => {
      const { damageType: _damageType, ...withoutDamageType } = markEffect;

      return post(payload(simpleAttackWith([withoutDamageType]))).expect(400);
    });

    it('returns 400 when a non-mark effect has no level', () => {
      return post(
        payload(simpleAttackWith([{ type: 'POISON', rate: 0.2 }])),
      ).expect(400);
    });
  });

  describe('applied by a special attack with a marked target bonus', () => {
    it('amplifies the special against an already marked target', async () => {
      const response = await post(payload(markingSpecial));

      const damages = (Object.values(response.body) as any[])
        .filter(
          (s) => s.kind === 'special_attack' && s.attacker?.name === 'marker',
        )
        .map((s) => s.damages[0].damage);

      expect(damages.slice(0, 3)).toEqual([100, 143, 156]);
    });

    it('returns 400 when the marked target bonus multiplier is zero', () => {
      const zeroBonus = {
        special: {
          ...markingSpecial.special,
          markedTargetBonus: { damageType: 'WATER', multiplier: 0 },
        },
      };

      return post(payload(zeroBonus)).expect(400);
    });
  });

  describe('applied by a combo finisher', () => {
    it('marks the target on the finisher hit only', async () => {
      const response = await post(payload(comboAttack));

      const markSteps = (Object.values(response.body) as any[]).filter(
        (s) => s.kind === 'mark_applied',
      );

      expect(markSteps[0]).toEqual({
        kind: 'mark_applied',
        card: expect.objectContaining({ name: 'marked' }),
        damageType: 'WATER',
        stacks: 2,
      });
    });
  });
});

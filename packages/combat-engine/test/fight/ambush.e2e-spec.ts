import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const SELKHET_ID = 'selkhet';
const DIVE = 'Embuscade Tectonique';
const STRIKE = 'Embuscade Tectonique — frappe';
const UNDERGROUND = 'Sous terre';

const dive = {
  kind: 'CONCEALMENT',
  name: DIVE,
  event: 'next-action',
  interval: 4,
  requiresUndamaged: true,
  stanceActivation: { name: UNDERGROUND, duration: 1 },
};

const strike = {
  kind: 'CONDITIONAL_ATTACK',
  name: STRIKE,
  event: 'turn-start',
  targetingStrategy: 'position-based',
  requiresStance: UNDERGROUND,
  endsStance: true,
  damages: [
    { type: 'PHYSICAL', rate: 1.5 },
    { type: 'EARTH', rate: 0.8 },
  ],
  effect: { type: 'STUNT', rate: 0, level: 1 },
  hitAlterations: [
    { type: 'defense', rate: 0.3, duration: 2, polarity: 'debuff' },
  ],
};

const card = (id: string, attack: number, defense: number, others = []) => ({
  id,
  name: id,
  attack,
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
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

// An enemy whose blows break on Selkhet defense leaves her undamaged.
const payload = (enemyAttack: number) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'P1',
    deck: [card(SELKHET_ID, 100, 50, [dive, strike] as [])],
  },
  player2: { name: 'P2', deck: [card('prey', enemyAttack, 0)] },
});

describe('Embuscade Tectonique', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const steps = async (enemyAttack: number) =>
    Object.values((await post(payload(enemyAttack))).body) as any[];

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

  // Selkhet's own turns: a dive, the strike it brings, or a plain attack.
  const selkhetTimeline = (all: any[]) =>
    all
      .filter(
        (s) =>
          (s.kind === 'attack' && s.attacker.id === SELKHET_ID) ||
          (s.kind === 'concealment_started' && s.card.id === SELKHET_ID),
      )
      .map((s) => (s.kind === 'attack' ? s.name : 'dive'));

  describe('when Selkhet is never wounded', () => {
    let all: any[];

    beforeEach(async () => {
      all = await steps(10);
    });

    it('dives on its cooldown and strikes at the next turn', () => {
      expect(selkhetTimeline(all).slice(0, 11)).toEqual([
        'Griffe',
        'Griffe',
        'Griffe',
        'dive',
        STRIKE,
        'Griffe',
        'Griffe',
        'Griffe',
        'dive',
        STRIKE,
        'Griffe',
      ]);
    });

    it('opens the stance with the dive', () => {
      const dived = all.findIndex((s) => s.kind === 'concealment_started');

      expect(all[dived + 1]).toEqual(
        expect.objectContaining({ kind: 'stance_started', name: UNDERGROUND }),
      );
    });

    it('cannot be targeted while underground', () => {
      const dived = all.findIndex((s) => s.kind === 'concealment_started');
      const enemyAttack = all
        .slice(dived)
        .find((s) => s.kind === 'attack' && s.attacker.id === 'prey');

      expect(enemyAttack.damages).toEqual([]);
    });

    it('stuns the target of the strike', () => {
      expect(all).toContainEqual(
        expect.objectContaining({
          kind: 'status_change',
          status: 'stunt',
          card: expect.objectContaining({ id: 'prey' }),
        }),
      );
    });

    it('fractures the defense of the target of the strike', () => {
      const fracture = all.find(
        (s) => s.kind === 'debuff' && s.name === STRIKE,
      );

      expect(fracture.alterations[0]).toEqual(
        expect.objectContaining({ kind: 'defense', remainingTurns: 2 }),
      );
    });

    it('closes the stance with the strike', () => {
      const struck = all.findIndex(
        (s) => s.kind === 'attack' && s.name === STRIKE,
      );

      expect(all.slice(struck, struck + 4)).toContainEqual(
        expect.objectContaining({ kind: 'stance_ended', name: UNDERGROUND }),
      );
    });
  });

  it('never dives when just wounded', async () => {
    expect(selkhetTimeline(await steps(100))).not.toContain('dive');
  });

  it('returns 400 when endsStance comes without requiresStance', () => {
    const { requiresStance: _omitted, ...unbound } = strike;

    return post({
      ...payload(10),
      player1: {
        name: 'P1',
        deck: [card(SELKHET_ID, 100, 50, [dive, unbound] as [])],
      },
    }).expect(400);
  });

  it('returns 400 when endsStance is carried by another kind', () => {
    return post({
      ...payload(10),
      player1: {
        name: 'P1',
        deck: [
          card(SELKHET_ID, 100, 50, [{ ...dive, endsStance: true }] as []),
        ],
      },
    }).expect(400);
  });
});

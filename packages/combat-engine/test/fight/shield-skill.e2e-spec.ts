import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('SHIELD skill — reactive health-threshold trigger', () => {
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

  it('accepts SHIELD skill payload and returns 200', async () => {
    await request(app.getHttpServer())
      .post('/fight')
      .send(buildShieldPayload())
      .expect(200);
  });

  it('shield_applied step for Kaelion exists after the attack that crosses the HP threshold', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildShieldPayload())
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];

    const attackIndex = stepEntries.findIndex(
      ([, s]) =>
        s.kind === 'attack' &&
        s.damages?.some(
          (d: any) => d.defender?.name === 'Kaelion' && d.remainingHealth < 300,
        ),
    );
    expect(attackIndex).toBeGreaterThan(-1);

    const shieldIndex = stepEntries.findIndex(
      ([, s]) => s.kind === 'shield_applied' && s.source?.name === 'Kaelion',
    );
    expect(shieldIndex).toBeGreaterThan(attackIndex);
  });

  it('does not emit shield_applied when HP stays above threshold', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildShieldPayloadHighDefense())
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];
    const hasShield = stepEntries.some(([, s]) => s.kind === 'shield_applied');

    expect(hasShield).toBe(false);
  });
});

function buildShieldPayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Attacker Team',
      deck: [
        {
          id: 'arionis',
          name: 'Arionis',
          attack: 720,
          defense: 0,
          health: 5000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Super Attack',
              damages: [{ type: 'PHYSICAL', rate: 1 }],
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Strike',
              damages: [{ type: 'PHYSICAL', rate: 1 }],
              targetingStrategy: 'position-based',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
    player2: {
      name: 'Kaelion Team',
      deck: [
        {
          id: 'kaelion',
          name: 'Kaelion',
          attack: 1,
          defense: 0,
          health: 1000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'HEALING',
              name: 'Heal',
              rate: 0,
              energy: 9999,
              targetingStrategy: 'self',
            },
            simpleAttack: {
              name: 'Weak Strike',
              damages: [{ type: 'PHYSICAL', rate: 0.01 }],
              targetingStrategy: 'position-based',
            },
            others: [
              {
                kind: 'SHIELD',
                name: 'Résilience Pyro-Minérale',
                rate: 0.3,
                targetingStrategy: 'self',
                activationCondition: {
                  type: 'health-threshold',
                  operator: 'below',
                  threshold: 0.3,
                },
              },
            ],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
  };
}

function buildShieldPayloadHighDefense() {
  const base = buildShieldPayload();
  // High defense prevents significant damage — HP stays above threshold
  base.player2.deck[0].defense = 5000;
  return base;
}

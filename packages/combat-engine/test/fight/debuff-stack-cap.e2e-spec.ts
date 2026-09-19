import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const AEGIS_ID = 'aegis-01';
const ALLY_ID = 'ally-01';
const ENEMY_ID = 'enemy-01';
const STACK_ID = 'enlisement';
const MAX_STACKS = 3;

// Aegis slows on every hit he lands, and an ally slows on the same pile.
// Together they must never push the enemy past MAX_STACKS of Enlisement.
function slowOnHit() {
  return {
    type: 'MARK',
    rate: 0,
    damageType: 'EARTH',
    maxStacks: 99,
    probability: 1,
    triggeredDebuff: {
      debuffType: 'speed',
      debuffRate: 0.1,
      duration: 99,
      probability: 1,
      stackId: STACK_ID,
      maxStacks: MAX_STACKS,
    },
  };
}

function slower(id: string, name: string) {
  return {
    id,
    name,
    attack: 100,
    defense: 0,
    health: 50000,
    speed: 100,
    agility: 0,
    accuracy: 100,
    criticalChance: 0,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Unused',
        damages: [{ type: 'EARTH', rate: 1 }],
        energy: 9999,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: `${name} strike`,
        damages: [{ type: 'PHYSICAL', rate: 0.7 }],
        targetingStrategy: 'target-all',
        effects: [slowOnHit()],
      },
      others: [],
    },
    behaviors: { dodge: 'simple-dodge' },
  };
}

function buildPayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Team Aegis',
      deck: [slower(AEGIS_ID, 'Aegis'), slower(ALLY_ID, 'Ally')],
    },
    player2: {
      name: 'Team Enemy',
      deck: [
        {
          id: ENEMY_ID,
          name: 'Enemy',
          attack: 10,
          defense: 0,
          health: 50000,
          speed: 100,
          agility: 0,
          accuracy: 100,
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
              name: 'Smash',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
              targetingStrategy: 'position-based',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
  };
}

describe('debuff stack cap — two sources sharing one pile', () => {
  let app: any;
  let stepEntries: [string, any][];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildPayload())
      .expect(200);

    stepEntries = Object.entries(response.body) as [string, any][];
  });

  afterAll(async () => {
    await app.close();
  });

  function speedDebuffsOnEnemy(): any[] {
    return stepEntries
      .filter(([, s]) => s.kind === 'debuff')
      .flatMap(([, s]) => s.alterations ?? [])
      .filter((a: any) => a.target.id === ENEMY_ID && a.kind === 'speed');
  }

  function hitsOnEnemy(): any[] {
    return stepEntries.flatMap(([, s]) =>
      (s.damages ?? []).filter(
        (d: any) => d.defender.id === ENEMY_ID && !d.dodge,
      ),
    );
  }

  it('lands more hits than the cap allows stacks', () => {
    expect(hitsOnEnemy().length).toBeGreaterThan(MAX_STACKS);
  });

  it('never reports more debuffs than the shared cap', () => {
    expect(speedDebuffsOnEnemy()).toHaveLength(MAX_STACKS);
  });

  it('reports no debuff step for a refused application', () => {
    const refused = hitsOnEnemy().length - MAX_STACKS;
    expect(refused).toBeGreaterThan(0);
  });
});

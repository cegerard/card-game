import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const scythra = JSON.parse(
  readFileSync(join(__dirname, '../../samples/cards.json'), 'utf-8'),
).find((card) => card.id === 'scythra');

// Only bleeding can hurt this prey: its defense swallows every hit, critical
// ones included, so the fight is the same from one run to the next.
const prey = (attack: number) => ({
  id: 'prey',
  name: 'prey',
  attack,
  defense: 2000,
  health: 200,
  speed: 60,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'EARTH',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 1000,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
});

describe('Scythra full kit', () => {
  let app: INestApplication;

  const fightAgainst = async (preyAttack: number) => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: [scythra] },
        player2: { name: 'P2', deck: [prey(preyAttack)] },
      })
      .expect(200);
    return Object.values(response.body) as any[];
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

  describe('when she outlasts a prey that bleeds out', () => {
    let steps: any[];

    const named = (name: string) => steps.filter((s) => s.name === name);

    beforeEach(async () => {
      steps = await fightAgainst(70);
    });

    it('lacerates with Lacération du Zéphyr', () => {
      expect(named('Lacération du Zéphyr').length).toBeGreaterThan(0);
    });

    it('makes her prey bleed', () => {
      expect(
        steps.some((s) => s.kind === 'status_change' && s.status === 'bleed'),
      ).toBe(true);
    });

    it('keeps 10 energy after Dissection Éolienne', () => {
      expect(named('Dissection Éolienne')[0].energy).toBe(10);
    });

    it('enters Lames du Vent Rouge', () => {
      expect(
        steps.some(
          (s) => s.kind === 'stance_started' && s.name === 'vent-rouge',
        ),
      ).toBe(true);
    });

    it('speeds up with Lames du Vent Rouge', () => {
      expect(named('Lames du Vent Rouge').some((s) => s.kind === 'buff')).toBe(
        true,
      );
    });

    it('detonates the stacks with Exsanguination Totale', () => {
      expect(
        named('Exsanguination Totale')[0].damages[0].consumedBleedStacks,
      ).toBeGreaterThanOrEqual(5);
    });

    it('spreads Vent Écarlate', () => {
      expect(named('Vent Écarlate').length).toBeGreaterThan(0);
    });

    it('inflicts Choc Hémorragique', () => {
      expect(named('Choc Hémorragique').length).toBeGreaterThan(0);
    });

    it('heals with Anatomie Prédatrice when the prey bleeds out', () => {
      expect(
        named('Anatomie Prédatrice').some((s) => s.kind === 'healing'),
      ).toBe(true);
    });

    it('wins the fight', () => {
      expect(steps[steps.length - 1].winner).toBe('P1');
    });
  });

  describe('when she falls during her predatory trance', () => {
    it('leaves Héritage sanglant behind', async () => {
      const steps = await fightAgainst(100);

      expect(steps.some((s) => s.name === 'Héritage sanglant')).toBe(true);
    });
  });
});

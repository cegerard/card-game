import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const sampleCards = JSON.parse(
  readFileSync(join(__dirname, '../../samples/cards.json'), 'utf-8'),
);

describe('samples/cards.json', () => {
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
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: sampleCards },
        player2: { name: 'P2', deck: sampleCards },
      })
      .expect(200);
    steps = Object.values(response.body);
  });

  afterEach(async () => {
    await app.close();
  });

  // `all-owner-cards` targets the living cards, so what a team-wide shield
  // should cover depends on who is still standing when it lands, not on the
  // deck size. The sample deck fights itself with real dodges, criticals and
  // probabilities, so an ally can fall before the special is charged.
  const teamOf = (card: any) => card.deckIdentity.split('-')[0];

  function livingTeammatesAt(stepIndex: number, team: string): number {
    const fallen = new Set(
      steps
        .slice(0, stepIndex)
        .filter(
          (s) =>
            s.kind === 'status_change' &&
            s.status === 'dead' &&
            teamOf(s.card) === team,
        )
        .map((s) => s.card.deckIdentity),
    );

    return sampleCards.length - fallen.size;
  }

  it('is a deck the engine accepts and can fight with', () => {
    expect(steps.length).toBeGreaterThan(0);
  });

  it('lets Kaito mark his target with soak', () => {
    const marks = steps.filter(
      (s) => s.kind === 'mark_applied' && s.damageType === 'WATER',
    );

    expect(marks.length).toBeGreaterThan(0);
  });

  it('lets Aegis shield his whole team with Forteresse des Âges', () => {
    const shields = steps.filter(
      (s) => s.kind === 'shield_applied' && s.name === 'Forteresse des Âges',
    );

    expect(shields.length).toBeGreaterThan(0);
  });

  it('shields every living card of the caster team at once', () => {
    const index = steps.findIndex(
      (s) => s.kind === 'shield_applied' && s.name === 'Forteresse des Âges',
    );
    const shield = steps[index];

    expect(shield.targets.length).toBe(
      livingTeammatesAt(index, teamOf(shield.source)),
    );
  });

  it('lets Aegis counter the card that hit him', () => {
    const counters = steps.filter(
      (s) => s.kind === 'attack' && s.name === 'Contre-attaque défensive',
    );

    expect(counters.length).toBeGreaterThan(0);
  });

  it('replaces the normal attack with Vagues de Pierre on its interval', () => {
    const waves = steps.filter(
      (s) => s.kind === 'attack' && s.name === 'Vagues de Pierre',
    );

    expect(waves.length).toBeGreaterThan(0);
  });

  it('keeps Endurance séculaire up while Aegis is above the threshold', () => {
    const buffs = steps.filter(
      (s) => s.kind === 'buff' && s.name === 'Endurance séculaire',
    );

    expect(buffs.length).toBeGreaterThan(0);
  });

  it('opens the Forteresse des Âges stance with the special', () => {
    const stances = steps.filter(
      (s) => s.kind === 'stance_started' && s.name === 'forteresse-des-ages',
    );

    expect(stances.length).toBeGreaterThan(0);
  });

  it('holds the counter attack back until the stance is open', () => {
    const firstStance = steps.findIndex((s) => s.kind === 'stance_started');
    const firstCounter = steps.findIndex(
      (s) => s.kind === 'attack' && s.name === 'Contre-attaque défensive',
    );

    expect(firstCounter).toBeGreaterThan(firstStance);
  });
});

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

  it('is a deck the engine accepts and can fight with', () => {
    expect(steps.length).toBeGreaterThan(0);
  });

  it('lets Kaito mark his target with soak', () => {
    const marks = steps.filter(
      (s) => s.kind === 'mark_applied' && s.damageType === 'WATER',
    );

    expect(marks.length).toBeGreaterThan(0);
  });
});

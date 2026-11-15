import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

// Dodges, criticals, effect probabilities and the speed-weighted order all
// roll, so two unseeded fights of these decks almost never match.
const roster: any[] = JSON.parse(
  readFileSync(join(__dirname, '../../samples/cards.json'), 'utf-8'),
);
const deck = roster.filter((card) =>
  ['arionis', 'kaelion', 'kaito', 'aegis', 'scythra'].includes(card.id),
);

describe('POST /fight with a seed', () => {
  let app: INestApplication;

  const fight = (seed: unknown) =>
    request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'speed-weighted',
        player1: { name: 'P1', deck },
        player2: { name: 'P2', deck },
        seed,
      });

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

  it('replays the same fight for the same seed', async () => {
    const first = await fight(1234).expect(200);
    const second = await fight(1234).expect(200);

    expect(second.body).toEqual(first.body);
  });

  it('plays another fight for another seed', async () => {
    const first = await fight(1234).expect(200);
    const second = await fight(5678).expect(200);

    expect(second.body).not.toEqual(first.body);
  });

  it.each([-1, 1.5, 2 ** 32, 'abc'])('refuses the seed %p', async (seed) => {
    await fight(seed).expect(400);
  });
});

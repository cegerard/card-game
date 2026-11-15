import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { toCombatConfig, type CardConfig } from '@card-game/shared-types';
import { AppModule } from '../../src/app.module';
import {
  CHARACTER_ROSTER,
  DEFAULT_DECK_IDS,
} from '../../../../clients/gasha/src/lib/deck/roster';
import { ARCADE_LEVELS } from '../../../../clients/gasha/src/lib/arcade/levels';

// The engine refuses unknown fields (forbidNonWhitelisted), so the gasha
// roster and arcade levels must fight exactly as the client sends them
// (clients/gasha/src/lib/combat/engine-client.ts).
const defaultDeck = CHARACTER_ROSTER.filter((card) =>
  DEFAULT_DECK_IDS.includes(card.id),
).map(toCombatConfig);

describe('POST /fight accepts what gasha sends', () => {
  let app: INestApplication;

  const fight = (playerDeck: CardConfig[], enemyDeck: CardConfig[]) =>
    request(app.getHttpServer())
      .post('/fight')
      .send({
        player1: { name: 'Player', deck: playerDeck },
        player2: { name: 'Enemy', deck: enemyDeck },
        cardSelectorStrategy: 'speed-weighted',
        seed: 42,
      });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(CHARACTER_ROSTER.map((card) => [card.id, card]))(
    'fights the roster card %s',
    async (_id, card) => {
      const deck = [toCombatConfig(card)];

      await fight(deck, deck).expect(200);
    },
  );

  it.each(ARCADE_LEVELS.map((level) => [level.name, level]))(
    'fights %s against the default deck',
    async (_name, level) => {
      await fight(defaultDeck, level.enemyTeam.map(toCombatConfig)).expect(200);
    },
  );
});

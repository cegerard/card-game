# Database

None. The simulator is stateless and in-memory: `POST /fight` converts DTOs to domain objects, simulates the fight and returns the `FightResult`; nothing persists between requests.

If persistence is ever needed: player decks, fight history/replays, card collection, leaderboards.

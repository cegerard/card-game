# PROJECT_BRIEF.md

**Card Game Battle Simulator**: a NestJS backend that simulates turn-based card battles between two players and returns the complete step-by-step fight log through a single REST endpoint (`POST /fight`). Goal: a flexible, testable, deterministic-by-design combat engine with rich mechanics (status effects, buffs/debuffs, skills, specials).

## Description

Each player controls a deck of 1-5 fighting cards with stats (attack, defense, health, speed, agility, accuracy, critical chance, plus optional regeneration and resistance). The simulator runs turn by turn with a configurable card selector (player-by-player or speed-weighted), resolves attacks and specials, applies status effects and alterations, and names the winner from the remaining health. The fight stops at 100 iterations at most. Domain logic lives in `src/fight/core/`, the HTTP layer in `src/fight/http-api/`.

## Ubiquitous Language

| Term | Definition |
| ---- | ---------- |
| Fighting Card (Card, Combatant) | Combatant with base stats, dynamic state, skills and behaviors |
| Player (Duelist) | Owns a deck of 1-5 cards |
| Simple Attack | Basic attack, used when special energy is insufficient |
| Special (Ultimate) | Ability needing accumulated energy: attack, healing or stance variant |
| Skill (Passive Skill) | Additional ability triggered by events (turn end, ally death…) or always on |
| Status Effect (Ailment) | Ongoing condition: poison, burn, freeze, stunt, bleed |
| Buff / Debuff | Temporary stat modification with a duration |
| Special Energy | Resource gained each turn to enable specials |
| Targeting Strategy | Which cards a skill affects (position-based, all, line-three, self…) |
| Card Selector | Turn order strategy (player-by-player, speed-weighted) |
| Dodge Behavior | How a card avoids attacks (simple-dodge, random-dodge) |
| Action Stage / Turn Manager | Phase where cards act / end-of-turn phase (durations, status damage) |
| Fight Result | Complete step-by-step record of a battle |
| Effect Level | Status effect intensity (1-3) |
| Element / Damage Type | Card affinity / type of damage dealt: PHYSICAL, FIRE, WATER, EARTH, AIR |
| Damage Composition | A type + rate pair; an attack mixes several (e.g. 70% physical + 30% fire) |
| Elemental Matrix | 5x5 effectiveness multipliers of damage types against elements |
| Damage Calculator | Computes total damage from compositions against a defender element |

## Features

- Simulate full battles for two decks via REST; decks of 1-5 cards
- Attacks with damage calculation (attack, defense, accuracy, dodge, critical, elemental effectiveness, multi-type)
- Specials (attack, healing, stance), energy accumulation
- Status effects (level-based), elemental marks, stacked bleed
- Buffs and debuffs with durations, stack caps and event-bound termination
- Event-driven skills and death cascades (ally/enemy/self death, health thresholds, damage taken)
- Defensive mechanics: shield, survive, damage reduction, protection, concealment, transformation
- Targeting strategies (single, all enemies, line-three, allies, self, dynamic ones)
- Winner by total remaining health; complete fight log for replay and analysis

## User Journey: Game Developer / Integrator

A backend developer building a card game client needs reliable player-vs-player or player-vs-AI battle simulation and detailed logs for replays and analysis. They POST two player configurations (decks, card stats, skills, selector strategy) to `/fight`, receive the fight result with every action, damage calculation and state change, and use it to display the battle in their client or for AI training.

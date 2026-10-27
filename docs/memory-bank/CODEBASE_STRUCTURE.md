# Codebase Structure

Mechanics are described once, in [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md); this file only maps the files.

## Root

```
card-game/                  # pnpm 11 workspace
├── packages/
│   ├── combat-engine/      # NestJS fight simulation backend
│   └── shared-types/       # Shared TypeScript types (stub)
├── clients/
│   ├── fight-replayer/     # Static HTML/JS fight replay viewer (Vitest on the parser)
│   └── gasha/              # SvelteKit arcade client (Phaser + Web renderer)
├── docs/                   # Documentation and memory bank
├── scripts/                # check-memory-bank-size.sh
├── .claude/                # Claude commands, configuration, templates
├── .github/                # Workflows (Node.js CI, Heroku deploy)
├── Dockerfile              # Multi-stage production build (Node 26 Alpine)
├── pnpm-workspace.yaml
└── package.json            # Root workspace scripts
```

## Combat Engine (`packages/combat-engine/src/`)

```
src/
├── main.ts, app.module.ts, logger-middleware.ts
└── fight/
    ├── fight.module.ts
    ├── core/          # Domain logic
    ├── http-api/      # REST layer
    └── tools/         # math-randomizer.ts (Math.random() implementation)
```

### `fight/core/`

```
core/
├── player.ts               # Player entity managing card decks (protectorOf, threeCardsFromCenter…)
├── randomizer.ts           # Randomization abstraction
├── cards/                  # Fighting card entities and types
├── card-action/            # Action resolution logic
├── fight-simulator/        # Fight orchestration
├── targeting-card-strategies/
├── trigger/                # Event triggers
└── __tests__/
```

### `cards/`

```
cards/
├── fighting-card.ts        # Card entity: stats, state, buffers (shield, stance, concealment, protection, marks, bleed)
├── skills/
│   ├── simple-attack.ts, multiple-attack.ts, attack-skill.ts  # Attacks (attack-skill = base)
│   ├── alteration-skill.ts # Triggered stat alteration
│   ├── special.ts          # Special base class
│   ├── special-attack.ts, special-healing.ts
│   ├── special-stance.ts   # Special that strikes nobody: stance + alterations + shield + concealment
│   ├── skill.ts            # Skill interface + SkillKind enum
│   ├── healing.ts, heal-basis.ts   # applyHealing(), RateBasis
│   ├── conditional-attack.ts       # Event-triggered attack (splash, execution, hit alterations…)
│   ├── targeting-override.ts
│   ├── shield.ts, transformation.ts, reactive-skill.ts  # HealthReactiveSkill implementors + interface
│   ├── protection.ts, stance.ts, concealment.ts, concealment-duration.ts
│   ├── buff-transfer.ts, bleed-explosion.ts (BLEED_DETONATION)
│   ├── survive.ts, damage-reduction.ts, dodge-bonus-denial.ts,
│   │   bleed-stack-scaling.ts, low-health-target-bonus.ts, bleed-empowerment.ts  # Card-bound passives, not Skill implementors
│   └── power-id-consistency.ts     # Composite power validation
├── behaviors/              # dodge-behaviors.ts, simple-dodge.ts, random-dodge.ts
├── damage/                 # damage-calculator.ts, elemental-matrix.ts (5x5)
└── @types/
    ├── action-result/      # special-result, attack-result, named-attack-result, healing-result, buff-results, shield-result
    ├── attack/             # attack-effect + poison/burn/freeze/stunt/mark/bleed effects, damage-type-bonus (base of bleed-stack-bonus, concealed-bonus), energy-refund, bleed-detonation, splash, low-health-debuff, hit-alterations, execution, conditions/
    ├── alteration/         # alteration-detail (Buff | Debuff), alteration-type, alteration-condition, buff-application, conditions/ (ally-presence, health-threshold, probability)
    ├── mark/               # elemental-mark, marked-target-bonus
    ├── shield/             # shield, shield-application
    ├── stance/             # stance (name, remainingTurns, immunities), StanceActivation
    ├── concealment/        # concealment (name, optional remainingTurns)
    ├── skill-activation-conditions/  # health-threshold-condition
    ├── damage/             # damage-type, damage-composition, element
    └── state/              # card-state-frozen/stunted/bleeding, status-category
```

### `fight-simulator/`

```
fight-simulator/
├── fight.ts                # Orchestrator
├── turn-manager.ts         # Turn end: durations, regeneration, status ticks, shield/stance/concealment/protection/transformation
├── action_stage.ts         # Attacks, specials, healing; reactive skills; damage-taken + ally-health events
├── card-death-subscriber.ts, death-skill-handler.ts  # Death notifications and death cascade
├── end-event-processor.ts  # Removes event-bound buffs/effects on end events
├── skill-results-to-steps.ts, effect-results-to-steps.ts   # Pure fns → Step[]
├── reactive-skill-checker.ts   # triggerReactiveSkills()
├── reactive-kill-steps.ts      # reactiveKillSteps(): death cascade of the cards a reactive attack killed
├── survived-reactions.ts       # survivedReactions(), fightSurvivedReactor(): `survived` skills of a SURVIVE holder, shared by every attack path
├── concealment-steps.ts, stance-steps.ts, execution-steps.ts  # Step helpers
├── card-selectors/         # card-selector.ts, player-by-player.ts, speed-weighted-card-pool.ts
└── @types/                 # fight-result, fight-start-report, step (StepKind), winner-report, action/attack/healing/buff/debuff/state-effect/damage/status-change reports, and one report file per mechanic (shield, mark, regeneration, protection, transformation, concealment, special-stance, survived, damage-mitigated, buff-transferred, executed, buff/effect-removed)
```

### `targeting-card-strategies/`

```
targeting-card-strategy.ts (interface)
targeted-from-position.ts, targeted-card.ts, targeted-all.ts, targeted-line-three.ts, target-and-neighbors.ts
all-owner-cards.ts, all-allies.ts, launcher.ts (self)
allied-card-by-id.ts, last-attacker-of-ally.ts   # [] if dead
most-wounded-ally.ts, fastest-ally.ts, protected-ally.ts, first-bleeding-enemy.ts
```

### `trigger/`

`trigger.ts`, `activatable-trigger.ts`, `turn-end`, `next-action`, `turn-start`, `fight-start`, `death-trigger` (ally/enemy death), `self-death`, `enemy-bleed-death`, `enemy-killed`, `survived`, `dynamic-trigger`, `bleed-stacks-applied`, `damage-taken`, `ally-health-below-threshold-trigger`, `any-ally-health-below-threshold-trigger`.

### `http-api/`

```
http-api/
├── fight.controller.ts            # POST /fight (startFight only)
├── fighting-card-factory.ts       # FightingCardDto → FightingCard, KIND_ONLY_FIELDS guard, CARD_BOUND_SKILL_KINDS
├── special-factory.ts, attack-skill-factory.ts   # Special / simple-multiple attack builders (+ damage bonuses, energy refund, execution)
├── attack-effect-factory.ts       # EffectDto → AttackEffect, triggered debuff
├── card-bound-skill-factory.ts    # Passives kept on the card (survive, reduction, dodge denial, bleed scaling/empowerment, low-health bonus)
├── other-skill-factory.ts         # createOtherSkill: one builder per SkillKind
├── skill-wiring-factory.ts        # Shared skill helpers: triggers, targeting, activation condition, stacking, alteration type, asBadRequest
├── card-selector-factory.ts       # CardSelectorStrategy → CardSelector
├── dto/fight-data.dto.ts          # Request validation
├── dodge-strategy-factory.ts, targeting-strategy-factory.ts, trigger-factory.ts
└── buff-condition-factory.ts      # BuffConditionType → BuffCondition
```

### Tests

Unit tests next to the source in `__tests__/`; e2e in `packages/combat-engine/test/` (`jest-e2e.json`, `fight/`, `helpers/`).

### Configuration

`packages/combat-engine/`: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `eslint.config.js`, `.prettierrc`. Root: `Dockerfile`, `.github/workflows/`, `AGENTS.md` (single agent entry point, `CLAUDE.md` is a symlink to it), `.devcontainer/devcontainer.json`, `.vscode/settings.json`, `.claude/` (commands, templates).

## Gasha Client (`clients/gasha/src/`)

SvelteKit 2 + Phaser 3, Web and Phaser renderers.

```
├── routes/
│   ├── +page.svelte        # Home: links to Arcade Mode and Deck Builder
│   ├── arcade/+page.svelte # Fetch fight (selectedDeckCards), mount renderer, handle outcome
│   └── deck/+page.svelte   # Deck Builder: pick exactly 5 characters
└── lib/
    ├── arcade/             # session.ts (store: phase, currentLevel, fightResult), levels.ts, types.ts
    ├── deck/               # roster.ts (CHARACTER_ROSTER, 8 cards), deck-store.ts (selectedCardIds, selectedDeckCards, toggleCard, DECK_SIZE=5), RosterCard.svelte
    ├── combat/             # engine-client.ts (fetchFight), outcome.ts, rendererMode.ts, combatStats.ts, CombatScene.ts, PhaserRenderer.svelte, CombatReportRenderer.svelte
    ├── components/         # VictoryScreen, LevelIndicator, GameOverScreen
    └── design-system/      # tokens.ts/.css, primitives/ (Button, Panel, Badge, StatBar, Overlay), composites/ (CardHeader, CharacterCard)
```

- **Renderers**: `getRendererMode()` reads `?mode=`; default `web` → `CombatReportRenderer` (mobile-portrait report from `combatStats.ts`, needs `playerCardIds` to split teams); `?mode=phaser` → `PhaserRenderer` (Phaser lazy-imported; SSR falls back to `'phaser'`).
- **Navigation**: `<a href role="button">` rather than `goto()` (no JS needed).
- **Deck**: selection lives in module-scoped stores, kept across client-side navigation but not across a hard reload (no `localStorage`). `toggleCard()` enforces the 5-card cap; default deck = first 5 roster ids.

## Fight Replayer (`clients/fight-replayer/`)

Static ES-module app (`pnpm replayer`), fight JSON pasted in, no build step. `js/parser.js` (the only real logic, tested by Vitest in `js/__tests__/`) turns a report into `events`, `snapshots` (card state after each step), `teams`, `cardsMeta`.

- Snapshots carry every buffer: `shield`, `stance`, `concealment`, `protecting`, `transformation`, `marks`, `bleedStacks`, `statuses`, `buffs`/`debuffs`; death clears them.
- The shield is drawn down per hit from `shieldAbsorbed`; a hit with `consumedBleedStacks` clears the target bleed.
- `fight_start` (step 0) is the initial state, not an event; without it (old reports) a card is sized from its first hit, else 1000.
- `js/icons.js` needs an icon and colour for every `StepKind` (`describe-event.spec.js` fails otherwise).

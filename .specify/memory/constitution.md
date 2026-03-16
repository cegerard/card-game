<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized) → 1.0.0
Initial population — all placeholders replaced for the first time.

Modified principles: N/A (first ratification)

Added sections:
- Core Principles (5 principles)
- Quality Gates
- Development Workflow
- Governance

Removed sections: N/A

Templates requiring updates:
- .specify/templates/plan-template.md ✅ — Constitution Check section already references constitution file generically; no update required
- .specify/templates/spec-template.md ✅ — No constitution-specific references; no update required
- .specify/templates/tasks-template.md ✅ — No constitution-specific references; no update required
- .specify/templates/checklist-template.md ✅ — No constitution-specific references; no update required
- .specify/templates/agent-file-template.md ✅ — No constitution-specific references; no update required

Follow-up TODOs: None — all placeholders resolved.
-->

# Card Game Battle Simulator Constitution

## Core Principles

### I. Domain Isolation (NON-NEGOTIABLE)

Core domain logic MUST reside exclusively in `src/fight/core/` with zero dependencies on
HTTP, NestJS framework decorators, or any infrastructure layer. The HTTP layer
(`src/fight/http-api/`) MUST only adapt incoming requests into domain calls and transform
domain results into HTTP responses. Factory functions (targeting, dodge, trigger, buff
condition) MUST live in the HTTP layer, not the domain.

**Rationale**: Preserves the hexagonal architecture that keeps business rules independently
testable and deployable without the web framework.

### II. Test-First Development (NON-NEGOTIABLE)

Tests MUST be written before implementation for all bug fixes and all new features.
Functional components (skills, strategies, entities) MUST NOT be mocked — only stub
implementations for infrastructure boundaries (e.g., `FightSimulatorStub` for controller
tests) are permitted. The Red-Green-Refactor cycle MUST be followed:
tests written → confirmed failing → implementation → green.

**Rationale**: Prevents mock/production divergence and ensures the domain model drives
design rather than being retrofitted to pass tests.

### III. Simplicity — No Over-Engineering (NON-NEGOTIABLE)

Every solution MUST use the minimum complexity that satisfies current requirements. YAGNI
(You Aren't Gonna Need It) is strictly enforced: no features, abstractions, helpers, or
configurability added for hypothetical future requirements. Three similar lines of code are
preferable to a premature abstraction. Complexity introduced beyond these rules MUST be
justified in the plan's Complexity Tracking table.

**Rationale**: The project is a stateless simulator with a single endpoint; accidental
complexity compounds quickly and degrades maintainability.

### IV. Fail Fast — No Silent Errors

Errors MUST be thrown immediately upon encountering unexpected state. No error swallowing,
no silent fallbacks, no default values masking illegal states. Validation MUST occur at
system boundaries (HTTP DTOs via `class-validator`); internal domain code MUST trust its
invariants and throw on violation.

**Rationale**: Silent failures in a battle simulator produce incorrect fight results that
are hard to diagnose; early throws surface bugs at their origin.

### V. Clean Code — Eliminate Duplication

Code MUST eliminate duplication ruthlessly. Methods MUST be small and focused on a single
responsibility. Intent MUST be expressed through naming and structure — comments are only
permitted for tricky logic that cannot be made self-explanatory through naming. Dependencies
MUST be made explicit; hidden coupling through shared mutable state MUST be avoided. State
and side effects MUST be minimized.

**Rationale**: The domain model is rich and grows with new skills and mechanics; duplication
here quickly creates inconsistent behavior across combat scenarios.

## Quality Gates

Every feature is complete only when ALL of the following gates pass in order:

| Order | Command            | Requirement                              |
|-------|--------------------|------------------------------------------|
| 1     | `npm run format`   | Zero formatting violations (Prettier)    |
| 2     | `npm run lint`     | Zero lint errors (ESLint, auto-fix applied) |
| 3     | `npm run test:cov` | All tests pass; coverage thresholds met  |
| 4     | `npm run build`    | NestJS application builds without errors |

No feature branch MAY be merged unless all four gates are green. Gates MUST be run in the
listed order; a failure at any gate blocks subsequent gates.

## Development Workflow

- **Branch naming**: `###-kebab-feature-name` (e.g., `042-elemental-weakness-multipliers`)
- **Commit discipline**: Commit after each completed task or logical group; commit messages
  MUST describe intent, not mechanics.
- **DTO → Domain boundary**: All DTO-to-domain conversions belong in factory functions in
  the HTTP layer; the domain MUST never import DTO types.
- **Test file location**: Unit tests colocated in `__tests__/` directories alongside source;
  E2E tests in `test/`; one expectation per `it` block; max 10 lines per `it` block.
- **No version drift**: Code MUST match the active runtime (Node.js 24, NestJS 11) and
  dependency versions declared in `package.json`.
- **`gh` CLI for GitHub operations**: All GitHub interactions (PRs, issues, releases) MUST
  use the `gh` CLI, not the web UI or manual API calls.

## Governance

This constitution supersedes all other practices documented in the repository. When a rule
in any other document conflicts with this constitution, this constitution takes precedence.

**Amendment procedure**:
1. Propose the amendment in a PR with a summary of the change and its rationale.
2. Increment `CONSTITUTION_VERSION` according to semantic versioning:
   - MAJOR: A principle is removed, renamed with changed meaning, or fundamentally redefined.
   - MINOR: A new principle or section is added, or existing guidance is materially expanded.
   - PATCH: Clarifications, wording improvements, typo fixes, non-semantic refinements.
3. Update `LAST_AMENDED_DATE` to the date of ratification.
4. Run the consistency propagation checklist (templates, agent guidance file) and record
   results in the Sync Impact Report prepended to this file.
5. All open PRs MUST re-evaluate their Constitution Check section against the new version
   before merging.

**Compliance review**: Every PR description MUST include a Constitution Check confirming
no principles are violated, or explicitly justifying any necessary deviation in the plan's
Complexity Tracking table.

**Runtime guidance**: Use `.claude/CLAUDE.md` for agent-specific runtime development
guidance; it MUST stay consistent with this constitution.

---

**Version**: 1.0.0 | **Ratified**: 2026-03-16 | **Last Amended**: 2026-03-16

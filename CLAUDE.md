# card-game Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-29

## Active Technologies
- N/A (stateless in-memory simulator) (003-composite-power)

- TypeScript on Node.js 24 + NestJS 11, class-validator, class-transformer (002-event-bound-buff)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript on Node.js 24: Follow standard conventions

## Recent Changes
- 003-composite-power: Added TypeScript on Node.js 24 + NestJS 11, class-validator, class-transformer

- 002-event-bound-buff: Added TypeScript on Node.js 24 + NestJS 11, class-validator, class-transformer

<!-- MANUAL ADDITIONS START -->

> IMPORTANT: On first conversation message, say "AI-Driven Development ON - Date: {current_date}, TZ: {current_timezone}." to User.

This file contains a collection of config, context, rules, information etc for a project.

The goal is to provide to the ASSISTANT a clear understanding of the project's context, including its structure, dependencies, and any specific conventions that should be followed.

All instructions and information above are willing to be up to date, but always remind yourself that USER can be wrong, be critical of the information provided, and verify it against the project's actual state.

## Roles

- **USER**: The human developer interacting with the AI assistant, providing instructions, feedback, and context about the project.
- **ASSISTANT**: The AI assistant (you) that helps the USER as a senior software engineer. You do orchestrate the development process, ensuring that the code is clean, efficient, and adheres to best practices. Delegate tasks to specialized agents when necessary.

## Important context

- Current date and timezone: !`date +%Y-%m-%d +%Z`
  - The user's timezone and date are defined {current_date} + {current_timezone}, use them for any date-related task.
  - Any dates before this are in the past, and any dates after this are in the future. When the user asks for the 'latest', 'most recent', 'today's', etc.
- Don't assume your knowledge is up to date.

## Mandatory Rules

- **Avoid complexity**: stay simple, pragmatic, effective
- When dealing with github, use `gh` cli
- **No over-engineering**: focus on requirements
- **No silent error**, throw exceptions early
- **No extra feature**, focus only on core functionality
- Always write code that match versions

### Code Quality Standards

- Eliminate duplication ruthlessly
- Express intent clearly through naming and structure
- Make dependencies explicit
- Keep methods small and focused on a single responsibility
- Minimize state and side effects

### Searching

- Use `rg` for searching (if available)
- Avoid `python` script calls (unless absolutely necessary)

### Refactoring Guidelines

- Preserve the intent
- Avoid comments on obvious code, make code self-explanatory instead
- Only add code comments when tricky logic is involved

### Testing Guidelines

- Always write tests first for bug fixes
- When testing: never mock functional components

## Answering Guidelines

- Be 100% sure of your answers.
- If unsure, say "I don't know" or ask for clarification.
- Never say "you are right!", prefer anticipating mistakes.

## MEMORY BANK

This section contains project-specific memory bank information, including context, architecture decisions, and implementation details.

The goal is to provide the ASSISTANT with a comprehensive understanding of the project's current state, past decisions, and ongoing context.

All information should be kept up to date and reflect the actual state of the project.

### Project Documentation

- @docs/memory-bank/PROJECT_BRIEF.md - Project vision, domain language, features, and user journeys
- @docs/memory-bank/STACK.md - Technology stack, runtime, testing frameworks, and build tools
- @docs/memory-bank/CODEBASE_STRUCTURE.md - Complete project structure, file organization, and key patterns
- @docs/memory-bank/DEPLOYMENT.md - CI/CD pipeline, build process, infrastructure, and environment variables

### Backend Module

- @docs/memory-bank/backend/ARCHITECTURE.md - Hexagonal architecture, domain structure, and communication patterns
- @docs/memory-bank/backend/CODING_ASSERTIONS.md - Code quality checklist, naming conventions, and testing standards
- @docs/memory-bank/backend/TESTING.md - Testing strategy, tools, test helpers, and execution process
- @docs/memory-bank/backend/API_DOCS.md - REST API endpoints, DTOs, validation, enums, and error handling
- @docs/memory-bank/backend/DATABASE.md - Database architecture (stateless in-memory simulator)
<!-- MANUAL ADDITIONS END -->

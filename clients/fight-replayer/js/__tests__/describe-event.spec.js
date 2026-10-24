import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describeEvent } from '../renderers.js';
import { ICON } from '../icons.js';

const STEP_TYPES = fileURLToPath(
  new URL(
    '../../../../packages/combat-engine/src/fight/core/fight-simulator/@types/step.ts',
    import.meta.url,
  ),
);

/** Every value of the engine `StepKind` enum, read from its source. */
function engineStepKinds() {
  const source = readFileSync(STEP_TYPES, 'utf-8');
  const body = source.match(/export enum StepKind \{([^}]*)\}/)[1];
  return [...body.matchAll(/=\s*'([a-z_]+)'/g)].map((match) => match[1]);
}

// fight_start is read as the initial state, never shown as an event.
const shownKinds = engineStepKinds().filter((kind) => kind !== 'fight_start');

describe('describeEvent', () => {
  it.each(shownKinds)('gives the %s step its own icon', (kind) => {
    expect(describeEvent({ kind }).icon ?? ICON.unknown).not.toBe(ICON.unknown);
  });
});

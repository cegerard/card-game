import { describe, it, expect } from 'vitest';
import { elementIndex } from '../tokens.js';

describe('elementIndex', () => {
  it('maps FIRE to 0', () => {
    expect(elementIndex('FIRE')).toBe(0);
  });

  it('maps WATER to 1', () => {
    expect(elementIndex('WATER')).toBe(1);
  });

  it('maps EARTH to 2', () => {
    expect(elementIndex('EARTH')).toBe(2);
  });

  it('maps AIR to 3', () => {
    expect(elementIndex('AIR')).toBe(3);
  });

  it('maps PHYSICAL to 4', () => {
    expect(elementIndex('PHYSICAL')).toBe(4);
  });

  it('falls back to PHYSICAL index for an unknown element', () => {
    expect(elementIndex(undefined)).toBe(4);
  });
});

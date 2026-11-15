import { MathRandomizer } from './math-randomizer';

/**
 * Mulberry32: a small 32-bit generator, the same sequence in [0, 1) for the
 * same seed, which is all a replayable fight needs (not cryptographic).
 */
export class SeededRandomizer extends MathRandomizer {
  private state: number;

  constructor(seed: number) {
    super();
    this.state = seed >>> 0;
  }

  public random(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

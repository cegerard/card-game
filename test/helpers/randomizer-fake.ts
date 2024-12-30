import { Randomizer } from '../../src/core/tools/randomizer';

export class RandomizerFake implements Randomizer {
  private nextRandomValue: number = 0;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public random_int_between(min: number, max: number): number {
    return this.nextRandomValue;
  }

  public setNextRandomValue(value: number): RandomizerFake {
    this.nextRandomValue = value;
    return this;
  }

  public reset(): void {
    this.nextRandomValue = 0;
  }
}

import { random } from '../core/random-source';
import { Randomizer } from '../core/randomizer';

export class MathRandomizer implements Randomizer {
  public random_int_between(min: number, max: number): number {
    return Math.floor(random() * (max - min + 1)) + min;
  }

  public random(): number {
    return random();
  }
}

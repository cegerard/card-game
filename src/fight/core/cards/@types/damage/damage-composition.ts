import { DamageType } from './damage-type';

export class DamageComposition {
  public readonly type: DamageType;
  public readonly rate: number;

  constructor(type: DamageType, rate: number) {
    if (rate < 0) {
      throw new Error(
        `DamageComposition rate must be greater than or equal to 0, got ${rate}`,
      );
    }

    this.type = type;
    this.rate = rate;
  }
}

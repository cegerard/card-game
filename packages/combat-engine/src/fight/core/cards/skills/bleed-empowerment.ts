import { FightingCard } from '../fighting-card';
import { RATE_BASES, RateBasis } from '../@types/rate-basis';
import { EffectTriggeredDebuff } from '../@types/attack/effect-triggered-debuff';

/** What a bleed carries when it is laid. */
export type BleedApplication = {
  stacks: number;
  rate: number;
  duration: number;
  basis: RateBasis;
  triggeredDebuff?: EffectTriggeredDebuff;
};

/** What an empowerment replaces on top of the stacks and the rate. */
export type BleedEmpowermentOverrides = Partial<
  Pick<BleedApplication, 'duration' | 'basis' | 'triggeredDebuff'>
>;

/**
 * While its owner holds `requiredStance`, every bleed it applies lays
 * `extraStacks` more stacks and bleeds at `rate` instead of the effect own
 * rate, with the duration, basis and triggered debuff the overrides replace.
 * The stack cap of the effect still applies.
 *
 * Like `SurviveSkill`, this is not a `Skill` implementor: it has no event
 * trigger and no targeting strategy. It is consulted by `BleedAttackEffect`
 * through `FightingCard.empowerBleed()`.
 */
export class BleedEmpowermentSkill {
  constructor(
    public readonly name: string,
    private readonly requiredStance: string,
    private readonly extraStacks: number = 0,
    private readonly rate: number,
    private readonly overrides: BleedEmpowermentOverrides = {},
  ) {
    if (extraStacks < 0) {
      throw new Error(
        `BleedEmpowermentSkill extraStacks must be greater than or equal to 0, got ${extraStacks}`,
      );
    }
    if (rate <= 0) {
      throw new Error(
        `BleedEmpowermentSkill rate must be greater than 0, got ${rate}`,
      );
    }
    const { duration, basis } = overrides;
    if (
      duration !== undefined &&
      (!Number.isInteger(duration) || duration < 1)
    ) {
      throw new Error(
        `BleedEmpowermentSkill duration must be an integer greater than or equal to 1, got ${duration}`,
      );
    }
    if (basis !== undefined && !RATE_BASES.includes(basis)) {
      throw new Error(`Unknown bleed basis: ${basis}`);
    }
  }

  public empower(
    owner: FightingCard,
    application: BleedApplication,
  ): BleedApplication {
    if (!owner.hasStance(this.requiredStance)) return application;

    const { duration, basis, triggeredDebuff } = this.overrides;
    return {
      stacks: application.stacks + this.extraStacks,
      rate: this.rate,
      duration: duration ?? application.duration,
      basis: basis ?? application.basis,
      triggeredDebuff: triggeredDebuff ?? application.triggeredDebuff,
    };
  }
}

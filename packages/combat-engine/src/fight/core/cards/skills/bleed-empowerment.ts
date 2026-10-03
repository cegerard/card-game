import { FightingCard } from '../fighting-card';

export type BleedApplication = { stacks: number; rate: number };

/**
 * While its owner holds `requiredStance`, every bleed it applies lays
 * `extraStacks` more stacks and bleeds at `rate` instead of the effect own
 * rate. The stack cap of the effect still applies.
 *
 * Like `SurviveSkill`, this is not a `Skill` implementor: it has no event
 * trigger and no targeting strategy. It is consulted by `BleedAttackEffect`
 * through `FightingCard.empowerBleed()`.
 */
export class BleedEmpowermentSkill {
  constructor(
    public readonly name: string,
    private readonly requiredStance: string,
    private readonly extraStacks: number,
    private readonly rate: number,
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
  }

  public empower(
    owner: FightingCard,
    application: BleedApplication,
  ): BleedApplication {
    if (!owner.hasStance(this.requiredStance)) return application;

    return {
      stacks: application.stacks + this.extraStacks,
      rate: this.rate,
    };
  }
}

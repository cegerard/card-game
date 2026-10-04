import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackCondition } from '../@types/attack/attack-condition';
import { AttackSkill } from './attack-skill';
import { Skill, SkillKind, SkillResults } from './skill';
import { Trigger } from '../../trigger/trigger';
import { isActivatableTrigger } from '../../trigger/activatable-trigger';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { Splash } from '../@types/attack/splash';
import { LowHealthDebuff } from '../@types/attack/low-health-debuff';
import { StanceActivation } from '../@types/stance/stance';

export class ConditionalAttack implements Skill {
  public id = 'conditional-attack';

  constructor(
    public readonly name: string,
    private readonly attackSkill: AttackSkill,
    private readonly condition: AttackCondition,
    private readonly trigger: Trigger,
    private readonly powerId?: string,
    public readonly requiredStance?: string,
    private readonly energyCost?: number,
    private readonly splash?: Splash,
    private readonly lowHealthDebuff?: LowHealthDebuff,
    private readonly stanceActivation?: StanceActivation,
  ) {}

  isTriggered(triggerName: string): boolean {
    return (
      this.trigger.isTriggered(triggerName) && this.condition.isTriggered()
    );
  }

  launch(
    source: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): SkillResults {
    if (this.energyCost && source.actualEnergy < this.energyCost) {
      return { skillKind: SkillKind.Attack, results: [], name: this.name };
    }

    const attackResults = this.attackSkill.launch(
      source,
      context,
      targetingStrategy,
    );
    this.condition.reset();
    // An attack that found nobody to strike costs nothing.
    if (this.energyCost && attackResults.results.length > 0) {
      source.spendEnergy(this.energyCost);
    }

    const [primary] = attackResults.results;
    // Read before the splash lands: only the main hit counts.
    const lowHealthDebuffs =
      primary && !primary.dodge
        ? (this.lowHealthDebuff?.apply(primary.defender) ?? [])
        : [];

    return {
      skillKind: SkillKind.Attack,
      results: attackResults.results,
      name: this.name,
      powerId: this.powerId,
      stanceStarted:
        primary && this.stanceActivation
          ? source.activateStance(
              this.stanceActivation.name,
              this.stanceActivation.duration,
              this.stanceActivation.immunities,
            )
          : undefined,
      // The zone is centered on the card the attack was aimed at, even when
      // a guardian stepped in front of it.
      lowHealthDebuff:
        lowHealthDebuffs.length > 0
          ? { name: this.lowHealthDebuff.name, results: lowHealthDebuffs }
          : undefined,
      splash:
        primary && this.splash
          ? this.splash.strike(
              source,
              primary.interceptedFor ?? primary.defender,
              context,
            )
          : undefined,
    };
  }

  activate(triggerId: string, context: FightingContext): void {
    if (isActivatableTrigger(this.trigger)) {
      this.trigger.activate(triggerId, context);
    }
  }

  tick(): void {
    this.condition.tick();
  }
}

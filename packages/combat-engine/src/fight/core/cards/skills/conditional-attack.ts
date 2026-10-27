import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackCondition } from '../@types/attack/attack-condition';
import { AttackSkill } from './attack-skill';
import { AttackSkillResults, Skill, SkillKind } from './skill';
import { Trigger } from '../../trigger/trigger';
import { isActivatableTrigger } from '../../trigger/activatable-trigger';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { Splash } from '../@types/attack/splash';
import { LowHealthDebuff } from '../@types/attack/low-health-debuff';
import { StanceActivation } from '../@types/stance/stance';
import { HitAlterations } from '../@types/attack/hit-alterations';
import { Execution } from '../@types/attack/execution';

export interface ConditionalAttackOptions {
  powerId?: string;
  requiredStance?: string;
  energyCost?: number;
  splash?: Splash;
  lowHealthDebuff?: LowHealthDebuff;
  stanceActivation?: StanceActivation;
  requiresUndamaged?: boolean;
  hitAlterations?: HitAlterations;
  endsStance?: boolean;
  execution?: Execution;
  activationLimit?: number;
  endEvent?: string;
}

export class ConditionalAttack implements Skill {
  public id = 'conditional-attack';

  public readonly requiredStance?: string;
  public readonly requiresUndamaged?: boolean;
  private readonly powerId?: string;
  private readonly energyCost?: number;
  private readonly splash?: Splash;
  private readonly lowHealthDebuff?: LowHealthDebuff;
  private readonly stanceActivation?: StanceActivation;
  private readonly hitAlterations?: HitAlterations;
  private readonly endsStance?: boolean;
  private readonly execution?: Execution;
  private readonly activationLimit?: number;
  private readonly endEvent?: string;

  constructor(
    public readonly name: string,
    private readonly attackSkill: AttackSkill,
    private readonly condition: AttackCondition,
    private readonly trigger: Trigger,
    options: ConditionalAttackOptions = {},
  ) {
    this.powerId = options.powerId;
    this.requiredStance = options.requiredStance;
    this.energyCost = options.energyCost;
    this.splash = options.splash;
    this.lowHealthDebuff = options.lowHealthDebuff;
    this.stanceActivation = options.stanceActivation;
    this.requiresUndamaged = options.requiresUndamaged;
    this.hitAlterations = options.hitAlterations;
    this.endsStance = options.endsStance;
    this.execution = options.execution;
    this.activationLimit = options.activationLimit;
    this.endEvent = options.endEvent;
    if (this.endsStance && !this.requiredStance) {
      throw new Error('ConditionalAttack endsStance requires requiredStance');
    }
  }

  private activationCount = 0;

  isTriggered(triggerName: string): boolean {
    if (this.isExhausted()) return false;
    return (
      this.trigger.isTriggered(triggerName) && this.condition.isTriggered()
    );
  }

  launch(
    source: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): AttackSkillResults {
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
    // Only an attack that struck somebody spends an activation.
    if (primary) this.activationCount++;
    // Executed first: a defender finished off gets no alteration.
    const executions = this.execution?.apply(attackResults.results) ?? [];
    // Applied after the hit effects and before the splash: only the main
    // attack alters its defenders.
    const hitAlterations = this.hitAlterations?.apply(attackResults.results);
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
      endEvent: primary && this.isExhausted() ? this.endEvent : undefined,
      executions:
        executions.length > 0
          ? { name: this.name, results: executions }
          : undefined,
      hitAlterations: hitAlterations && { name: this.name, ...hitAlterations },
      stanceEnded:
        primary && this.endsStance && source.endStance(this.requiredStance)
          ? this.requiredStance
          : undefined,
      stanceStarted:
        primary && this.stanceActivation
          ? source.activateStance(this.stanceActivation)
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

  lifecycleEndEvent(): string | undefined {
    if (this.isExhausted()) return undefined;
    return this.endEvent;
  }

  private isExhausted(): boolean {
    return (
      this.activationLimit !== undefined &&
      this.activationCount >= this.activationLimit
    );
  }
}

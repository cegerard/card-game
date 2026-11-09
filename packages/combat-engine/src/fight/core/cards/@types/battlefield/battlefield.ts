import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { AlterationType } from '../alteration/alteration-type';
import { LivingAllyScaling } from '../alteration/live-rate';
import { BuffResult, DebuffResult } from '../action-result/alteration-result';
import { DamageType } from '../damage/damage-type';
import { Player } from '../../../player';
import { round2 } from '../../../../tools/round';

export type BattlefieldAlteration = {
  type: AlterationType;
  rate: number;
  polarity: 'buff' | 'debuff';
  /** Set, `rate` is earned per living ally of the bearer, up to `maxRate`. */
  perLivingAlly?: { maxRate: number };
};

/** Each hit on a member loses `rate`, carried by the other members, `maxShareRate` of the hit each at most. */
export type DamageSharingConfig = { rate: number; maxShareRate: number };

export type BattlefieldConfig = {
  name: string;
  /** Turns it lasts on each card, counted on that card own clock like a buff. */
  duration: number;
  allies?: {
    alterations?: BattlefieldAlteration[];
    /** Share of its max health each ally heals at its turn end. */
    healRate?: number;
    damageSharing?: DamageSharingConfig;
  };
  enemies?: {
    alterations?: BattlefieldAlteration[];
    /** Share of the caster attack each enemy takes at its turn end, of that type. */
    damage?: { rate: number; damageType: DamageType };
  };
  /** Allies dead for less than `withinTurns` turns of their side come back with `rate` of their max health. */
  revival?: { rate: number; withinTurns: number };
  /** When the caster falls while it runs: it lasts `duration` more turns and the living allies are empowered once. */
  legacy?: { duration: number; empowerment?: { name: string; rate: number } };
};

export type Revival = { card: FightingCard; remainingHealth: number };

export type BattlefieldResult = {
  name: string;
  remainingTurns: number;
  revived: Revival[];
  alterations: (BuffResult | DebuffResult)[];
};

export type LegacyResult = {
  name: string;
  extraTurns: number;
  empowerment?: { name: string; cards: FightingCard[] };
};

/** The circle of cards one damage sharing binds together. */
export type DamageSharing = DamageSharingConfig & {
  name: string;
  circle: FightingCard[];
};

/** What a battlefield leaves on one card. */
export type BattlefieldExposure = {
  deployment: BattlefieldDeployment;
  remainingTurns: number;
  healRate?: number;
  damage?: { amount: number; damageType: DamageType };
  sharing?: DamageSharing;
};

/**
 * A change of the battlefield laid by a card for both sides: the caster allies
 * get its aura, its enemies its hazard. Each card carries its part on its own
 * clock, which is how the battlefield outlives its caster.
 */
export class Battlefield {
  constructor(public readonly config: BattlefieldConfig) {
    if (!Number.isInteger(config.duration) || config.duration < 1) {
      throw new Error(
        `Battlefield duration must be an integer >= 1, got ${config.duration}`,
      );
    }
    assertRate('revival rate', config.revival?.rate);
    assertRate('heal rate', config.allies?.healRate);
    assertRate('damage sharing rate', config.allies?.damageSharing?.rate);
  }

  public deploy(
    caster: FightingCard,
    context: FightingContext,
  ): BattlefieldResult {
    return new BattlefieldDeployment(this.config, caster).deploy(context);
  }
}

/** One cast of a battlefield, remembered by every card it touched. */
export class BattlefieldDeployment {
  private legacyUsed = false;

  constructor(
    public readonly config: BattlefieldConfig,
    public readonly source: FightingCard,
  ) {}

  public get name(): string {
    return this.config.name;
  }

  public deploy(context: FightingContext): BattlefieldResult {
    const { allies, enemies, duration } = this.config;
    const revived = this.revive(context.sourcePlayer);
    const sharing: DamageSharing | undefined = allies?.damageSharing && {
      ...allies.damageSharing,
      name: this.name,
      circle: context.sourcePlayer.playableCards,
    };
    const damage = enemies?.damage && {
      amount: round2(enemies.damage.rate * this.source.actualAttack),
      damageType: enemies.damage.damageType,
    };

    context.sourcePlayer.playableCards.forEach((card) =>
      card.expose({
        deployment: this,
        remainingTurns: duration,
        healRate: allies?.healRate,
        sharing,
      }),
    );
    context.opponentPlayer.playableCards.forEach((card) =>
      card.expose({ deployment: this, remainingTurns: duration, damage }),
    );

    return {
      name: this.name,
      remainingTurns: duration,
      revived,
      alterations: [
        ...this.alter(context.sourcePlayer, allies?.alterations),
        ...this.alter(context.opponentPlayer, enemies?.alterations),
      ],
    };
  }

  /**
   * The caster fell: once, a battlefield with a legacy lasts longer on every
   * card still under it and empowers the living allies of the caster.
   */
  public fallOfSource(players: Player[]): LegacyResult | undefined {
    const legacy = this.config.legacy;
    if (!legacy || this.legacyUsed) return undefined;

    const exposed = players
      .flatMap((player) => player.allCards)
      .filter((card) => !card.isDead() && card.isExposedTo(this));
    if (exposed.length === 0) return undefined;

    this.legacyUsed = true;
    exposed.forEach((card) => card.extendBattlefield(this, legacy.duration));
    const team = players.find((player) => player.ownCard(this.source));
    const empowered = legacy.empowerment ? team.playableCards : [];
    empowered.forEach((card) =>
      card.empower(legacy.empowerment.name, legacy.empowerment.rate),
    );

    return {
      name: this.name,
      extraTurns: legacy.duration,
      empowerment: legacy.empowerment && {
        name: legacy.empowerment.name,
        cards: empowered,
      },
    };
  }

  private revive(team: Player): Revival[] {
    const revival = this.config.revival;
    if (!revival) return [];

    return team.allCards
      .filter(
        (card) =>
          card !== this.source &&
          card.isDead() &&
          card.turnsSinceDeath < revival.withinTurns,
      )
      .map((card) => {
        card.revive(revival.rate);
        return { card, remainingHealth: card.actualHealth };
      });
  }

  private alter(
    team: Player,
    alterations: BattlefieldAlteration[] = [],
  ): (BuffResult | DebuffResult)[] {
    return team.playableCards.flatMap((card) => {
      card.removeAlterationsFrom(this.name);
      return alterations
        .map((alteration) => ({
          target: card.identityInfo,
          alteration: this.applyTo(card, team, alteration),
        }))
        .filter(
          (result): result is BuffResult | DebuffResult =>
            result.alteration !== undefined,
        );
    });
  }

  private applyTo(
    card: FightingCard,
    team: Player,
    { type, rate, polarity, perLivingAlly }: BattlefieldAlteration,
  ) {
    const options = {
      origin: this.name,
      live:
        perLivingAlly &&
        new LivingAllyScaling(rate, perLivingAlly.maxRate, team),
    };
    const { duration } = this.config;

    return polarity === 'debuff'
      ? card.applyDebuff(
          type,
          rate,
          duration,
          undefined,
          undefined,
          undefined,
          options,
        )
      : card.applyBuff(
          type,
          rate,
          duration,
          undefined,
          undefined,
          undefined,
          options,
        );
  }
}

function assertRate(label: string, rate?: number): void {
  if (rate !== undefined && (rate <= 0 || rate > 1)) {
    throw new Error(`Battlefield ${label} must be in ]0, 1], got ${rate}`);
  }
}

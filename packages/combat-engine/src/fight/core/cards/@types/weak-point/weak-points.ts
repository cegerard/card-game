import { FightingCard } from '../../fighting-card';
import { RevealerBonus, WeakPoint } from './weak-point';

/** The weak points one card carries, one per name. */
export class WeakPoints {
  private points: WeakPoint[] = [];

  /** Revealing a weak point again under the same name replaces it. */
  public reveal(weakPoint: WeakPoint): void {
    this.points = [
      ...this.points.filter((p) => p.name !== weakPoint.name),
      weakPoint,
    ];
  }

  public get isEmpty(): boolean {
    return this.points.length === 0;
  }

  public damageMultiplierFor(attacker: FightingCard): number {
    return this.points.reduce(
      (multiplier, p) => multiplier * p.damageMultiplierFor(attacker),
      1,
    );
  }

  public get criticalChanceBonus(): number {
    return this.points.reduce((sum, p) => sum + p.criticalChanceBonus, 0);
  }

  public bonusOf(attacker: FightingCard, bonus: keyof RevealerBonus): number {
    return this.points.reduce((sum, p) => sum + p.bonusOf(attacker, bonus), 0);
  }

  /** Removes and returns the weak points the next attack uses up. */
  public consume(): WeakPoint[] {
    return this.extract((p) => p.consumable);
  }

  /** Ticks every timed weak point and returns the ones that ran out. */
  public tick(): WeakPoint[] {
    return this.extract((p) => p.tick());
  }

  public revealedBy(revealer: FightingCard): WeakPoint[] {
    return this.points.filter((p) => p.revealer === revealer);
  }

  private extract(predicate: (p: WeakPoint) => boolean): WeakPoint[] {
    const extracted = this.points.filter(predicate);
    this.points = this.points.filter((p) => !extracted.includes(p));
    return extracted;
  }
}

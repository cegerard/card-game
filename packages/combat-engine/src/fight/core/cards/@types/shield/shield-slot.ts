import { Shield } from './shield';

/** The single shield a card can hold: a new one replaces it. */
export class ShieldSlot {
  private shield: Shield | null = null;

  public get isUp(): boolean {
    return this.shield !== null;
  }

  public holds(name: string): boolean {
    return this.shield?.name === name;
  }

  /** `name` lets a live alteration tell this shield from another one. */
  public raise(points: number, duration: number, name?: string): Shield {
    this.shield = name ? { points, duration, name } : { points, duration };
    return this.shield;
  }

  /** Absorbs what it can of a hit; returns the points absorbed. */
  public absorb(damage: number): number {
    if (!this.shield) return 0;

    const absorbed = Math.min(this.shield.points, damage);
    this.shield = { ...this.shield, points: this.shield.points - absorbed };
    if (this.shield.points <= 0) {
      this.shield = null;
    }
    return absorbed;
  }

  /** Decrements the shield and returns it on the turn it expires. */
  public decreaseDuration(): Shield | null {
    if (!this.shield) return null;

    this.shield = { ...this.shield, duration: this.shield.duration - 1 };
    if (this.shield.duration >= 0) return null;

    const expired = this.shield;
    this.shield = null;
    return expired;
  }

  public clear(): void {
    this.shield = null;
  }
}

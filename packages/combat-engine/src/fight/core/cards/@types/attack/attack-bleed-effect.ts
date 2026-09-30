import { FightingCard } from '../../fighting-card';
import { AttackEffect, StateEffectResult } from './attack-effect';
import { FightingContext } from '../fighting-context';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { CardStateBleeding } from '../state/card-state-bleeding';
import { round2 } from '../../../../tools/round';
import { Randomizer } from '../../../randomizer';

export class BleedAttackEffect implements AttackEffect {
  public readonly type = 'bleed' as const;

  constructor(
    public readonly rate: number,
    private readonly duration: number,
    private readonly maxStacks: number,
    private readonly randomizer: Randomizer,
    private readonly stacks: number = 1,
    public readonly probability?: number,
    public readonly triggeredDebuff?: EffectTriggeredDebuff,
    public readonly terminationEvent?: string,
  ) {
    const counts = { duration, maxStacks, stacks };
    Object.entries(counts).forEach(([field, value]) => {
      if (value < 1) {
        throw new Error(
          `BleedAttackEffect ${field} must be greater than or equal to 1, got ${value}`,
        );
      }
    });
  }

  public applyEffect(
    defender: FightingCard,
    card: FightingCard,
    _context: FightingContext,
  ): StateEffectResult {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    )
      return;
    if (defender.frozenLevel > 0) return;

    const room = this.maxStacks - defender.bleedStacks();
    if (room <= 0) return;

    const damageValue = round2(card.actualAttack * this.rate);
    const bleeding = new CardStateBleeding(
      Array.from({ length: Math.min(this.stacks, room) }, () => ({
        remainingTurns: this.duration,
        damageValue,
        terminationEvent: this.terminationEvent,
      })),
    );
    if (!defender.setState(bleeding)) return;

    const effectResult: StateEffectResult = {
      type: this.type,
      card: defender,
      stacks: defender.bleedStacks(),
    };
    const appliedDebuff = this.triggeredDebuff?.tryApply(defender);
    if (appliedDebuff) {
      effectResult.triggeredDebuff = { card: defender, debuff: appliedDebuff };
    }
    return effectResult;
  }
}

import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../cards/fighting-card';
import { Player } from '../../player';
import { AllAllies } from '../all-allies';
import { FirstBleedingEnemyStrategy } from '../first-bleeding-enemy';
import { LastAttackerOfAllyTargetingStrategy } from '../last-attacker-of-ally';
import { TargetAndNeighborsStrategy } from '../target-and-neighbors';
import { TargetedAll } from '../targeted-all';
import { TargetedCard } from '../targeted-card';
import { TargetedFromPosition } from '../targeted-from-position';
import { TargetedLineThree } from '../targeted-line-three';
import { TargetingCardStrategy } from '../targeting-card-strategy';
import { CardStateBleeding } from '../../cards/@types/state/card-state-bleeding';

describe('Targeting a concealed enemy', () => {
  let attacker: FightingCard;
  let ally: FightingCard;
  let hidden: FightingCard;
  let visible: FightingCard;
  let attackingPlayer: Player;
  let defendingPlayer: Player;

  const targetIds = (strategy: TargetingCardStrategy) =>
    strategy
      .targetedCards(attacker, attackingPlayer, defendingPlayer)
      .map((card) => card.id);

  beforeEach(() => {
    attacker = createFightingCard({ id: 'attacker' });
    ally = createFightingCard({ id: 'ally' });
    hidden = createFightingCard({ id: 'hidden' });
    visible = createFightingCard({ id: 'visible' });
    attackingPlayer = new Player('Attacker', [attacker, ally]);
    defendingPlayer = new Player('Defender', [hidden, visible]);
    hidden.conceal('Marche Fantôme');
  });

  it('falls back to the next targetable card from position', () => {
    expect(targetIds(new TargetedFromPosition())).toEqual(['visible']);
  });

  it('is left out of target-all', () => {
    expect(targetIds(new TargetedAll())).toEqual(['visible']);
  });

  it('is left out of line-three', () => {
    expect(targetIds(new TargetedLineThree())).toEqual(['visible']);
  });

  it('is left out of the neighbors of a center', () => {
    expect(targetIds(new TargetAndNeighborsStrategy(visible))).toEqual([
      'visible',
    ]);
  });

  it('cannot be targeted by id', () => {
    expect(targetIds(new TargetedCard('hidden'))).toEqual([]);
  });

  it('is skipped when looking for a bleeding enemy', () => {
    [hidden, visible].forEach((card) =>
      card.setState(
        new CardStateBleeding([{ remainingTurns: 3, damageValue: 1 }]),
      ),
    );

    expect(targetIds(new FirstBleedingEnemyStrategy(1))).toEqual(['visible']);
  });

  it('cannot be targeted as the last attacker of an ally', () => {
    ally.lastAttacker = hidden;

    expect(targetIds(new LastAttackerOfAllyTargetingStrategy('ally'))).toEqual(
      [],
    );
  });

  it('nobody is targeted when every enemy is concealed', () => {
    visible.conceal('Camouflage');

    expect(targetIds(new TargetedFromPosition())).toEqual([]);
  });

  it('can still be targeted by its own allies', () => {
    expect(
      new AllAllies()
        .targetedCards(visible, defendingPlayer, attackingPlayer)
        .map((card) => card.id),
    ).toEqual(['hidden']);
  });
});

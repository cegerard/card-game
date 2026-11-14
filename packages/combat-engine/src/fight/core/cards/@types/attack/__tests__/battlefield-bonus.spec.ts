import { BattlefieldBonus } from '../battlefield-bonus';
import { DamageComposition } from '../../damage/damage-composition';
import { DamageType } from '../../damage/damage-type';
import { Element } from '../../damage/element';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { Player } from '../../../../player';
import { Battlefield } from '../../battlefield/battlefield';

const whipDamages = [
  new DamageComposition(DamageType.PHYSICAL, 0.7),
  new DamageComposition(DamageType.WATER, 0.7),
];

describe('BattlefieldBonus', () => {
  const bonus = new BattlefieldBonus(Element.WATER, undefined, 1.2);
  let attacker: FightingCard;
  let defender: FightingCard;
  let players: Player[];

  const lay = (element: Element, caster: FightingCard) =>
    new Battlefield({ name: 'Marée', duration: 2, element }).deploy(caster, {
      sourcePlayer: players.find((p) => p.ownCard(caster)),
      opponentPlayer: players.find((p) => !p.ownCard(caster)),
    });
  const rates = () =>
    bonus.applyTo(whipDamages, attacker, defender).map((d) => d.rate);

  beforeEach(() => {
    attacker = createFightingCard({});
    defender = createFightingCard({});
    players = [new Player('p1', [attacker]), new Player('p2', [defender])];
  });

  it('leaves the damages unchanged without battlefield', () => {
    expect(rates()).toEqual([0.7, 0.7]);
  });

  it('boosts every damage type when the attacker stands in that battlefield', () => {
    lay(Element.WATER, attacker);

    expect(rates()).toEqual([0.84, 0.84]);
  });

  it('boosts the attack when the defender laid that battlefield', () => {
    lay(Element.WATER, defender);

    expect(rates()).toEqual([0.84, 0.84]);
  });

  it('ignores a battlefield of another element', () => {
    lay(Element.FIRE, attacker);

    expect(rates()).toEqual([0.7, 0.7]);
  });

  it('ignores a battlefield that ran out', () => {
    lay(Element.WATER, attacker);
    [1, 2, 3].forEach(() =>
      [attacker, defender].forEach((c) => c.decreaseBattlefieldDurations()),
    );

    expect(rates()).toEqual([0.7, 0.7]);
  });
});

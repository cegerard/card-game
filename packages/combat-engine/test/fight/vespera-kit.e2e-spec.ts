import { jest } from '@jest/globals';
import {
  actionsOf,
  dummy,
  named,
  ofKind,
  rosterCard,
  useFight,
} from '../helpers/kit';

const STING = 'Dard du Crépuscule';
const SWARM = 'Nuée de Cristaux';
const CARAPACE = 'Carapace de Sable';
const INSTINCT = 'Instinct de Guêpe';
const DANCE = 'Danse du Désert';
const COUNTER = 'Danse du Désert - Dard du Crépuscule';
const QUEEN = 'Reine du Crépuscule';
const ZONE = 'Reine du Crépuscule - Zone toxique';
const EXPLOSION = 'Reine du Crépuscule - Explosion de venin';

const vespera = rosterCard('vespera');

const poisonsOn = (steps: any[], id: string) =>
  ofKind(steps, 'status_change').filter(
    (s) => s.status === 'poison' && s.card.id === id,
  );
const poisonTicksOn = (steps: any[], id: string) =>
  steps.filter(
    (s) => s.kind === 'state_effect' && s.type === 'poison' && s.card.id === id,
  );
const from = (steps: any[], kind: string) =>
  steps.slice(steps.findIndex((s) => s.kind === kind));
const foeStrikes = (steps: any[], id: string) =>
  steps.filter((s) => s.kind === 'attack' && s.attacker.id === id);

describe('Vespera full kit', () => {
  const fight = useFight();

  // Her dance and its mirages roll: a test that needs them says so
  const rolling = (roll: number) =>
    jest.spyOn(Math, 'random').mockReturnValue(roll);
  beforeEach(() => {
    rolling(0.99);
  });
  const alone = (overrides = {}) =>
    fight([vespera], [dummy('foe', { attack: 10, ...overrides })]);
  // 220 - 40 defense = 180 a hit: 300, then 150, under half of 480
  const cornered = () =>
    fight(
      [vespera],
      [dummy('brute', { attack: 220, speed: 10, agility: 50, accuracy: 100 })],
    );

  describe(STING, () => {
    // 64 physical + 48 earth
    it('[VES-ATK-1] strikes for 80% physical and 60% earth', async () => {
      const steps = await alone();

      expect(named(steps, 'attack', STING)[0].damages[0]).toMatchObject({
        damage: 112,
        kind: ['PHYSICAL', 'EARTH'],
      });
    });

    it('[VES-ATK-2] poisons for 3% of the target max health a turn, for 3 turns', async () => {
      const steps = await alone();

      expect(poisonTicksOn(steps, 'foe')[0]).toMatchObject({
        damage: 300,
        remainingTurns: 2,
      });
    });

    it('[VES-ATK-3] adds one stack a sting, up to three', async () => {
      const steps = await alone();

      expect(
        poisonsOn(steps, 'foe')
          .slice(0, 4)
          .map((s) => s.stacks),
      ).toEqual([1, 2, 3, 3]);
    });

    it('[VES-ATK-3] doubles the tick at each stack: 3%, 6%, 12%', async () => {
      const steps = await alone();

      expect(
        poisonTicksOn(steps, 'foe')
          .slice(0, 3)
          .map((s) => s.damage),
      ).toEqual([300, 600, 1200]);
    });
  });

  describe(SWARM, () => {
    // Second in her deck, she aims at b, between a and c
    const swarming = () =>
      fight(
        [dummy('ally'), vespera],
        ['a', 'b', 'c', 'd'].map((id) => dummy(id, { defense: 100 })),
      );

    it('[VES-SPE-1] is cast on her fifth action, once 40 energy are charged', async () => {
      const steps = await alone();

      expect(actionsOf(steps, 'vespera').indexOf(SWARM)).toBe(4);
    });

    it('[VES-SPE-1] strikes up to three adjacent enemies', async () => {
      const steps = await swarming();

      expect(
        named(steps, 'special_attack', SWARM)[0].damages.map(
          (d) => d.defender.id,
        ),
      ).toEqual(['a', 'b', 'c']);
    });

    it('[VES-SPE-2] strikes for 100% physical', async () => {
      const steps = await alone();

      expect(named(steps, 'special_attack', SWARM)[0].damages[0]).toMatchObject(
        {
          damage: 80,
          kind: ['PHYSICAL'],
        },
      );
    });

    it('[VES-SPE-3] lays two stacks at once', async () => {
      const steps = await alone({ agility: 9999 });

      expect(poisonsOn(steps, 'foe')[0].stacks).toBe(2);
    });

    // 80 - 100 x 0.7
    it('[VES-SPE-4] ignores 30% of the enemy defense', async () => {
      const steps = await swarming();

      expect(named(steps, 'special_attack', SWARM)[0].damages[0].damage).toBe(
        10,
      );
    });

    it('[VES-SPE-4] cannot be dodged', async () => {
      const steps = await alone({ agility: 9999 });

      expect(
        named(steps, 'special_attack', SWARM)[0].damages.map((d) => d.dodge),
      ).toEqual([false]);
    });
  });

  describe(CARAPACE, () => {
    // An attacker her 75 agility outruns
    const dodging = () =>
      fight([vespera], [dummy('foe', { attack: 100, accuracy: 50 })]);

    it('[VES-CAR-1] hardens her defense by 8% and her dodge by 3% at each dodge', async () => {
      const steps = await dodging();

      expect(
        named(steps, 'buff', CARAPACE)
          .slice(0, 2)
          .map((s) => s.alterations[0]),
      ).toEqual([
        expect.objectContaining({ kind: 'defense', value: 3.2 }),
        expect.objectContaining({ kind: 'agility', value: 2.25 }),
      ]);
    });

    it('[VES-CAR-1] piles five charges at most', async () => {
      const steps = await dodging();

      expect(named(steps, 'buff', CARAPACE)).toHaveLength(10);
    });

    it('[VES-CAR-2] drops every charge at the first hit she takes', async () => {
      const steps = await cornered();

      expect(ofKind(steps, 'buff_removed')[0].eventName).toBe(
        'damage-taken-vespera',
      );
    });
  });

  describe(INSTINCT, () => {
    // 76 accuracy outruns her 75 agility, not 75 + 2% once the foe is poisoned
    it('[VES-INS-1] dodges better for each poisoned enemy', async () => {
      const steps = await alone({ accuracy: 76 });

      expect(foeStrikes(steps, 'foe')[0].damages[0].dodge).toBe(true);
    });

    it('[VES-INS-1] needs the poison: without it the same foe hits her', async () => {
      const unpoisoned = rosterCard('vespera', {
        skills: {
          ...vespera.skills,
          simpleAttack: { ...vespera.skills.simpleAttack, effects: [] },
        },
      });
      const steps = await fight(
        [unpoisoned],
        [dummy('foe', { attack: 10, accuracy: 76 })],
      );

      expect(foeStrikes(steps, 'foe')[0].damages[0].dodge).toBe(false);
    });

    // The weakling lasts two stings, while the prey hurts her 160 a hit
    it('[VES-INS-2] heals her 15% of her max health when a poisoned enemy falls', async () => {
      const steps = await fight(
        [vespera],
        [dummy('weakling', { health: 300 }), dummy('prey', { attack: 200 })],
      );

      expect(named(steps, 'healing', INSTINCT)[0].heal[0].healed).toBe(72);
    });
  });

  describe(DANCE, () => {
    it('[VES-DAN-1] sharpens her dodge by 40% for 2 turns', async () => {
      rolling(0.2);
      const steps = await alone();

      expect(named(steps, 'buff', DANCE)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'agility',
          value: 30,
          remainingTurns: 2,
        }),
      ]);
    });

    it('[VES-DAN-2] stings back the attacker she dodged while dancing', async () => {
      rolling(0.2);
      const steps = await alone();

      expect(named(steps, 'attack', COUNTER)[0].damages[0]).toMatchObject({
        defender: expect.objectContaining({ id: 'foe' }),
        damage: 112,
      });
    });

    it('[VES-DAN-3] makes an attack miss her on a roll under 50%', async () => {
      rolling(0.3);
      const steps = await alone();

      expect(
        foeStrikes(from(steps, 'stance_started'), 'foe')[0].damages[0].dodge,
      ).toBe(true);
    });

    // At 60%, the dance opens on her seventh turn, when its chance reaches 65%
    it('[VES-DAN-3] lets an attack land on a roll of 50% or more', async () => {
      rolling(0.6);
      const steps = await alone();

      expect(
        foeStrikes(from(steps, 'stance_started'), 'foe')[0].damages[0].dodge,
      ).toBe(false);
    });

    it('[VES-DAN-4] opens on her third turn at 25%', async () => {
      rolling(0.2);
      const steps = await alone();
      const opened = steps.findIndex((s) => s.kind === 'stance_started');

      expect(named(steps.slice(0, opened), 'attack', STING)).toHaveLength(3);
    });

    it('[VES-DAN-4] gains 10% at each turn it does not open', async () => {
      rolling(0.3);
      const steps = await alone();
      const opened = steps.findIndex((s) => s.kind === 'stance_started');

      expect(named(steps.slice(0, opened), 'attack', STING)).toHaveLength(4);
    });

    it('[VES-DAN-4] never opens before her third turn', async () => {
      rolling(0);
      const steps = await alone();
      const opened = steps.findIndex((s) => s.kind === 'stance_started');

      expect(named(steps.slice(0, opened), 'attack', STING)).toHaveLength(3);
    });
  });

  describe(QUEEN, () => {
    it('[VES-REI-1] rises once under half her health, for 4 turns', async () => {
      const steps = await cornered();

      expect(named(steps, 'transformation_started', QUEEN)).toEqual([
        expect.objectContaining({ remainingTurns: 4 }),
      ]);
    });

    it('[VES-REI-1] rises on the blow that drops her under half', async () => {
      const steps = await cornered();
      const risen = steps.findIndex((s) => s.kind === 'transformation_started');

      expect(steps[risen - 1].damages[0].remainingHealth).toBe(150);
    });

    it('[VES-REI-2] makes her untouchable for her first turn', async () => {
      const steps = await cornered();

      expect(
        foeStrikes(from(steps, 'transformation_started'), 'brute')[0].damages[0]
          .dodge,
      ).toBe(true);
    });

    it('[VES-REI-2] lasts one turn', async () => {
      const steps = await cornered();

      expect(
        ofKind(steps, 'stance_started').find((s) => s.name === 'intouchable')
          .remainingTurns,
      ).toBe(1);
    });

    // She evades every attack meanwhile: no control could reach her to refuse
    it('[VES-REI-2] grants her an immunity to control', async () => {
      const queen = vespera.skills.others.find((s) => s.name === QUEEN);

      expect(
        queen.stanceActivations.find((s) => s.name === 'intouchable'),
      ).toMatchObject({ immunities: ['control'], evasionChance: 1 });
    });

    it('[VES-REI-3] carries every poison on the board to three stacks', async () => {
      const steps = await cornered();

      expect(
        poisonsOn(from(steps, 'transformation_started'), 'brute')[0].stacks,
      ).toBe(3);
    });

    // 3 stacks: 3% x 4 = 12% of 10000, doubled
    it('[VES-REI-3] doubles their damage', async () => {
      const steps = await cornered();

      expect(
        poisonTicksOn(from(steps, 'transformation_started'), 'brute')[0].damage,
      ).toBe(2400);
    });

    it('[VES-REI-4] takes 5% of every enemy max health a turn', async () => {
      const steps = await cornered();

      expect(named(steps, 'attack', ZONE)[0].damages[0].damage).toBe(500);
    });

    it('[VES-REI-4] lowers the dodge of the enemies by 20%', async () => {
      const steps = await cornered();

      expect(named(steps, 'debuff', QUEEN)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'agility',
          value: 10,
          remainingTurns: 4,
        }),
      ]);
    });

    it('[VES-REI-5] poisons every enemy with five stacks when she falls', async () => {
      const steps = await cornered();
      const death = steps.findIndex(
        (s) => s.kind === 'status_change' && s.status === 'dead',
      );

      expect(steps[death + 1]).toMatchObject({ status: 'poison', stacks: 5 });
    });

    it('[VES-REI-5] goes through a poison immunity', async () => {
      const explosion = vespera.skills.others.find(
        (s) => s.name === EXPLOSION && s.kind === 'AFFLICTION',
      );

      expect(explosion.effect.ignoresImmunity).toBe(true);
    });

    it('[VES-REI-5] blinds the enemies by 40% for the rest of the fight', async () => {
      const steps = await cornered();

      expect(named(steps, 'debuff', EXPLOSION)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'accuracy',
          value: 40,
          remainingTurns: null,
        }),
      ]);
    });
  });

  describe('rejecting a malformed kit', () => {
    it('refuses a stacked poison without its stack multiplier', async () => {
      const { stackMultiplier: _dropped, ...venom } =
        vespera.skills.simpleAttack.effects[0];
      const stinger = { ...vespera.skills.simpleAttack, effects: [venom] };

      await fight
        .post(
          [
            {
              ...vespera,
              skills: { ...vespera.skills, simpleAttack: stinger },
            },
          ],
          [dummy('prey')],
        )
        .expect(400);
    });

    it('refuses a ramping chance on another kind than STANCE', async () => {
      const [carapace] = vespera.skills.others;
      const rampingChance = { startChance: 0.25, increment: 0.1, fromTurn: 3 };
      const others = [{ ...carapace, rampingChance }];

      await fight
        .post(
          [{ ...vespera, skills: { ...vespera.skills, others } }],
          [dummy('prey')],
        )
        .expect(400);
    });
  });
});

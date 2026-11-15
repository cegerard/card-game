import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '../../..');
const exists = (path: string) => existsSync(join(root, path));
const read = (path: string) =>
  exists(path) ? readFileSync(join(root, path), 'utf-8') : '';

const roster: any[] = JSON.parse(read('samples/cards.json'));

const kitPath = (id: string) => `samples/kits/${id}.md`;
const specPath = (id: string) => `test/fight/${id}-kit.e2e-spec.ts`;

const EFFECT_ID = /\[([A-Z]{3}-[A-Z]{3}-\d+)\]/g;
// Only an `it` title counts as testing an effect, not a comment quoting it
const TESTED_ID = /\bit\(\s*['"`]\[([A-Z]{3}-[A-Z]{3}-\d+)\]/g;

const matches = (text: string, pattern: RegExp) =>
  [...text.matchAll(pattern)].map((match) => match[1]);
const missingFrom = (expected: string[], actual: string[]) =>
  expected.filter((item) => !actual.includes(item));

function jsonBlock(kit: string, name: string) {
  const block = kit.match(
    new RegExp(`\`\`\`json ${name}\\n([\\s\\S]*?)\\n\`\`\``),
  );
  return block ? JSON.parse(block[1]) : undefined;
}

// Notion stats the engine does not follow yet, with the engine values
const statGaps = (kit: string) => jsonBlock(kit, 'kit-stat-gaps') ?? {};

function cardStats(card: any) {
  const { attack, defense, health, speed, agility, accuracy } = card;
  const { criticalChance, regeneration, resistance, element } = card;
  const stats = {
    ...{ attack, defense, health, speed, agility, accuracy },
    ...{ criticalChance, regeneration, resistance, element },
    specialEnergy: card.skills.special.energy,
  };
  // A stat the card leaves out reads null, as JSON can write it
  return Object.fromEntries(
    Object.entries(stats).map(([stat, value]) => [stat, value ?? null]),
  );
}

function skillNames(card: any): string[] {
  const { special, simpleAttack, multipleAttack, others } = card.skills;
  return [
    special.name,
    (simpleAttack ?? multipleAttack).name,
    ...others.map((skill) => skill.name),
  ];
}

describe('Kit traceability', () => {
  // A kit exported ahead of its card would otherwise sit there untested
  it('exports kits for roster cards only', () => {
    const kits = readdirSync(join(root, 'samples/kits')).map((file) =>
      file.replace(/\.md$/, ''),
    );

    expect(
      missingFrom(
        kits,
        roster.map((card) => card.id),
      ),
    ).toEqual([]);
  });

  describe.each(roster)('$id', (card) => {
    const kit = read(kitPath(card.id));
    const spec = read(specPath(card.id));
    const kitIds = matches(kit, EFFECT_ID);

    it('has its Notion kit exported in samples/kits', () => {
      expect(exists(kitPath(card.id))).toBe(true);
    });

    it('has its kit spec in test/fight', () => {
      expect(exists(specPath(card.id))).toBe(true);
    });

    it('carries the stats of its kit, documented gaps aside', () => {
      expect(cardStats(card)).toEqual({
        ...jsonBlock(kit, 'kit-stats'),
        ...statGaps(kit),
      });
    });

    it('documents as gaps only stats that differ from its kit', () => {
      const notion = jsonBlock(kit, 'kit-stats') ?? {};
      const gaps = statGaps(kit);

      expect(
        Object.keys(gaps).filter((stat) => gaps[stat] === notion[stat]),
      ).toEqual([]);
    });

    it('gives each effect of its kit its own id', () => {
      expect(kitIds.filter((id, i) => kitIds.indexOf(id) !== i)).toEqual([]);
    });

    it('tests every effect of its kit', () => {
      expect(missingFrom(kitIds, matches(spec, TESTED_ID))).toEqual([]);
    });

    it('tests no effect missing from its kit', () => {
      expect(missingFrom(matches(spec, TESTED_ID), kitIds)).toEqual([]);
    });

    it('names every skill of the card in its spec', () => {
      expect(skillNames(card).filter((name) => !spec.includes(name))).toEqual(
        [],
      );
    });
  });
});

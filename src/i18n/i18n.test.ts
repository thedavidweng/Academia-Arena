import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import en from './en.json';
import zh from './zh.json';

const sourceFiles = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) return sourceFiles(path);
  return /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
});

const keysOf = (dictionary: object) => Object.keys(dictionary).sort();
const source = sourceFiles(join(import.meta.dirname, '..'))
  .map(path => readFileSync(path, 'utf8')).join('\n');

describe('translations', () => {
  it('has the same keys in both languages', () => {
    expect(keysOf(zh)).toEqual(keysOf(en));
  });

  it('has no empty values and no accidentally identical translations', () => {
    for (const [key, value] of Object.entries({ ...en, ...zh })) {
      expect(typeof value, key).toBe('string');
      expect((value as string).trim(), key).not.toBe('');
    }
    // Technical labels are intentionally identical in both languages.
    const identical = ['app.version'];
    expect(Object.entries(zh).filter(([key, value]) =>
      value === (en as never)[key] && !identical.includes(key)
    )).toEqual([]);
  });

  it('defines every literal key used in components', () => {
    const used = new Set(
      [...source.matchAll(/\bt\(\s*'([a-zA-Z][\w.]*)'/g)].map(m => m[1])
    );
    const missing = [...used].filter(key => !(key in en));
    expect(missing).toEqual([]);
  });

  it('defines every dynamic field and log key the engine emits', () => {
    const dynamic = [
      ...['Presentations', 'Assignments', 'Exams'].map(field => `field.${field}`),
      ...['play', 'draw', 'boost', 'remove', 'negate', 'synergySuccess', 'synergyFailure',
        'pass', 'probabilityLock', 'statusOverride', 'drawCard', 'adhd', 'tie', 'roundWinner']
        .map(name => `log.${name}`),
      ...['drawCard', 'boostField', 'removeSynergyCard'].map(name => `effect.${name}`),
      ...['probabilityLock', 'statusOverride', 'drawCard'].map(name => `stamina.${name}`),
    ];
    expect(dynamic.filter(key => !(key in en) || !(key in zh))).toEqual([]);
  });

  it('keeps log placeholders identical across languages', () => {
    const placeholders = (value: string) =>
      [...value.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]).sort();
    for (const key of keysOf(en).filter(k => k.startsWith('log.'))) {
      expect(placeholders((zh as never)[key]), key).toEqual(placeholders((en as never)[key]));
    }
  });

  it('has no key that no component or engine path can reach', () => {
    const reachable = new Set([
      ...[...source.matchAll(/\bt\(\s*'([a-zA-Z][\w.]*)'/g)].map(m => m[1]),
      ...[...source.matchAll(/\bt\(\s*[\w.]+ \? '([a-zA-Z][\w.]*)' : '([a-zA-Z][\w.]*)'/g)]
        .flatMap(m => [m[1], m[2]]),
      ...['Presentations', 'Assignments', 'Exams'].map(field => `field.${field}`),
      ...['play', 'draw', 'boost', 'remove', 'negate', 'synergySuccess', 'synergyFailure',
        'pass', 'probabilityLock', 'statusOverride', 'drawCard', 'adhd', 'tie', 'roundWinner']
        .map(name => `log.${name}`),
      ...['drawCard', 'boostField', 'removeSynergyCard'].map(name => `effect.${name}`),
      ...['probabilityLock', 'statusOverride', 'drawCard'].map(name => `stamina.${name}`),
    ]);
    expect(keysOf(en).filter(key => !reachable.has(key))).toEqual([]);
  });
});

import { describe, expect, it } from 'bun:test';
import en from './en.json';
import zh from './zh.json';

const keysOf = (dictionary: object) => Object.keys(dictionary).sort();

describe('translations', () => {
  it('has the same keys in both languages', () => {
    expect(keysOf(zh)).toEqual(keysOf(en));
  });

  it('has no empty values', () => {
    for (const dictionary of [en, zh]) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(typeof value, key).toBe('string');
        expect(value.trim(), key).not.toBe('');
      }
    }
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

});

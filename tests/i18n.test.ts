import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  dictionaries,
  languageNames,
  type LanguageCode,
} from '@/i18n/translations';

const ALL_LANGUAGES: LanguageCode[] = ['en', 'zu', 'af', 'tn', 'sw', 'fr', 'de'];

describe('i18n multi-language dictionaries (#5)', () => {
  const enKeys = Object.keys(dictionaries.en);

  it('defines display names for all 7 supported languages', () => {
    for (const lang of ALL_LANGUAGES) {
      assert.ok(languageNames[lang] && languageNames[lang].trim().length > 0, `Missing name for ${lang}`);
    }
  });

  it('ensures 100% key parity across en, zu, af, tn, sw, fr, and de', () => {
    for (const lang of ALL_LANGUAGES) {
      const langDict = dictionaries[lang];
      assert.ok(langDict, `Dictionary missing for ${lang}`);
      for (const key of enKeys) {
        const value = langDict[key];
        assert.equal(
          typeof value,
          'string',
          `Language "${lang}" is missing translation key "${key}"`
        );
        assert.ok(
          value.trim().length > 0,
          `Language "${lang}" has empty translation for key "${key}"`
        );
      }
    }
  });

  it('preserves interpolation placeholders ({name}, {count}, {limit}) across all languages', () => {
    const placeholderRegex = /\{[a-zA-Z0-9_]+\}/g;
    for (const key of enKeys) {
      const enPlaceholders = (dictionaries.en[key].match(placeholderRegex) ?? []).sort();
      if (enPlaceholders.length === 0) continue;

      for (const lang of ALL_LANGUAGES) {
        const langPlaceholders = (dictionaries[lang][key].match(placeholderRegex) ?? []).sort();
        assert.deepEqual(
          langPlaceholders,
          enPlaceholders,
          `Placeholder mismatch in "${lang}" for key "${key}": expected ${enPlaceholders.join(', ')}, got ${langPlaceholders.join(', ')}`
        );
      }
    }
  });
});

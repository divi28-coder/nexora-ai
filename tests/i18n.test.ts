import { describe, expect, it } from 'vitest';
import { languages, translate } from '../lib/i18n';

describe('localization foundations', () => {
  it('supports the six requested interface language choices', () => {
    expect(languages.map(language => language.code)).toEqual(['en', 'ta', 'hi', 'te', 'kn', 'ml']);
  });
  it('translates core navigation and falls back to English for missing labels', () => {
    expect(translate('Settings', 'ta')).toBe('அமைப்புகள்');
    expect(translate('Settings', 'hi')).toBe('सेटिंग्स');
    expect(translate('An untranslated label', 'ml')).toBe('An untranslated label');
    expect(translate('Settings', 'unsupported')).toBe('Settings');
  });
});

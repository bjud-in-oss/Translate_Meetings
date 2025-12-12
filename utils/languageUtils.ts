import { Language } from '../types';

export const LANGUAGE_ISO_MAP: Record<string, string> = {
  [Language.AFRIKAANS]: 'af',
  [Language.ARABIC]: 'ar',
  [Language.BENGALI]: 'bn',
  [Language.BULGARIAN]: 'bg',
  [Language.CATALAN]: 'ca',
  [Language.CHINESE_MANDARIN]: 'zh',
  [Language.CHINESE_CANTONESE]: 'yue',
  [Language.CROATIAN]: 'hr',
  [Language.CZECH]: 'cs',
  [Language.DANISH]: 'da',
  [Language.DUTCH]: 'nl',
  [Language.ENGLISH]: 'en',
  [Language.ESTONIAN]: 'et',
  [Language.FILIPINO]: 'fil',
  [Language.FINNISH]: 'fi',
  [Language.FRENCH]: 'fr',
  [Language.GERMAN]: 'de',
  [Language.GREEK]: 'el',
  [Language.GUJARATI]: 'gu',
  [Language.HEBREW]: 'he',
  [Language.HINDI]: 'hi',
  [Language.HUNGARIAN]: 'hu',
  [Language.ICELANDIC]: 'is',
  [Language.INDONESIAN]: 'id',
  [Language.ITALIAN]: 'it',
  [Language.JAPANESE]: 'ja',
  [Language.KANNADA]: 'kn',
  [Language.KOREAN]: 'ko',
  [Language.LATVIAN]: 'lv',
  [Language.LITHUANIAN]: 'lt',
  [Language.MALAY]: 'ms',
  [Language.MALAYALAM]: 'ml',
  [Language.MARATHI]: 'mr',
  [Language.NORWEGIAN]: 'no',
  [Language.PERSIAN]: 'fa',
  [Language.POLISH]: 'pl',
  [Language.PORTUGUESE]: 'pt',
  [Language.ROMANIAN]: 'ro',
  [Language.RUSSIAN]: 'ru',
  [Language.SERBIAN]: 'sr',
  [Language.SLOVAK]: 'sk',
  [Language.SLOVENIAN]: 'sl',
  [Language.SPANISH]: 'es',
  [Language.SWAHILI]: 'sw',
  [Language.SWEDISH]: 'sv',
  [Language.TAMIL]: 'ta',
  [Language.TELUGU]: 'te',
  [Language.THAI]: 'th',
  [Language.TURKISH]: 'tr',
  [Language.UKRAINIAN]: 'uk',
  [Language.URDU]: 'ur',
  [Language.VIETNAMESE]: 'vi',
  [Language.WELSH]: 'cy'
};

export function getLanguageFromBrowser(): Language | null {
  if (!navigator.language) return null;
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  
  // Find key by value
  const entry = Object.entries(LANGUAGE_ISO_MAP).find(([key, val]) => val === browserLang);
  if (entry) {
    return entry[0] as Language;
  }
  return null;
}
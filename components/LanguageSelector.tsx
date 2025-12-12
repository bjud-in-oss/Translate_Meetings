


import React, { useMemo } from 'react';
import { Language } from '../types';
import { LANGUAGE_ISO_MAP } from '../utils/languageUtils';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onSelect: (lang: Language) => void;
  disabled: boolean;
  label: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onSelect, disabled, label }) => {
  
  // Memoize the display names to avoid re-calculating on every render
  const languageOptions = useMemo(() => {
    try {
      // Determine locale based on BROWSER language (UI Language)
      // This ensures the list is presented in the user's interface language, 
      // not translated into the target language they are selecting.
      const browserLocales = navigator.languages ? [...navigator.languages] : [navigator.language];
      const displayNames = new Intl.DisplayNames(browserLocales, { type: 'language' });

      return Object.values(Language).map((langEnum) => {
        const isoCode = LANGUAGE_ISO_MAP[langEnum];
        let localizedName = '';

        if (isoCode) {
          try {
            // Translate the ISO code to the UI language
            const translated = displayNames.of(isoCode);
            // Only add if different from the primary name to avoid "Swedish (Swedish)"
            if (translated && translated.toLowerCase() !== langEnum.toLowerCase()) {
                // Capitalize first letter just in case
                localizedName = translated.charAt(0).toUpperCase() + translated.slice(1);
            }
          } catch (e) {
            // Fallback if code is invalid
          }
        }

        return {
          value: langEnum,
          label: localizedName ? `${langEnum} (${localizedName})` : langEnum
        };
      });
    } catch (error) {
      // Fallback if Intl is not supported
      return Object.values(Language).map(lang => ({ value: lang, label: lang }));
    }
  }, []);

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-slate-400">{label}</label>
      <select
        value={selectedLanguage}
        onChange={(e) => onSelect(e.target.value as Language)}
        disabled={disabled}
        className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 disabled:opacity-50"
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
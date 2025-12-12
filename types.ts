
export enum Language {
  AFRIKAANS = 'Afrikaans',
  ARABIC = 'Arabic',
  BENGALI = 'Bengali',
  BULGARIAN = 'Bulgarian',
  CATALAN = 'Catalan',
  CHINESE_MANDARIN = 'Chinese (Mandarin)',
  CHINESE_CANTONESE = 'Chinese (Cantonese)',
  CROATIAN = 'Croatian',
  CZECH = 'Czech',
  DANISH = 'Danish',
  DUTCH = 'Dutch',
  ENGLISH = 'English',
  ESTONIAN = 'Estonian',
  FILIPINO = 'Filipino',
  FINNISH = 'Finnish',
  FRENCH = 'French',
  GERMAN = 'German',
  GREEK = 'Greek',
  GUJARATI = 'Gujarati',
  HEBREW = 'Hebrew',
  HINDI = 'Hindi',
  HUNGARIAN = 'Hungarian',
  ICELANDIC = 'Icelandic',
  INDONESIAN = 'Indonesian',
  ITALIAN = 'Italian',
  JAPANESE = 'Japanese',
  KANNADA = 'Kannada',
  KOREAN = 'Korean',
  LATVIAN = 'Latvian',
  LITHUANIAN = 'Lithuanian',
  MALAY = 'Malay',
  MALAYALAM = 'Malayalam',
  MARATHI = 'Marathi',
  NORWEGIAN = 'Norwegian',
  PERSIAN = 'Persian',
  POLISH = 'Polish',
  PORTUGUESE = 'Portuguese',
  ROMANIAN = 'Romanian',
  RUSSIAN = 'Russian',
  SERBIAN = 'Serbian',
  SLOVAK = 'Slovak',
  SLOVENIAN = 'Slovenian',
  SPANISH = 'Spanish',
  SWAHILI = 'Swahili',
  SWEDISH = 'Swedish',
  TAMIL = 'Tamil',
  TELUGU = 'Telugu',
  THAI = 'Thai',
  TURKISH = 'Turkish',
  UKRAINIAN = 'Ukrainian',
  URDU = 'Urdu',
  VIETNAMESE = 'Vietnamese',
  WELSH = 'Welsh'
}

export enum TranslationMode {
  SEQUENTIAL = 'sequential',   
  SIMULTANEOUS = 'simultaneous', 
  // Legacy modes retained for Wizard compatibility
  FLUID = 'fluid',
  PRESENTATION = 'presentation'
}

// Fluid and Presentation are now Tempos/Styles, not separate logic modes
export type TranslationTempo = 'standard' | 'fast' | 'presentation';

export interface AudioConfig {
  sampleRate: number;
}

export const INPUT_SAMPLE_RATE = 16000;
export const OUTPUT_SAMPLE_RATE = 24000;

export interface TranscriptItem {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isFinal?: boolean;
}

// UI Translation Interface
export interface UIText {
  dashboard: {
    yourLanguageLabel: string;
    modeLabel: string;
    modeSimultaneous: string;
    modeTakeTurns: string;
    tempoLabel: string;
    tempoStandard: string;
    tempoFast: string;
    tempoPresentation: string;
    textModeLabel: string;
    pinPlaceholder: string;
    micLabel: string;
    triggerLabel: string;
    speakerLabel: string;
    statusReady: string;
    statusListening: string;
    statusTranslating: string;
    statusPaused: string;
    buttonStart: string; // "GO LIVE" or similar
    buttonStop: string;  // "MUTE"
  };
  loadingOverlay: {
    translating: string;
  };
  languageStep: {
    title: string;
    subtitle: string;
    yourLanguageLabel: string;
    nextButton: string;
  };
  modeStep: {
    title: string;
    subtitleTemplate: string;
    categoryConversationalTitle: string;
    categoryConversationalDesc: string;
    subOptionSequential: string;
    subOptionFluid: string;
    subOptionPresentation: string;
    categorySimultaneousTitle: string;
    categorySimultaneousDesc: string;
    subOptionAudio: string;
    subOptionText: string;
    pinPrompt: string;
    pinError: string;
    backButton: string;
    nextButton: string;
  };
  groupStep: {
    title: string;
    subtitle: string;
    smallTitle: string;
    smallDesc: string;
    smallDetail: string;
    largeTitle: string;
    largeDesc: string;
    largeDetail: string;
    backButton: string;
    nextButton: string;
  };
  sessionStep: Record<string, string>; 
  audioStep: {
    title: string;
    subtitle: string;
    micLabel: string;
    triggerLabel: string;
    triggerDesc: string;
    speakerLabel: string;
    backButton: string;
    startButton: string;
  };
  hostStep: {
    title: string;
    connectLabel: string;
    statusLabel: string;
    targetLabel: string;
    switchButton: string;
    backButton: string;
  };
}

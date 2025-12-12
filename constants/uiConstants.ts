
import { UIText } from '../types';

export const DEFAULT_UI_TEXT: UIText = {
  dashboard: {
    yourLanguageLabel: "What is your language?",
    modeLabel: "When should the translator talk?",
    modeSimultaneous: "Talk continuously",
    modeTakeTurns: "Take turns talking",
    tempoLabel: "Tempo & Style",
    tempoStandard: "Standard",
    tempoFast: "Fast",
    tempoPresentation: "Presentation",
    textModeLabel: "Use Text Mode",
    pinPlaceholder: "PIN",
    micLabel: "Microphone Input",
    triggerLabel: "Trigger Input (Optional)",
    speakerLabel: "Audio Output (Speaker)",
    statusReady: "Ready to Connect",
    statusListening: "Listening...",
    statusTranslating: "Translating...",
    statusPaused: "PRESS TO UNMUTE",
    buttonStart: "GO LIVE",
    buttonStop: "MUTE (STANDBY)"
  },
  loadingOverlay: {
    translating: "Translating UI..."
  },
  languageStep: {
    title: "Select Language",
    subtitle: "Choose the language you want to hear.",
    yourLanguageLabel: "What is your language?",
    nextButton: "Next"
  },
  modeStep: {
    title: "Select Mode",
    subtitleTemplate: "How do you want to translate to {{lang}}?",
    categoryConversationalTitle: "Conversational",
    categoryConversationalDesc: "Take turns speaking.",
    subOptionSequential: "Sequential",
    subOptionFluid: "Fluid",
    subOptionPresentation: "Presentation",
    categorySimultaneousTitle: "Simultaneous",
    categorySimultaneousDesc: "Translate while listening.",
    subOptionAudio: "Audio",
    subOptionText: "Text",
    pinPrompt: "Enter PIN",
    pinError: "Incorrect PIN",
    backButton: "Back",
    nextButton: "Next"
  },
  groupStep: {
    title: "Acoustic Environment",
    subtitle: "Optimize microphone sensitivity.",
    smallTitle: "Small Group",
    smallDesc: "Software Boost",
    smallDetail: "Digital Pre-Amp enabled. Best for quiet rooms.",
    largeTitle: "Large Group",
    largeDesc: "Hardware AGC",
    largeDetail: "Uses device auto-gain. Best for loud rooms/PA.",
    backButton: "Back",
    nextButton: "Next"
  },
  sessionStep: {
    title: "Active Session"
  },
  audioStep: {
    title: "Audio Setup",
    subtitle: "Select your input and output devices.",
    micLabel: "Microphone",
    triggerLabel: "Trigger Mic",
    triggerDesc: "Optional secondary mic for VAD triggering.",
    speakerLabel: "Speaker",
    backButton: "Back",
    startButton: "Start Session"
  },
  hostStep: {
    title: "Host Admin",
    connectLabel: "Gateway URL",
    statusLabel: "Status",
    targetLabel: "NDI Target",
    switchButton: "Switch",
    backButton: "Close"
  }
};


import { GoogleGenAI } from '@google/genai';
import { UIText, Language } from '../types';

// Hardcoded Swedish translations for instant loading
const SWEDISH_UI_TEXT: UIText = {
  dashboard: {
    yourLanguageLabel: "Vilket är ditt språk?",
    modeLabel: "När ska tolken prata?",
    modeSimultaneous: "Prata kontinuerligt",
    modeTakeTurns: "Turas om att prata",
    tempoLabel: "Tempo & Stil",
    tempoStandard: "Standard",
    tempoFast: "Snabb",
    tempoPresentation: "Presentation",
    textModeLabel: "Använd Textläge",
    pinPlaceholder: "PIN",
    micLabel: "Mikrofoningång",
    triggerLabel: "Triggeringång (Tillval)",
    speakerLabel: "Ljudutgång (Högtalare)",
    statusReady: "Redo att ansluta",
    statusListening: "Lyssnar...",
    statusTranslating: "Översätter...",
    statusPaused: "TRYCK FÖR ATT STARTA",
    buttonStart: "GÅ LIVE",
    buttonStop: "TYSTA (VILOLÄGE)"
  },
  loadingOverlay: {
    translating: "Översätter gränssnitt..."
  },
  languageStep: {
    title: "Välj Språk",
    subtitle: "Välj det språk du vill höra.",
    yourLanguageLabel: "Ditt Språk",
    nextButton: "Nästa"
  },
  modeStep: {
    title: "Välj Läge",
    subtitleTemplate: "Hur vill du översätta till {{lang}}?",
    categoryConversationalTitle: "Konversation",
    categoryConversationalDesc: "Turas om att tala.",
    subOptionSequential: "Sekventiell",
    subOptionFluid: "Flytande",
    subOptionPresentation: "Presentation",
    categorySimultaneousTitle: "Simultan",
    categorySimultaneousDesc: "Översätt medan du lyssnar.",
    subOptionAudio: "Ljud",
    subOptionText: "Text",
    pinPrompt: "Ange PIN",
    pinError: "Felaktig PIN",
    backButton: "Tillbaka",
    nextButton: "Nästa"
  },
  groupStep: {
    title: "Akustisk Miljö",
    subtitle: "Optimera mikrofonens känslighet.",
    smallTitle: "Liten Grupp",
    smallDesc: "Mjukvaruboost",
    smallDetail: "Digital förförstärkare aktiverad. Bäst för tysta rum.",
    largeTitle: "Stor Grupp",
    largeDesc: "Hårdvaru-AGC",
    largeDetail: "Använder enhetens automatisk förstärkning. Bäst för högljudda rum/PA.",
    backButton: "Tillbaka",
    nextButton: "Nästa"
  },
  sessionStep: {
    title: "Aktiv Session"
  },
  audioStep: {
    title: "Ljudinställningar",
    subtitle: "Välj dina in- och utenheter.",
    micLabel: "Mikrofon",
    triggerLabel: "Triggermikrofon",
    triggerDesc: "Valfri sekundär mikrofon för VAD-styrning.",
    speakerLabel: "Högtalare",
    backButton: "Tillbaka",
    startButton: "Starta Session"
  },
  hostStep: {
    title: "Värdadmin",
    connectLabel: "Gateway URL",
    statusLabel: "Status",
    targetLabel: "NDI Mål",
    switchButton: "Växla",
    backButton: "Stäng"
  }
};

export class UITranslationService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("MISSING API KEY.");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey as string });
  }

  async translateUI(targetLanguage: Language, baseText: UIText): Promise<UIText> {
    // Return base text immediately for English
    if (targetLanguage === Language.ENGLISH) return baseText;
    
    // Return hardcoded text immediately for Swedish
    if (targetLanguage === Language.SWEDISH) return SWEDISH_UI_TEXT;

    const prompt = `Translate the following UI text JSON structure into ${targetLanguage}. 
    Keep the keys exactly the same. Translate the values to be natural and user-friendly in ${targetLanguage}.
    Preserve short and concise phrasing suitable for buttons and labels.
    
    JSON:
    ${JSON.stringify(baseText, null, 2)}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from translation model");
      
      return JSON.parse(text) as UIText;
    } catch (error) {
      console.error("UI Translation failed:", error);
      // Fallback to base text if translation fails
      return baseText;
    }
  }
}

export const uiTranslationService = new UITranslationService();

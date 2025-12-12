
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Language, TranslationMode, TranslationTempo } from '../types';
import { storageService } from './storageService';
import { RAG_CONTEXT_MD } from '../specs/rag_context';

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any = null;
  private isConnecting: boolean = false;
  
  constructor() {
    // Support both Vite env (Netlify) and process.env (AI Studio)
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        console.error("MISSING API KEY");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey as string });
  }

  async connect(
    targetLanguage: Language,
    mode: TranslationMode,
    tempo: TranslationTempo,
    enableTranscription: boolean,
    onOpen: () => void,
    onMessage: (message: LiveServerMessage) => void,
    onError: (e: ErrorEvent) => void,
    onClose: (e: CloseEvent) => void
  ): Promise<any> {
    
    // CRITICAL FIX: Prevent race conditions with a lock
    if (this.isConnecting) {
        console.warn("GeminiLiveService: Connection already in progress. Ignoring request.");
        return null;
    }
    this.isConnecting = true;

    // Ensure no ghost sessions exist
    if (this.session) {
        console.warn("GeminiLiveService: Detected active session during connect. Forcing disconnect.");
        await this.disconnect();
    }

    try {
        let systemInstruction = "";

        // Strictly defined bi-directional rules
        const baseInstruction = `You are a professional bi-directional interpreter acting as a bridge between Swedish and ${targetLanguage}.

        CRITICAL RULES:
        1. LISTEN: Identify if the incoming audio is Swedish or ${targetLanguage}.
        2. TRANSLATE:
           - If input is SWEDISH -> You MUST translate to ${targetLanguage.toUpperCase()}.
           - If input is ${targetLanguage.toUpperCase()} -> You MUST translate to SWEDISH.
        3. BEHAVIOR:
           - Do NOT answer the user's questions. Only translate what they said.
           - Do NOT reply in the same language as the input. ALWAYS switch languages.
        `;

        // 1. MODE INSTRUCTIONS (Architecture)
        if (mode === TranslationMode.SEQUENTIAL || mode === TranslationMode.FLUID || mode === TranslationMode.PRESENTATION) {
          systemInstruction = `${baseInstruction}
          
          MODE: CONVERSATIONAL (TURNS)
          - WAIT until the speaker has completely finished their sentence (detect silence) before speaking.
          - Do NOT interrupt.`;
          
        } else if (mode === TranslationMode.SIMULTANEOUS) {
          systemInstruction = `${baseInstruction}
          
          MODE: SIMULTANEOUS (STREAMING)
          - You are working in a HALF-DUPLEX setup. You receive audio in BURSTS.
          - Translate the burst you received immediately. Do not wait for more context.`;
        }

        // 2. TEMPO INSTRUCTIONS (Style)
        let effectiveTempo = tempo;
        if (mode === TranslationMode.FLUID) effectiveTempo = 'fast';
        if (mode === TranslationMode.PRESENTATION) effectiveTempo = 'presentation';

        if (effectiveTempo === 'fast') {
            systemInstruction += `\n
            STYLE: FAST / FLUID
            - Speak significantly FASTER than normal conversation. Be concise.
            - Translate continuously in small segments.
            - Sacrifice some grammar/formality for speed if necessary.`;
        } else if (effectiveTempo === 'presentation') {
            systemInstruction += `\n
            STYLE: PRESENTATION / SHADOWING
            - Act as a Shadow Interpreter for a sermon or speech.
            - PRIORITY: Preserve the speaker's tone, emotion, and solemnity.
            - Maintain a calm, steady flow. Finish your thought even if new audio is coming in.`;
        } else {
            // Standard
            systemInstruction += `\n
            STYLE: STANDARD
            - Use a natural, conversational tone.
            - Prioritize accuracy and clarity.`;
        }

        // --- RAG CONTEXT INJECTION (TASK 13) ---
        let ragContent = "";
        try {
            const savedSpecs = await storageService.loadSpecs();
            if (savedSpecs) {
                 Object.keys(savedSpecs).forEach(key => {
                     if (key.startsWith('rag_') || key.startsWith('context/')) {
                         ragContent += `\n\n--- ${key} ---\n${savedSpecs[key]}`;
                     }
                 });
            }
        } catch (e) {
            console.warn("Could not load RAG from DB", e);
        }

        if (!ragContent.trim()) {
             ragContent = `\n\n--- rag_context.md ---\n${RAG_CONTEXT_MD}`;
        }

        systemInstruction += `\n\n# CONTEXT & TERMINOLOGY (RAG)\n${ragContent}`;
        // ----------------------------------------

        const sessionPromise = this.ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: onOpen,
            onmessage: onMessage,
            onerror: onError,
            onclose: onClose,
          },
          config: {
            responseModalities: [Modality.AUDIO], 
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: systemInstruction,
            ...(enableTranscription ? {
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            } : {}),
          },
        });

        this.session = await sessionPromise;
        return this.session;

    } finally {
        this.isConnecting = false;
    }
  }

  async disconnect() {
    if (this.session) {
      try {
        this.session.close();
      } catch (error) {
        console.warn("Error closing Gemini session:", error);
      }
      this.session = null;
    }
    this.isConnecting = false;
  }
}

export const geminiService = new GeminiLiveService();

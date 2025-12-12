
import { GoogleGenAI } from '@google/genai';
import { UIText, Language } from '../types';

export class UITranslationService {
  private ai: GoogleGenAI;

  constructor() {
    // @ts-ignore
    const apiKey = process.env.API_KEY as string;
    this.ai = new GoogleGenAI({ apiKey });
  }

  async translateUI(targetLanguage: Language, baseText: UIText): Promise<UIText> {
    // If target is English, return base text immediately to save tokens
    if (targetLanguage === Language.ENGLISH) return baseText;

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

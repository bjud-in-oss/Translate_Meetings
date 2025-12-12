
import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';
import { Language } from '../types';

interface PolishedCallbacks {
  onTranscriptUpdate: (text: string) => void;
  onPolishedText: (text: string) => void;
  onAudioQueued: (blob: Blob, duration: number) => void;
  onLagUpdate: (lag: number) => void;
}

export class PolishedService {
  private ai: GoogleGenAI;
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  
  // VAD & Sidecar State
  private silenceStart: number = 0;
  private isSilent: boolean = false;
  private currentChunkStart: number = 0;
  private recognition: any | null = null; // webkitSpeechRecognition
  private lastCutTime: number = 0;
  private latestTranscript: string = "";
  private isRecording: boolean = false;
  
  // Noise Filtering State
  private speechDetectedInChunk: boolean = false;
  
  // Playback Logic
  private systemLag: number = 0; 
  private callbacks: PolishedCallbacks | null = null;
  private targetLanguage: Language = Language.ENGLISH;

  // Constants
  private readonly SILENCE_THRESHOLD = 0.02; 
  private readonly SILENCE_DURATION_CUT = 500; 
  private readonly THINKING_PAUSE_CUT = 2000; 
  private readonly MAX_CHUNK_DURATION = 30000; 
  
  // ELASTIC BUFFER STATE
  private currentChunkThreshold = 4000; // Start aggressive (4s)
  private readonly MIN_SAFE_THRESHOLD = 4000;
  private readonly MAX_SAFE_THRESHOLD = 15000; // 15s fallback on error
  private readonly COOLDOWN_MS = 2000;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async start(
    stream: MediaStream, 
    targetLanguage: Language,
    callbacks: PolishedCallbacks
  ) {
    this.stream = stream;
    this.targetLanguage = targetLanguage;
    this.callbacks = callbacks;
    this.isRecording = true;
    this.systemLag = 0;
    this.latestTranscript = "";
    this.speechDetectedInChunk = false;
    // Reset threshold on start
    this.currentChunkThreshold = this.MIN_SAFE_THRESHOLD;

    this.audioContext = new AudioContext();
    
    // 1. Setup VAD Analysis
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512; 
    source.connect(this.analyser);

    // 2. Setup Sidecar (Speech Recognition)
    if ('webkitSpeechRecognition' in window) {
        this.recognition = new (window as any).webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        // Default to Swedish as input source trigger (common for structure detection)
        this.recognition.lang = 'sv-SE'; 
        
        this.recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
               if (event.results[i].isFinal) {
                   this.latestTranscript += event.results[i][0].transcript;
               } else {
                   interim += event.results[i][0].transcript;
               }
            }
            const fullText = this.latestTranscript + interim;
            if (this.callbacks) this.callbacks.onTranscriptUpdate(fullText);
        };

        // CRITICAL STABILITY FIX: Auto-restart if it stops unexpectedly
        this.recognition.onend = () => {
            if (this.isRecording) {
                // Small delay to prevent CPU thrashing if it fails repeatedly
                setTimeout(() => {
                    if (this.isRecording && this.recognition) {
                        try {
                            this.recognition.start();
                        } catch (e) {
                            console.warn("Failed to restart Sidecar", e);
                        }
                    }
                }, 100);
            }
        };

        try {
            this.recognition.start();
        } catch (e) {
            console.warn("Speech recognition already started or failed", e);
        }
    }

    // 3. Setup Media Recorder (High Quality)
    this.setupMediaRecorder();

    this.currentChunkStart = Date.now();
    this.monitorVAD(); // Start the loop
  }

  private setupMediaRecorder() {
    if (!this.stream) return;
    try {
         this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });
    } catch(e) {
         this.mediaRecorder = new MediaRecorder(this.stream);
    }
    
    this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            const mode = this.determineReverenceMode();
            // Pass the speech detection flag to the processor
            this.processChunk(e.data, mode, this.speechDetectedInChunk);
            // Reset flag for next chunk
            this.speechDetectedInChunk = false;
        }
    };
    this.mediaRecorder.start();
  }

  private determineReverenceMode(): 'VERBATIM' | 'CONCISE' | 'SUMMARIZE' {
    if (this.systemLag > 15) return 'SUMMARIZE';
    if (this.systemLag > 5) return 'CONCISE';
    return 'VERBATIM';
  }

  private monitorVAD() {
    if (!this.isRecording || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for(let i=0; i<bufferLength; i++) sum += dataArray[i];
    const average = sum / bufferLength / 255; 

    // --- NOISE FILTER TRACKING ---
    // If we detect energy above threshold at any point in the chunk, mark it as valid speech
    if (average > this.SILENCE_THRESHOLD) {
        this.speechDetectedInChunk = true;
    }

    const now = Date.now();

    if (average < this.SILENCE_THRESHOLD) {
        if (!this.isSilent) {
            this.isSilent = true;
            this.silenceStart = now;
        }
    } else {
        this.isSilent = false;
    }

    // --- SMART HYBRID TRIGGER LOGIC ---
    if (now - this.lastCutTime > this.COOLDOWN_MS) {
        const silenceDur = this.isSilent ? (now - this.silenceStart) : 0;
        const chunkDur = now - this.currentChunkStart;
        
        const recentText = this.latestTranscript.slice(-50).trim();
        const hasSentenceTerminator = /[.?!]$/.test(recentText);
        const hasPauseChar = /[,]$/.test(recentText) || recentText.endsWith(' and') || recentText.endsWith(' och');

        let cutTriggered = false;

        // ELASTIC BUFFER: Use the dynamic threshold instead of a constant
        const isLongEnough = chunkDur > this.currentChunkThreshold;

        // Priority 1: Perfect Cut (Must be long enough to avoid spam)
        if (isLongEnough && silenceDur > this.SILENCE_DURATION_CUT && hasSentenceTerminator) {
            cutTriggered = true;
        }
        // Priority 2: Thinking Pause (Must be long enough)
        else if (isLongEnough && silenceDur > this.THINKING_PAUSE_CUT) {
            cutTriggered = true;
        }
        // Priority 3: Emergency Scissors (Keep as is, ensures we don't drift too far)
        else if (chunkDur > this.MAX_CHUNK_DURATION && hasPauseChar) {
            cutTriggered = true;
        }
        // Hard fallback
        else if (chunkDur > (this.MAX_CHUNK_DURATION + 5000)) {
            cutTriggered = true;
        }

        if (cutTriggered) {
            this.cutChunk();
        }
    }

    if (this.isRecording) {
        requestAnimationFrame(() => this.monitorVAD());
    }
  }

  private cutChunk() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
        // restart happens in onstop implicitly via logic flow or manual restart
        // MediaRecorder API stop() is async in firing dataavailable, so we restart immediately
        this.mediaRecorder.start(); 
        this.currentChunkStart = Date.now();
        this.lastCutTime = Date.now();
        this.latestTranscript = ""; 
        if (this.callbacks) this.callbacks.onTranscriptUpdate(""); // Clear UI
    }
  }

  // Retry Wrapper for API calls to handle 429 errors
  private async retryOperation<T>(operation: () => Promise<T>, retries = 5, delay = 5000): Promise<T> {
      try {
          return await operation();
      } catch (error: any) {
          // Check for Rate Limit (429) or Resource Exhausted
          const isRateLimit = error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429 || (error?.message && error.message.includes('429'));
          
          if (isRateLimit) {
              // ELASTIC BUFFER: HIT!
              // We hit a limit. Immediately increase the chunk size to maximum (Safety Mode).
              // This reduces RPM (Requests Per Minute) drastically.
              console.warn(`Rate limit hit! Increasing chunk buffer to ${this.MAX_SAFE_THRESHOLD}ms`);
              this.currentChunkThreshold = this.MAX_SAFE_THRESHOLD;
          }

          if (retries > 0 && isRateLimit) {
              console.warn(`Retrying in ${delay}ms... (${retries} retries left)`);
              await new Promise(resolve => setTimeout(resolve, delay));
              // Exponential backoff
              return this.retryOperation(operation, retries - 1, delay * 2);
          }
          throw error;
      }
  }

  private async processChunk(blob: Blob, mode: 'VERBATIM' | 'CONCISE' | 'SUMMARIZE', hasSpeech: boolean) {
     // CRITICAL: If no speech energy was detected in this chunk, discard it immediately.
     if (!hasSpeech) {
         console.log("Chunk discarded: No speech detected (Background noise only).");
         return;
     }

     const reader = new FileReader();
     reader.readAsDataURL(blob);
     reader.onloadend = async () => {
         const base64Audio = (reader.result as string).split(',')[1];
         
         let instruction = `Translate the input audio to ${this.targetLanguage}.`;
         
         if (mode === 'VERBATIM') instruction += " Translate verbatim.";
         else if (mode === 'CONCISE') instruction += " Remove filler words and be concise.";
         else if (mode === 'SUMMARIZE') instruction += " Summarize the key points to 50% length.";

         instruction += " CRITICAL: If audio contains Direct Quotes, Prayer, or Solemnity, IGNORE summary and translate VERBATIM.";
         instruction += " If the audio is just noise or silence, return an empty string.";

         try {
            // 1. Audio -> Text (With Retry)
            const response = await this.retryOperation<GenerateContentResponse>(() => this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { text: instruction },
                    { inlineData: { mimeType: 'audio/webm', data: base64Audio } }
                ]
            }));
            const text = response.text;
            
            // ELASTIC BUFFER: RECOVERY
            // If the call was successful and we are in "Safety Mode", slowly lower the threshold
            if (this.currentChunkThreshold > this.MIN_SAFE_THRESHOLD) {
                this.currentChunkThreshold -= 250; // Decrease by 250ms per success
                if (this.currentChunkThreshold < this.MIN_SAFE_THRESHOLD) {
                    this.currentChunkThreshold = this.MIN_SAFE_THRESHOLD;
                }
                // console.log("Recovering threshold:", this.currentChunkThreshold);
            }

            if (!text) return;

            // Check for hallucinated noise descriptions
            const lower = text.toLowerCase();
            if (lower.includes("audio contains") || lower.includes("discernible speech") || lower.includes("background noise")) {
                 console.log("Discarding meta-commentary:", text);
                 return;
            }

            if (this.callbacks) this.callbacks.onPolishedText(text);

            // 2. Text -> Audio (With Retry)
            const ttsResponse = await this.retryOperation<GenerateContentResponse>(() => this.ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: text }] }],
                config: { 
                    responseModalities: [Modality.AUDIO], 
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } 
                }
            }));
            
            const ttsBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (ttsBase64) {
                 // Convert base64 to Blob
                 const byteCharacters = atob(ttsBase64);
                 const byteNumbers = new Array(byteCharacters.length);
                 for (let i = 0; i < byteCharacters.length; i++) {
                     byteNumbers[i] = byteCharacters.charCodeAt(i);
                 }
                 const byteArray = new Uint8Array(byteNumbers);
                 // The API returns raw PCM 24kHz. 
                 
                 // Estimate duration (24kHz * 1 channel * 2 bytes/sample = 48000 bytes/sec)
                 const duration = byteArray.length / 48000;
                 
                 if (this.callbacks) {
                     this.callbacks.onAudioQueued(new Blob([byteArray]), duration);
                 }
            }

         } catch (e) {
             console.error("Polished pipeline error", e);
             // Optionally notify UI of failure, or just log it
         }
     };
  }

  // Called by App when it finishes playing a segment
  public reportPlaybackFinished(duration: number) {
      this.systemLag -= duration;
      if (this.systemLag < 0) this.systemLag = 0;
      if (this.callbacks) this.callbacks.onLagUpdate(this.systemLag);
  }
  
  // Called by App when it adds a segment to queue
  public reportPlaybackAdded(duration: number) {
      this.systemLag += duration;
      if (this.callbacks) this.callbacks.onLagUpdate(this.systemLag);
  }

  stop() {
    this.isRecording = false;
    // CLEANUP: Break closures and loops
    if (this.mediaRecorder) {
        this.mediaRecorder.ondataavailable = null; // Prevent new data events
        this.mediaRecorder.stop();
        this.mediaRecorder = null;
    }
    if (this.recognition) {
        this.recognition.onend = null; // Prevent zombie restart
        this.recognition.onresult = null;
        this.recognition.stop();
        this.recognition = null;
    }
    if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
    }
    this.systemLag = 0;
    this.speechDetectedInChunk = false;
    this.stream = null;
    this.callbacks = null;
  }
}

export const polishedService = new PolishedService();


// @ts-ignore
declare var vad: any;

export class VadService {
  private myVad: any = null;
  public currentProb: number = 0;
  private isRunning: boolean = false;

  constructor() {}

  async attach(
      stream: MediaStream, 
      onSpeechStart?: () => void, 
      onSpeechEnd?: () => void
  ) {
    // If already running, pause first
    if (this.myVad) {
        this.myVad.pause();
        this.myVad = null;
    }
    
    // Check if library loaded
    if (typeof vad === 'undefined') {
        console.error("VAD Library not loaded. Check index.html");
        return;
    }

    try {
        // console.log("Initializing VAD (Event-Driven Mode)...");
        
        this.myVad = await vad.MicVAD.new({
            // Override getStream to use our existing Gemini stream
            getStream: async () => {
                return stream;
            },
            
            // CRITICAL: Explicitly set paths to avoid "about:blank" or relative path errors
            // These point to the specific versions loaded in index.html
            baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
            onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
            
            // Callbacks
            onFrameProcessed: (probs: any) => {
                // probs is usually { isSpeech: number }
                if (probs) {
                    this.currentProb = probs.isSpeech;
                }
            },
            onVADMisfire: () => {
                // console.log("VAD Misfire");
            },
            onSpeechStart: () => {
                if (onSpeechStart) onSpeechStart();
            },
            onSpeechEnd: (audio: any) => {
                // The library passes the audio segment here, but we use our own buffer 
                // to maintain strict sync with the Gemini loop. We just use this as the Trigger.
                if (onSpeechEnd) onSpeechEnd();
            },
            
            // Tuning
            positiveSpeechThreshold: 0.5,
            negativeSpeechThreshold: 0.35,
            minSpeechFrames: 3, 
            startOnLoad: false // We start manually
        });

        this.myVad.start();
        this.isRunning = true;
        // console.log("VAD Service Started (@ricky0123/vad-web)");

    } catch (e) {
        console.error("Failed to initialize VAD", e);
    }
  }

  getProbability(): number {
      return this.currentProb;
  }

  stop() {
      if (this.myVad) {
          this.myVad.pause();
          this.myVad = null;
      }
      this.currentProb = 0;
      this.isRunning = false;
  }
}

export const vadService = new VadService();


import { useRef, useState, useCallback, useEffect } from 'react';
import { LiveServerMessage } from '@google/genai';
import { Language, TranslationMode, TranslationTempo, INPUT_SAMPLE_RATE, OUTPUT_SAMPLE_RATE, TranscriptItem } from '../types';
import { geminiService } from '../services/geminiLiveService';
import { vadService } from '../services/vadService'; 
import { gatewayService, MutexState } from '../services/gatewayService';
import { createPcmBlob, decodeAudioData, base64ToUint8Array, concatenateFloat32Arrays } from '../utils/audioUtils';

type ConnectionState = 'CONNECTED' | 'DISCONNECTED' | 'SLEEP' | 'RECONNECTING';

export const useAudioSession = () => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
    const connectionStateRef = useRef<ConnectionState>('DISCONNECTED');
    
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false); 
    const [isTriggerActive, setIsTriggerActive] = useState(false);
    const [isInputMuted, setIsInputMuted] = useState(false); // Cough button / Manual Mute
    const [mutexState, setMutexState] = useState<MutexState>('OPEN');
    const [mutexOwner, setMutexOwner] = useState<string>('');
    
    // Performance Metrics
    const [lastBurstSize, setLastBurstSize] = useState(0);
    const [inspectorMessage, setInspectorMessage] = useState("System Ready");
    
    // New Metrics for Dashboard
    const [totalLag, setTotalLag] = useState(0); 
    const [lagTrend, setLagTrend] = useState<'STABLE' | 'RISING' | 'FALLING'>('STABLE');
    const [aiEfficiency, setAiEfficiency] = useState(100);
    const [bufferLagFrames, setBufferLagFrames] = useState(0);

    const [dashboardState, setDashboardState] = useState({
        rms: 0,
        vadProb: 0, 
        isGated: true,
        trafficLight: 'OPEN' as 'OPEN' | 'TALK' | 'PAUSE' | 'SLEEP',
        bufferSize: 0,
        outputQueueSize: 0, 
        isUploading: false
    });

    // Live Transcription State
    const [liveTranscript, setLiveTranscript] = useState<TranscriptItem[]>([]);

    // Refs
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const gatewaySourceRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    
    const audioBufferQueueRef = useRef<Float32Array[]>([]);
    const localBufferRef = useRef<Float32Array[]>([]);
    const isAiSpeakingRef = useRef<boolean>(false);
    const waitingForResponseRef = useRef<boolean>(false);
    const ignoreAudioResponseRef = useRef<boolean>(false);
    const watchdogTimerRef = useRef<any>(null);
    const quickReleaseTimerRef = useRef<any>(null); 
    const aiSpeechDebounceTimerRef = useRef<any>(null);
    const silenceStreamIntervalRef = useRef<any>(null);
    const autoRotateTimerRef = useRef<any>(null); 
    const autoStandbyTimerRef = useRef<any>(null);
    const isUploadingRef = useRef<boolean>(false);
    const isInputMutedRef = useRef<boolean>(false); 
    const isMutexLockedRef = useRef<boolean>(false);
    const isManuallyStoppedRef = useRef<boolean>(false);

    const lagHistoryRef = useRef<{time: number, val: number}[]>([]);
    const lookbackBufferRef = useRef<Float32Array[]>([]);
    const isGateOpenRef = useRef<boolean>(false);
    const lowVolumeStartRef = useRef<number>(0);
    const lastRmsRef = useRef<number>(0);
    const lastVadProbRef = useRef<number>(0); 
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);
    const mediaStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const audioOutputElRef = useRef<HTMLAudioElement>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sessionRef = useRef<any>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const audioQueueRef = useRef<{data: Uint8Array, mode: TranslationMode}[]>([]);
    const isProcessingQueueRef = useRef(false);

    const lastConfigRef = useRef<{
        lang: Language, 
        mode: TranslationMode, 
        tempo: TranslationTempo,
        micId: string, 
        triggerId: string, 
        spkId: string,
        enableTranscription: boolean
    } | null>(null);

    const pendingLanguageRef = useRef<Language | null>(null);

    useEffect(() => {
        connectionStateRef.current = connectionState;
    }, [connectionState]);

    useEffect(() => {
        isInputMutedRef.current = isInputMuted;
    }, [isInputMuted]);

    useEffect(() => {
        const unsub = gatewayService.onMutexChange((state, owner) => {
            setMutexState(state);
            setMutexOwner(owner);
            isMutexLockedRef.current = (state === 'LOCKED');
            if (state === 'LOCKED') setInspectorMessage(`Yield to: ${owner}`);
            else setInspectorMessage("Line Open");
        });
        return unsub;
    }, []);

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.warn("Wake Lock failed", err);
            }
        }
    };
    
    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    };

    const safeSend = useCallback((payload: any) => {
        if (sessionRef.current) {
            try { sessionRef.current.sendRealtimeInput(payload); } catch (e) {}
        }
    }, []);

    const setupAudioContexts = useCallback(() => {
        if (!inputAudioContextRef.current || inputAudioContextRef.current.state === 'closed') {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
        }
        if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
        }
        if (outputAudioContextRef.current) {
             mediaStreamDestRef.current = outputAudioContextRef.current.createMediaStreamDestination();
        }
    }, []);

    const stopSilenceStream = useCallback(() => {
        if (silenceStreamIntervalRef.current) {
            clearInterval(silenceStreamIntervalRef.current);
            silenceStreamIntervalRef.current = null;
        }
    }, []);

    const startSilenceStream = useCallback(() => {
        stopSilenceStream();
        silenceStreamIntervalRef.current = setInterval(() => {
            if (sessionRef.current && waitingForResponseRef.current && !isAiSpeakingRef.current) {
                 const silenceSamples = 2048; 
                 const silence = new Float32Array(silenceSamples).fill(0);
                 safeSend({ media: createPcmBlob(silence) });
            } else {
                stopSilenceStream();
            }
        }, 100);
    }, [safeSend, stopSilenceStream]);

    // GATEWAY AUDIO HANDLER
    const handleGatewayAudio = useCallback((data: ArrayBuffer) => {
        const ctx = inputAudioContextRef.current;
        if (!ctx || !gatewaySourceRef.current) return;
        const inputFloat32 = new Float32Array(data);
        const outputLength = Math.floor(inputFloat32.length / 3);
        const downsampled = new Float32Array(outputLength);
        for (let i = 0; i < outputLength; i++) {
            downsampled[i] = inputFloat32[i * 3];
        }
        const buffer = ctx.createBuffer(1, downsampled.length, INPUT_SAMPLE_RATE);
        buffer.copyToChannel(downsampled, 0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(gatewaySourceRef.current);
        source.start();
    }, []);

    const stopAudio = useCallback(async (fullDisconnect: boolean = true) => {
        if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
        if (quickReleaseTimerRef.current) clearTimeout(quickReleaseTimerRef.current);
        if (aiSpeechDebounceTimerRef.current) clearTimeout(aiSpeechDebounceTimerRef.current);
        if (autoRotateTimerRef.current) clearTimeout(autoRotateTimerRef.current);
        if (autoStandbyTimerRef.current) clearTimeout(autoStandbyTimerRef.current);
        stopSilenceStream();

        sourcesRef.current.forEach(source => { 
            try { 
                source.onended = null; 
                source.stop(); 
                source.disconnect(); 
            } catch(e) {} 
        });
        sourcesRef.current.clear();

        // IMMEDIATE OUTPUT SILENCE
        if (audioOutputElRef.current) {
            audioOutputElRef.current.pause();
            audioOutputElRef.current.srcObject = null;
        }

        if (sessionRef.current) {
            try { await geminiService.disconnect(); } catch(e) {}
            sessionRef.current = null;
        }

        if (fullDisconnect) {
            isManuallyStoppedRef.current = true;
            releaseWakeLock();
            setConnectionState('DISCONNECTED');
            vadService.stop();
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (processorRef.current) {
                processorRef.current.disconnect();
                processorRef.current.onaudioprocess = null; 
                processorRef.current = null;
            }
            if (analyserRef.current) {
                analyserRef.current.disconnect();
                analyserRef.current = null;
            }
            if (outputAudioContextRef.current) {
                try { await outputAudioContextRef.current.close(); } catch (e) {}
                outputAudioContextRef.current = null;
            }
            if (inputAudioContextRef.current) {
                try { await inputAudioContextRef.current.close(); } catch (e) {}
                inputAudioContextRef.current = null;
            }
            
            setInspectorMessage("Disconnected");
        } else {
            // Smart Standby (Muted but Listening for VAD)
            setConnectionState('SLEEP');
            setInspectorMessage("Auto-Standby (Listening...)");
        }

        audioQueueRef.current = []; 
        isProcessingQueueRef.current = false;
        audioBufferQueueRef.current = [];
        localBufferRef.current = [];
        lookbackBufferRef.current = [];
        isGateOpenRef.current = false;
        lowVolumeStartRef.current = 0;
        
        isAiSpeakingRef.current = false;
        waitingForResponseRef.current = false;
        ignoreAudioResponseRef.current = false;
        isUploadingRef.current = false;
        setBufferLagFrames(0);
        setIsPaused(false);
        setIsTriggerActive(false);
        setIsInputMuted(false); 
        nextStartTimeRef.current = 0;
        pendingLanguageRef.current = null;
        setIsAiSpeaking(false);
        setLiveTranscript([]); // Reset transcript on stop
    }, [stopSilenceStream]);

    const resetAutoStandby = useCallback(() => {
        if (autoStandbyTimerRef.current) clearTimeout(autoStandbyTimerRef.current);
        if (connectionStateRef.current === 'CONNECTED') {
            autoStandbyTimerRef.current = setTimeout(() => {
                console.log("Auto-Standby triggered due to inactivity.");
                stopAudio(false); // Enter Sleep Mode
            }, 60000); // 60 seconds of silence -> Sleep
        }
    }, [stopAudio]);

    const togglePause = () => {
        setIsPaused(prev => !prev);
    };

    const toggleInputMute = () => {
        setIsInputMuted(prev => !prev);
    };

    const reconnectSession = async () => {
        if (lastConfigRef.current && connectionStateRef.current === 'SLEEP') {
            setConnectionState('RECONNECTING');
            setInspectorMessage("Auto-Waking...");
            await startSession(
                lastConfigRef.current.lang,
                lastConfigRef.current.mode,
                lastConfigRef.current.tempo,
                lastConfigRef.current.micId,
                lastConfigRef.current.triggerId,
                lastConfigRef.current.spkId,
                lastConfigRef.current.enableTranscription
            );
        }
    };

    const getLagTrend = (): 'STABLE' | 'RISING' | 'FALLING' => {
        const history = lagHistoryRef.current;
        if (history.length < 5) return 'STABLE';
        const start = history[0];
        const end = history[history.length - 1];
        const slope = (end.val - start.val) / ((end.time - start.time) / 1000);
        if (slope > 0.5) return 'RISING';
        if (slope < -0.5) return 'FALLING';
        return 'STABLE';
    };
    
    const executeLanguageSwitch = useCallback(async (newLang: Language) => {
        pendingLanguageRef.current = null;
        if (!lastConfigRef.current) return;
        
        audioQueueRef.current = []; 
        ignoreAudioResponseRef.current = true;
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
        
        const { mode, tempo, enableTranscription } = lastConfigRef.current;
        lastConfigRef.current.lang = newLang; 
        setInspectorMessage(`Switching to ${newLang}...`);
        setConnectionState('RECONNECTING');
        connectionStateRef.current = 'RECONNECTING';

        if (sessionRef.current) {
            try { await geminiService.disconnect(); } catch (e) {}
        }
        try {
            const session = await geminiService.connect(
                newLang,
                mode,
                tempo,
                enableTranscription || false,
                () => {
                    setConnectionState('CONNECTED');
                    setInspectorMessage(`Swapped: ${newLang}`);
                    ignoreAudioResponseRef.current = false; 
                    resetAutoStandby(); // Reset timer on successful swap
                },
                async (message: LiveServerMessage) => {
                    if (outputAudioContextRef.current) {
                        await handleGeminiMessage(message, outputAudioContextRef.current, mode);
                    }
                },
                async (e) => {
                    if (e instanceof Error && e.message.includes("429")) setInspectorMessage("Rate Limit");
                },
                async () => {
                    if (connectionStateRef.current !== 'RECONNECTING') {
                        stopAudio(false);
                    }
                }
            );
            sessionRef.current = session;
        } catch (e) {
            setInspectorMessage("Swap Error");
            stopAudio();
        }
    }, [stopAudio, resetAutoStandby]);

    const playRawAudio = async (audioData: Uint8Array, outputCtx: AudioContext, reportDuration?: number, mode?: TranslationMode) => {
        if (!outputCtx || outputCtx.state === 'closed') return; 

        const currentTime = outputCtx.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime;
        }
        if (nextStartTimeRef.current > currentTime + 20) {
            nextStartTimeRef.current = currentTime;
        }

        if (outputCtx.state === 'suspended') {
            try { await outputCtx.resume(); } catch(e) {}
        }

        const audioBuffer = await decodeAudioData(audioData, outputCtx, OUTPUT_SAMPLE_RATE, 1);
        const source = outputCtx.createBufferSource();
        source.buffer = audioBuffer;
        
        const outputQ = Math.max(0, nextStartTimeRef.current - outputCtx.currentTime);
        const inputQ = localBufferRef.current.length * 0.02;
        const total = outputQ + inputQ;

        let rate = 1.0;
        if (total > 15.0) {
            rate = 1.1; 
        }

        source.playbackRate.value = rate;

        const supportsSinkId = 'setSinkId' in HTMLMediaElement.prototype;
        if (supportsSinkId && mediaStreamDestRef.current) {
            source.connect(mediaStreamDestRef.current);
        } else {
            source.connect(outputCtx.destination);
        }
        
        source.onended = () => {
            try { source.stop(); } catch(e) {} 
            source.disconnect();
            sourcesRef.current.delete(source);
            
            if (sourcesRef.current.size === 0) {
                if (aiSpeechDebounceTimerRef.current) clearTimeout(aiSpeechDebounceTimerRef.current);
                aiSpeechDebounceTimerRef.current = setTimeout(() => {
                    setIsAiSpeaking(false);
                    isAiSpeakingRef.current = false; 
                    setInspectorMessage("AI Finished");
                    waitingForResponseRef.current = false;
                    resetAutoStandby(); // Reset timer when AI finishes speaking

                    if (pendingLanguageRef.current) {
                         executeLanguageSwitch(pendingLanguageRef.current);
                    }

                }, 150); 
            }
        };

        const duration = audioBuffer.duration / rate;
        source.start(nextStartTimeRef.current);
        sourcesRef.current.add(source);
        nextStartTimeRef.current += duration;
        
        if (aiSpeechDebounceTimerRef.current) clearTimeout(aiSpeechDebounceTimerRef.current);
        
        setIsAiSpeaking(true);
        isAiSpeakingRef.current = true; 
        waitingForResponseRef.current = false;
        setInspectorMessage(`Translating... (${rate.toFixed(2)}x)`);
        
        // Reset standby timer whenever we play audio
        if (autoStandbyTimerRef.current) clearTimeout(autoStandbyTimerRef.current);
    };

    const processAudioQueue = async (outputCtx: AudioContext) => {
        if (isProcessingQueueRef.current) return;
        isProcessingQueueRef.current = true;
        try {
            while (audioQueueRef.current.length > 0) {
                const item = audioQueueRef.current.shift();
                if (item) {
                     if (outputCtx.state === 'closed') break;
                     await playRawAudio(item.data, outputCtx, undefined, item.mode);
                }
            }
        } catch (e) {
        } finally {
            isProcessingQueueRef.current = false;
        }
    };

    const handleAudioChunk = async (audioDataStr: string | undefined, outputCtx: AudioContext, mode: TranslationMode) => {
        if (!audioDataStr) return;
        if (ignoreAudioResponseRef.current) return;
        if (quickReleaseTimerRef.current) clearTimeout(quickReleaseTimerRef.current);
        
        stopSilenceStream();

        isAiSpeakingRef.current = true;
        setIsAiSpeaking(true);
        waitingForResponseRef.current = false; 
        if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);

        const audioData = base64ToUint8Array(audioDataStr);
        audioQueueRef.current.push({ data: audioData, mode });
        
        if (audioQueueRef.current.length > 50) {
            audioQueueRef.current.shift();
        }

        processAudioQueue(outputCtx);
    };

    const updateTranscript = (text: string, role: 'user' | 'model') => {
        setLiveTranscript(prev => {
            const lastItem = prev[prev.length - 1];
            
            // If the last item is from the same role and NOT final, we append/update it
            // This creates the "Streaming" effect where text grows in place
            if (lastItem && lastItem.role === role && !lastItem.isFinal) {
                // If it's a new thought (simple heuristic), maybe split? 
                // For now, simple concatenation to simulate streaming draft.
                const updatedItem = { ...lastItem, text: lastItem.text + text };
                return [...prev.slice(0, -1), updatedItem];
            } else {
                // Otherwise start a new bubble
                const newItem = { id: Date.now().toString(), role, text, isFinal: false };
                return [...prev, newItem].slice(-50); // Keep last 50 items
            }
        });
    };

    const finalizeTranscriptTurn = () => {
        setLiveTranscript(prev => {
            if (prev.length === 0) return prev;
            // Mark the last item as final
            const lastItem = prev[prev.length - 1];
            if (lastItem.isFinal) return prev;
            
            const finalizedItem = { ...lastItem, isFinal: true };
            return [...prev.slice(0, -1), finalizedItem];
        });
    };

    const flushBufferToGemini = () => {
        if (pendingLanguageRef.current) return;

        const currentMode = lastConfigRef.current?.mode;
        const isSimultaneous = currentMode === TranslationMode.SIMULTANEOUS;
        const isRedLight = waitingForResponseRef.current;
        const bufferSizeChunks = localBufferRef.current.length;
        const canSend = isSimultaneous ? true : !isRedLight;

        if (canSend && bufferSizeChunks > 0) {
            isUploadingRef.current = true;
            setTimeout(() => { isUploadingRef.current = false; }, 300);

            const combined = concatenateFloat32Arrays(localBufferRef.current);
            const pcmBlob = createPcmBlob(combined);
            
            try {
                safeSend({ media: pcmBlob });
                if (!isSimultaneous) {
                    const silenceSamples = 16000 * 2.0; 
                    const paddingSilence = new Float32Array(silenceSamples).fill(0);
                    safeSend({ media: createPcmBlob(paddingSilence) });
                }

                waitingForResponseRef.current = true;
                ignoreAudioResponseRef.current = false;
                startSilenceStream();
                
                setLastBurstSize(bufferSizeChunks);
                setInspectorMessage(`Sent ${bufferSizeChunks} chunks`);
                localBufferRef.current = [];
                resetAutoStandby(); // Activity detected, reset standby

                if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
                watchdogTimerRef.current = setTimeout(() => {
                    if (waitingForResponseRef.current) {
                        waitingForResponseRef.current = false;
                        stopSilenceStream();
                        setInspectorMessage("Watchdog Reset");
                    }
                }, 15000);

                if (quickReleaseTimerRef.current) clearTimeout(quickReleaseTimerRef.current);
                quickReleaseTimerRef.current = setTimeout(() => {
                    if (waitingForResponseRef.current && !isAiSpeakingRef.current) {
                        waitingForResponseRef.current = false;
                        stopSilenceStream();
                        setInspectorMessage("Quick Release");
                    }
                }, 2000);

            } catch (err) { 
            }
        }
    };

    const handleGeminiMessage = useCallback(async (message: LiveServerMessage, outputCtx: AudioContext, mode: TranslationMode) => {
         if (message.serverContent?.interrupted) {
             audioQueueRef.current = []; 
             setInspectorMessage("Interrupted (Cleared)");
             finalizeTranscriptTurn(); // Close current bubble if interrupted
         }

         const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
         if (audioData) {
             await handleAudioChunk(audioData, outputCtx, mode);
         }
         
         // Handle Transcription - Accumulate chunks
         const inputTrans = message.serverContent?.inputTranscription?.text;
         if (inputTrans) {
             updateTranscript(inputTrans, 'user');
             resetAutoStandby(); // User speech detected via transcription event
         }
         const outputTrans = message.serverContent?.outputTranscription?.text;
         if (outputTrans) {
             updateTranscript(outputTrans, 'model');
         }

         if (message.serverContent?.turnComplete) {
             waitingForResponseRef.current = false;
             stopSilenceStream(); 
             finalizeTranscriptTurn(); // Turn is done, mark text as final
             if (quickReleaseTimerRef.current) clearTimeout(quickReleaseTimerRef.current);
             if (!isAiSpeakingRef.current) setInspectorMessage("Ready");
         }
    }, [handleAudioChunk, stopSilenceStream, resetAutoStandby]);

    const rotateSession = useCallback(async () => {
        if (connectionStateRef.current !== 'CONNECTED' || !lastConfigRef.current) return;
        setInspectorMessage("Rotating Session...");
        const oldSession = sessionRef.current;
        const { lang, mode, tempo, enableTranscription } = lastConfigRef.current;
        try {
            const newSession = await geminiService.connect(
                lang,
                mode,
                tempo,
                enableTranscription || false,
                () => { },
                async (message: LiveServerMessage) => {
                    if (outputAudioContextRef.current) {
                        await handleGeminiMessage(message, outputAudioContextRef.current, mode);
                    }
                },
                (e) => console.warn("Rotated Session Error", e),
                () => console.log("Rotated Session Closed")
            );
            sessionRef.current = newSession;
            if (oldSession) oldSession.close();
            setInspectorMessage("Session Extended");
            if (autoRotateTimerRef.current) clearTimeout(autoRotateTimerRef.current);
            autoRotateTimerRef.current = setTimeout(rotateSession, 12 * 60 * 1000);
        } catch (e) {
            console.error("Rotation Failed", e);
            setInspectorMessage("Rotation Failed");
        }
    }, [handleGeminiMessage]);

    const setLanguage = useCallback(async (newLang: Language) => {
        if (connectionStateRef.current === 'DISCONNECTED') return;
        executeLanguageSwitch(newLang);
    }, [executeLanguageSwitch]);

    const startSession = async (
        selectedLanguage: Language, 
        selectedMode: TranslationMode, 
        selectedTempo: TranslationTempo, 
        selectedMicId: string, 
        selectedTriggerMicId: string, 
        selectedSpeakerId: string,
        enableTranscription: boolean
    ) => {
        try {
            if (sessionRef.current) {
                await geminiService.disconnect();
                sessionRef.current = null;
            }

            isManuallyStoppedRef.current = false;
            requestWakeLock();
            setupAudioContexts(); 
            
            lastConfigRef.current = { 
                lang: selectedLanguage, 
                mode: selectedMode, 
                tempo: selectedTempo,
                micId: selectedMicId, 
                triggerId: selectedTriggerMicId, 
                spkId: selectedSpeakerId,
                enableTranscription
            };
            
            const inputCtx = inputAudioContextRef.current!;
            const outputCtx = outputAudioContextRef.current!;

            if (inputCtx.state === 'suspended') await inputCtx.resume();
            if (outputCtx.state === 'suspended') await outputCtx.resume();

            let stream: MediaStream;
            let isGatewayAudio = selectedMicId === 'gateway';

            if (isGatewayAudio && gatewayService.getStatus() === 'CONNECTED') {
                setInspectorMessage("Using Gateway (NDI)");
                gatewaySourceRef.current = inputCtx.createMediaStreamDestination();
                stream = gatewaySourceRef.current.stream;
                const unsub = gatewayService.onAudio(handleGatewayAudio);
            } else {
                const isWarmStart = streamRef.current && streamRef.current.active && processorRef.current;
                if (!isWarmStart) {
                    const constraints: MediaStreamConstraints = { 
                        audio: {
                            deviceId: selectedMicId && selectedMicId !== 'default' ? { exact: selectedMicId } : undefined,
                            echoCancellation: true, 
                            noiseSuppression: true, 
                            autoGainControl: true // HARDCODED: Large Group / AGC
                        } 
                    };
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                } else {
                    stream = streamRef.current!;
                }
            }
            
            streamRef.current = stream;

            if (!processorRef.current) { 
                setInspectorMessage("Initializing VAD...");
                await vadService.attach(
                    stream,
                    () => { 
                        if (isManuallyStoppedRef.current) return;
                        if (connectionStateRef.current === 'SLEEP') reconnectSession();
                    },
                    () => {
                        if (isManuallyStoppedRef.current) return;
                        if (selectedMode === TranslationMode.SIMULTANEOUS && connectionStateRef.current === 'CONNECTED') {
                            flushBufferToGemini();
                        }
                    }
                );
            }

            // Always use the single Gemini service (Polished removed)
            setInspectorMessage("Connecting...");
            const session = await geminiService.connect(
                selectedLanguage,
                selectedMode,
                selectedTempo,
                enableTranscription,
                () => { 
                    setConnectionState('CONNECTED');
                    setInspectorMessage("Listening...");
                    if (autoRotateTimerRef.current) clearTimeout(autoRotateTimerRef.current);
                    autoRotateTimerRef.current = setTimeout(rotateSession, 12 * 60 * 1000);
                    resetAutoStandby(); // Start timer on connect
                },
                async (message: LiveServerMessage) => {
                    await handleGeminiMessage(message, outputCtx, selectedMode);
                },
                async (e) => {
                    if (e instanceof Error && e.message.includes("429")) setInspectorMessage("Rate Limit");
                },
                async () => {
                    if (connectionStateRef.current !== 'RECONNECTING') stopAudio(false);
                }
            );
            sessionRef.current = session;

            if (audioOutputElRef.current && mediaStreamDestRef.current) {
                if ('setSinkId' in HTMLMediaElement.prototype) {
                    audioOutputElRef.current.srcObject = mediaStreamDestRef.current.stream;
                    await audioOutputElRef.current.play();
                    if (selectedSpeakerId) {
                        try {
                            // @ts-ignore
                            await audioOutputElRef.current.setSinkId(selectedSpeakerId);
                        } catch (err) {}
                    }
                }
            }
            
            if (!processorRef.current) {
                const source = inputCtx.createMediaStreamSource(stream);
                const analyser = inputCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyserRef.current = analyser;

                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                
                // Low threshold for simultaneous streaming
                const BURST_THRESHOLD_CHUNKS = 12; 
                
                audioBufferQueueRef.current = [];
                localBufferRef.current = [];
                lookbackBufferRef.current = [];
                isGateOpenRef.current = false;
                lowVolumeStartRef.current = 0;
                
                processor.onaudioprocess = async (e) => {
                    const isConnected = connectionStateRef.current === 'CONNECTED';
                    const isSuppressed = isInputMutedRef.current || isMutexLockedRef.current;
                    
                    const inputData = e.inputBuffer.getChannelData(0);
                    const gain = 1.0; 
                    const amplifiedData = new Float32Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                         amplifiedData[i] = isSuppressed ? 0 : Math.tanh(inputData[i] * gain);
                    }
                    
                    const now = Date.now();
                    
                    let sum = 0;
                    for (let i = 0; i < amplifiedData.length; i++) sum += amplifiedData[i] * amplifiedData[i];
                    const rms = Math.sqrt(sum / amplifiedData.length);
                    lastRmsRef.current = rms;

                    if (isPaused) {
                        localBufferRef.current = [];
                        waitingForResponseRef.current = false;
                        return;
                    }

                    if (isConnected && selectedMode === TranslationMode.SIMULTANEOUS) {
                        const vadProb = vadService.getProbability();
                        lastVadProbRef.current = vadProb;

                        const chunk = new Float32Array(amplifiedData);
                        lookbackBufferRef.current.push(chunk);
                        if (lookbackBufferRef.current.length > 2) lookbackBufferRef.current.shift();

                        const GATE_OPEN = 0.005; 
                        
                        if (rms > GATE_OPEN) isGateOpenRef.current = true;
                        
                        if (pendingLanguageRef.current) return; 

                        if (!isSuppressed && vadProb > 0.3 && (isGateOpenRef.current || rms > GATE_OPEN)) {
                             if (localBufferRef.current.length === 0) localBufferRef.current.push(...lookbackBufferRef.current);
                             localBufferRef.current.push(chunk);
                             lowVolumeStartRef.current = 0;
                             resetAutoStandby(); // Activity
                        } else {
                            if (localBufferRef.current.length > 0) {
                                if (lowVolumeStartRef.current === 0) lowVolumeStartRef.current = now;
                                if (now - lowVolumeStartRef.current > 1500) {
                                     flushBufferToGemini();
                                     lowVolumeStartRef.current = 0;
                                }
                            } else {
                                lowVolumeStartRef.current = 0;
                            }
                        }
                        
                        if (localBufferRef.current.length > BURST_THRESHOLD_CHUNKS) {
                             flushBufferToGemini();
                        }

                    } else if (isConnected) {
                         if (!isSuppressed) {
                            safeSend({ media: createPcmBlob(amplifiedData) });
                            if (rms > 0.01) resetAutoStandby(); // Activity in conversational mode
                         }
                    }
                };
                analyser.connect(processor);
                processor.connect(inputCtx.destination);
            }

        } catch (err) {
            console.error("Connection failed", err);
            await stopAudio(false); 
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            let lightState: 'OPEN' | 'TALK' | 'PAUSE' | 'SLEEP' = 'OPEN';
            if (connectionState === 'SLEEP') lightState = 'SLEEP';
            else if (isPaused) lightState = 'PAUSE';
            else if (isAiSpeakingRef.current || waitingForResponseRef.current) lightState = 'TALK';
            
            const outputQ = outputAudioContextRef.current 
                ? Math.max(0, nextStartTimeRef.current - outputAudioContextRef.current.currentTime)
                : 0;
            const inputQ = localBufferRef.current.length * 0.02;
            const total = outputQ + inputQ;
            setTotalLag(total);
            
            lagHistoryRef.current.push({ time: Date.now(), val: total });
            if (lagHistoryRef.current.length > 20) lagHistoryRef.current.shift();
            
            setLagTrend(getLagTrend());
            setAiEfficiency(Math.max(0, 100 - (total * 10)));

            setDashboardState({
                 rms: lastRmsRef.current,
                 vadProb: lastVadProbRef.current,
                 isGated: lastVadProbRef.current < 0.3,
                 trafficLight: lightState,
                 bufferSize: localBufferRef.current.length,
                 outputQueueSize: outputQ,
                 isUploading: isUploadingRef.current
            });

        }, 100);
        return () => clearInterval(interval);
    }, [connectionState, isPaused]);

    useEffect(() => {
        return () => {
            stopAudio(true);
        };
    }, [stopAudio]);

    return {
        connectionState,
        isAiSpeaking,
        isPaused,
        togglePause,
        isTriggerActive,
        isInputMuted,
        toggleInputMute,
        mutexState,
        mutexOwner,
        startSession,
        endSession: stopAudio, 
        setLanguage,
        audioOutputElRef,
        analyserRef,
        dashboardState,
        lastBurstSize,
        inspectorMessage,
        aiEfficiency,
        totalLag,
        lagTrend,
        liveTranscript,
        bufferLagFrames
    };
};


export const SYSTEM_GUIDE_MD = `# System & API Guide

## 1. Connection Lifecycle Graph

### Phase 1: Setup (CONFIGURATION)
User selects Language, Mode, Mic. (No API connection yet)

### Phase 2: Initialization (START SESSION)
* Request Mic Permission
* Initialize VAD (Voice Activity)
* WebSocket Handshake (Gemini)

### Phase 3: ACTIVE SESSION (LIVE)
* **LISTENING**: VAD detects user speech. Buffering audio chunks.
* **TRIGGER**: Organ Gate or Manual Trigger.
* **THINKING / GENERATING**: Audio uploaded to Gemini. Model generates Audio Response.
* **SPEAKING**: App plays returned audio. Mic might be suppressed (Echo Cancel).

### Phase 4: Terminate (END SESSION)
Socket Closed. Resources Freed. Return to Setup.

## 2. Translation Modes

### Sequential (Dialog)
* **Best for:** Conversations.
* The AI waits politely for you to finish speaking (silence detection) before it starts translating. It mimics a human interpreter taking turns.

### Simultaneous (Half-Duplex)
* **Best for:** Speeches / Sermons.
* The AI uses a "Buffer & Burst" strategy. It collects audio while you speak and translates in chunks. If it falls behind, it summarizes to catch up.

### Fluid
* **Best for:** Fast-paced Chat.
* Aggressive latency. It interrupts and translates as fast as possible, often sacrificing some grammar for speed.

## 3. Audio Settings

### Group Mode (Small vs Large)
Controls the Microphone Sensitivity (AGC).

* **Small Group (Digital Pre-Amp):** Software boost enabled. Good for picking up quiet voices in a small circle.
* **Large Group (Hardware AGC):** Uses the device's native Auto Gain. Better for loud rooms or PA systems to prevent clipping.

### Source Language
Currently, the system is optimized to translate **FROM** Swedish **TO** the selected language.
*Note: The AI can technically detect other input languages, but specifying Swedish ensures better accuracy for local dialects.*
`;
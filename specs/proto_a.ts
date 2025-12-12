
export const PROTO_A_MD = `# Teknisk genomgång: Prototyp A (PolyGlot Core)

Här är en teknisk genomgång av funktionerna i applikationen baserat på källkoden:

## 1. Kärna: Multimodal Realtids-AI (Gemini Live API)
Applikationen bygger på Gemini Multimodal Live API (\`@google/genai\`) via WebSockets, vilket skiljer sig från traditionella "transkribera -> översätt -> talsyntes"-pipelines.

*   **Audio-till-Audio/Text:** Den strömmar rå PCM-ljuddata (16kHz, 1-kanal) direkt till modellen och tar emot både ljud (översatt tal) och text (transkribering/översättning) parallellt.
*   **Modell:** Använder \`gemini-2.5-flash-native-audio-preview-09-2025\` för låg latens.
*   **Systeminstruktioner:** En dynamiskt genererad prompt instruerar modellen att agera som simultantolk och injicerar kontext från RAG-systemet (se nedan).

## 2. Avancerad Ljudpipeline (Web Audio API)
Ljudhanteringen är helt implementerad i webbläsaren utan backend-beroenden för ljudbehandling.

### Input-hantering:
*   **Mikrofon:** Använder \`ScriptProcessorNode\` (buffertstorlek 4096) för att fånga rådata, konvertera till Float32 och downsampla till formatet API:t kräver.
*   **NDI (Network Device Interface):** Inkluderar en anpassad \`NdiBridgeManager\` som kopplar upp mot en lokal WebSocket-brygga för att ta emot ljudströmmar från professionell videoproduktionsutrustning.

### Ljudbehandling:
*   **Brusreducering:** En \`DynamicsCompressorNode\` används för att jämna ut volymnivåer och minska bakgrundsbrus innan ljudet skickas till AI:n.
*   **Visualisering:** Realtidsanalys av volym (RMS) och gain reduction för UI-feedback.
*   **Uppspelning:** Hanterar en kö av inkommande PCM-ljudchunkar (base64-avkodade) som schemaläggs för uppspelning ("gapless playback") via \`AudioBufferSourceNode\`.

## 3. RAG (Retrieval-Augmented Generation) & Kontext
Appen har ett inbyggt system för att styra översättningen mot specifika terminologier ("kyrkspråk").

*   **Dokumenthantering:** Användaren kan ladda upp textfiler (.txt, .md) eller skrapa URL:er (via en proxy/fetch-logik).
*   **Kontext-injektion:** Det aktiva innehållet från dessa källor sammanfogas och injiceras direkt i systemprompten (\`systemInstruction\`) vid uppstart av sessionen.
*   **Ordförklaringar (Glossary):** Prompten instruerar modellen att identifiera specifika termer från RAG-källorna. Om en sådan term används, skickar modellen med en förklaring (prefixad med \`EXPLANATION::\`) som UI:t parsar ut och visar i en separat ruta, utan att det stör talsyntesen.

## 4. Applikationsarkitektur (React & Hooks)
Koden är modulär och event-driven:

### Custom Hooks:
*   \`useTranslationSession\`: Huvudlogiken som orkestrerar AI-sessionen, ljudkontexten och tillstånd (status, fel).
*   \`useRag\`: Hanterar CRUD-operationer för kontextdokumenten.
*   \`useSettings\`: Persisterar användarens val (språk, röst, enheter) till localStorage.
*   \`useNdiBridge\`: Kapslar in WebSocket-logiken för NDI.

### Felsökning:
*   En inbyggd testsvit (\`TestRunner\`) som kan köra enhets- och integrationstester direkt i webbläsaren för kritiska moduler som ljudavkodning och RAG-logik.

## 5. UI/UX Funktioner
*   **Dual-stream visning:** Visar både källspråkets transkribering och målspråkets översättning i realtid.
*   **Historik:** Sparar konversationsturer med tidsstämplar och vilken RAG-kontext som var aktiv vid tillfället.
*   **Röstval:** Dynamisk filtrering av tillgängliga röster baserat på valt målspråk (definierat i \`constants.ts\`).

**Sammanfattningsvis** är det en tekniskt sofistikerad "tjock klient" som flyttar nästan all logik (ljudbearbetning, RAG-hantering, testning) till klienten och förlitar sig på Gemini för själva intelligensen.
`;

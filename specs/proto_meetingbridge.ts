
export const PROTO_MEETINGBRIDGE_MD = `# Teknisk genomgång: Mötesbryggan (Prototyp B)

Här är en teknisk genomgång av hur logiken är uppbyggd i koden i prototypen "Mötesbryggan".

Det är viktigt att skilja på **Simuleringen (P2P/Värd)** och den **Faktiska Integrationen (Gateway Controller)**.

## 1. P2P-logik & Mutex (Simulerad i Frontend)
Eftersom detta är en frontend-applikation (utan en extern signaleringsserver som Socket.io eller PeerJS implementerad än), simuleras P2P-nätverket genom ett delat "State"-objekt.

### Mutex (The Talking Stick):
I filen \`types.ts\` och \`App.tsx\` finns fältet \`currentSpeakerId\` i \`MeetingState\`. Detta fungerar som en digital "talarpinne".

*   **Logik:** När din VAD (Visual Voice Activity Detection) upptäcker att du pratar, anropar den funktionen \`handleSpeakStatus\`.
*   **Kontroll:** Appen kollar: Är \`currentSpeakerId\` null?
    *   **Ja:** Sätt mitt ID som speaker. (Jag låser kanalen).
    *   **Nej:** Är det JAG som är speaker? Fortsätt sända.
    *   **Nej (Någon annan):** Blockera min mikrofon (Visa hänglås-ikonen).

### Media-flödet:
När du "har ordet" (Mutex), startar \`MediaRecorder\` i \`MeetingRoom.tsx\`. Den spelar in ljudet, skickar det till Gemini för transkribering/översättning, och resultatet (texten) läggs till i \`transcript\`-listan som alla "ser" (i en riktig app hade denna text skickats över WebRTC Data Channel).

## 2. Värdhantering (Host Management)
Värdskapet styrs av flaggor i användarens tillstånd (\`user.isHost\`) och mötets tillstånd.

### Lobby-systemet:
När en deltagare väljer ett rum, hamnar de inte direkt i \`participants\`-listan utan i \`pendingParticipants\`.
*   **Värdens vy:** Värden ser denna lista ("Waiting Room") och har knappar som flyttar användaren från pending till participants ("Admit").
*   **Gästens vy:** Gästen ligger i loopen \`AppMode.GROUP_LOBBY\` och väntar på att \`user.status\` ska ändras till 'approved'.

### Rums-lås:
Variabeln \`activeRooms\` är en enkel nyckel-värde-lista (\`{ "Sacrament": true, ... }\`). Värdens knappar togglar dessa boolean-värden. När en gäst försöker gå in, kontrolleras först om rummet är \`true\`.

## 3. Gateway Controller (Fas 6 - Den "Riktiga" koden)
Detta är den del som skiljer sig markant. Här simuleras ingenting – här pratar webbläsaren med din C++ backend.

*   **Teknik:** WebSocket (klient i webbläsaren).
*   **Port:** 8081 (C++ servern lyssnar här).
*   **Protokoll:** JSON-kommandon.

### Så här fungerar flödet tekniskt:
1.  **Initiering:** När du går in i \`GATEWAY_ACTIVE\` mode i \`App.tsx\`, öppnas en \`new WebSocket('ws://localhost:8081')\`.
2.  **Handskakning:** C++ servern accepterar kopplingen. Webbläsaren får eventet \`onopen\` och loggar "Connected".
3.  **Kommando (Sänd):** När du trycker på "CONNECT SOURCE" skapas ett JSON-objekt:
    \`\`\`json
    {
      "command": "connect",
      "target": "CHROMEBOOK (MeetingAudio)"
    }
    \`\`\`
    Detta skickas som textsträng över socketen.
4.  **Backend-reaktion:**
    *   Din C++ backend tar emot strängen.
    *   Parsar JSON.
    *   Låser sin interna Mutex (\`g_configMutex\`).
    *   Uppdaterar \`g_currentTarget\` strängen.
    *   Nästa gång NDI-loopen körs, byter den källa till det nya namnet.
5.  **Status (Ta emot):** Webbläsaren lyssnar på \`onmessage\` för att visa loggar från C++ servern (t.ex. bekräftelser eller felmeddelanden).

### Sammanfattning:
Du har byggt en Hybrid-arkitektur.
*   **Användarna** kör en P2P-simulering (för UI/UX-test).
*   **Administratören (Gateway)** kör en skarp Fjärrkontroll mot hårdvaran via WebSockets.
`;

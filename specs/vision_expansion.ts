
export const VISION_EXPANSION_MD = `# Vision: Universal Audio Router (MeetingBridge)

Vi expanderar visionen från en enkel "Gateway" till en **Universal Audio Router**.

## 1. Koncept & Arkitektur
Istället för att bara vara en "lyssnare" (Monitor) som skickar ljud till webben, ska C++ applikationen fungera som en central hubb för allt ljud i mötesrummet.

### Dubbelriktad Kommunikation & Relä
*   **Uppströms (Mic -> Web):** NDI/ASIO -> C++ -> Web (Broadcast).
*   **Nedströms (Web -> Speaker):** Web -> C++ -> ASIO Output (PA-system).
*   **Webb-till-Webb (Relä):** Web A -> C++ -> Web B, C, D. (Möjliggör att distanstolkar hör varandra).

## 2. Hårdvarustöd (Biamp Tesira)
*   **Målhårdvara:** Biamp Tesira (USB/ASIO).
*   **Konfiguration:**
    *   **Input:** 6 kanaler (Mikrofoner från kyrksalen). Servern mixar ner dessa till en mono-ström för AI:n.
    *   **Output:** 2 kanaler (Stereo till PA-systemet). Tolkens röst spelas upp här.
    *   **Format:** 16-bit Integer 48kHz (Matchar Tesira).

## 3. Strategi: Mutex & Echo Gate
Vi använder **Distributed Mutex** för att hålla ordning, men med en viktig skyddsmekanism.

### Varför Mutex?
1.  **Ordning & Reda:** I en kyrkosal vill vi inte att 50 deltagare ska kunna prata i mun på varandra ut i PA-systemet.
2.  **Prioritet:** Predikstolen (ASIO In) har alltid företräde.
3.  **Global Låsning:** 
    *   Om Predikstolen talar -> \`LOCKED (Owner: LOCAL_MICS)\`.
    *   Om en Webbanvändare talar -> \`LOCKED (Owner: WEB_USER)\`.

### Problemet: Acoustic Loopback
Om en tolk pratar (Web -> Speaker) hörs detta i rummets mikrofoner (Speaker -> Mic).
Om vi inte gör något, kommer servern tro att "Någon i rummet pratar" och låsa Mutexen ("LOCKED: LOCAL_MICS"). Detta klipper av tolken mitt i meningen.

### Lösningen: Echo Gate (Loopback Protection)
Vi implementerar en logisk grind i C++ servern:
1.  Mät volymen (RMS) på det vi skickar **UT** till högtalarna (\`OutputLevel\`).
2.  När vi analyserar ljudet som kommer **IN** från mikrofonerna:
    *   **OM** \`OutputLevel > Threshold\` (Vi spelar högt ljud):
        *   **DÅ** Ignorera mikrofonljudet för Mutex-beslut (Lås inte).
    *   **ANNARS** (Det är tyst i högtalarna):
        *   **DÅ** Låt mikrofonljudet styra Mutex som vanligt.

### Audio Relay (Eko-hantering)
För att undvika Mix-Minus-komplexitet gör vi följande i C++:
*   När ljud kommer från Klient A:
    1.  Skicka till Högtalare (ASIO Out).
    2.  Skicka till Klient B, C, D (WebSocket Broadcast).
    3.  **SKICKA INTE** till Klient A (Filter Sender).

### Latensbudget (Uppskattning)
Systemet är designat för tal (tolkning), ej musik.
*   **Webb -> Server:** ~50ms
*   **Server Processing:** ~20ms
*   **Server -> Webb:** ~50ms
*   **Total Roundtrip:** **~120-150ms** (Jämförbart med telefon/Zoom).

## 4. Universal Routing (JSON API)
Systemet styrs via WebSockets:
*   \`{ "command": "connect", "target": "LOCAL" }\` -> Växlar input till de 6 mikrofonerna.
*   \`{ "command": "connect", "target": "NDI_SOURCE" }\` -> Växlar input till en NDI-ström.
`;

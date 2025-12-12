
export const DESIGNTANKAR_MD = `# Några designtankar & Kostnadsanalys

## API & Tjänster
Utöver **Gemini Live API** (\`gemini-2.5-flash-native-audio-preview-09-2025\`) som är "motorn" i dina realtidslägen (Conversational, Simultaneous, Fluid), använder din applikation följande API:er och tjänster baserat på källkoden:

### 1. Gemini Standard (Text & Vision)
Används på två ställen i din kod:
*   **UI-översättning:** När appen startar eller byter språk används \`gemini-2.5-flash\` för att översätta knappar och texter i gränssnittet (JSON-struktur). Detta debiteras som "Text Input" och "Text Output".
*   **Polished Mode (Steg 1):** I detta läge används \`gemini-2.5-flash\` för att ta emot ljudfiler (audio blob), transkribera dem och städa upp texten.

### 2. Gemini TTS (Text-to-Speech)
*   **Polished Mode (Steg 2):** Efter att texten städats upp i Polished Mode skickas den till \`gemini-2.5-flash-preview-tts\` för att generera nytt, rent tal. Detta debiteras separat (Text Input -> Audio Output).

### 3. PeerJS Cloud (Signaleringsserver)
*   **Broadcast Service:** Din fil \`services/broadcastService.ts\` använder biblioteket PeerJS. Om du inte satt upp en egen server (vilket inte syns i koden) ansluter appen som standard till PeerJS gratis "Cloud Server" (\`0.peerjs.com\`) för att koppla ihop användare (Host/Guest). Vid hög trafik i produktion kan du behöva hosta en egen server eller betala för en tjänst, då den gratis servern har begränsningar.

### 4. CDN-tjänster (Hämtning av modeller)
Dessa är inte API-anrop som kostar per anrop på samma sätt, men appen är beroende av att kunna hämta data från dem:
*   **VAD (Voice Activity Detection):** Biblioteket \`@ricky0123/vad-web\` hämtar .onnx-modellfiler (ca 2-3 MB) från jsDelivr (CDN) varje gång en användare laddar sidan första gången.
*   **Tailwind & React:** Hämtas också via CDN i din \`index.html\`.

## Kostnadsanalys (Deployment)

### Sammanfattning av kostnadsdrivare:
1.  **Gemini Live API** (Dyrast, används mest).
2.  **Gemini Flash** (Billigt, används vid UI-start och Polished Mode).
3.  **Gemini TTS** (Används enbart i Polished Mode).
4.  **Hosting:** Kostnad för att hosta själva webbsidan (HTML/JS-filerna), t.ex. via Vercel, Netlify eller Google Cloud Storage.

### Söndagsmötet & Free Tier
*Kan jag exportera projektet till Github och använda free tier API för att översätta söndagsmötena?*

**Svar:** Ja, men med vissa begränsningar.

#### 1. GitHub & API-nycklar
Du kan lägga koden på GitHub.
*   **VIKTIGT:** Ladda **INTE** upp \`.env\`-filen.
*   Använd hosting-tjänstens (Vercel/Netlify) "Environment Variables" för att lagra \`API_KEY\`.

#### 2. Begränsningar med Free Tier
*   **Dataintegritet:** Google använder datan ("Content used to improve our products"). För offentliga möten är detta ok. För konfidentiella samtal, använd Paid Tier.
*   **Rate Limits:** Free Tier har begränsningar (RPM/TPM). För ett långt möte finns risk att bli avbruten ("Resource Exhausted").
*   **Ingen SLA:** Ingen garanti för upptid.

#### 3. Rekommendation
*   **Strategi:** Börja med Free Tier för tester/genrepet.
*   **Backup:** Ha alltid en plan B (mänsklig tolk) redo.
*   **Paid Tier:** Överväg att byta till "Pay-as-you-go" för skarp drift om stabilitet är kritiskt. Kostnaden för Flash-modellen är mycket låg ($0.10/h input, dyrare output men hanterbart).
`;

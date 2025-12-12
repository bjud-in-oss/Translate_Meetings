





export const TODO_MD = `======================================================================
AI FÖRSLAG TILL PROJEKTSTRUKTUR (FAS-INDELNING)
======================================================================
För att lyckas med ombyggnationen bör vi bocka av dessa faser. 
Markera med [+] den fas du vill att vi börjar med i nästa prompt.
Markera med [A] den fas som är aktivt pågående.
Markera med [x] den fas som inte längre är pågående.

När du gjort något, skriv inom parentes efter fasen mer exakt vad som är eller varit pågående inom punkten för att uppmuntra kontinuerlig förbättring.

FAS 0: INFRASTRUKTUR (NUVARANDE FOKUS)
[x] 1. Implementera ladda/spara plan för persistent "plan"-diff (Klar: Implementerat IndexedDB & manuell Fil-import/export)
[x] 2. Dela upp specifikationen i flera filer (Modularitet). (Klar: Har brutit ut till specs/*.ts som separata moduler)
[x] 2b. Utöka SpecEditor med Filhantering (Ny, Radera, Byt namn) samt Auto-save vid stängning. (Klar: Implementerat i SpecEditor)
[x] 2c. AI Studio agenten kan inte radera filer är väl känt, men den kan radera innehållet. Vet du om den kan döpa om till något som tabortmig eller så. (Klar: Implementerat "Soft Delete" i SpecEditor som instruerar AI att tömma/döpa om filer).

FAS 1: GRUNDLÄGGANDE STRUKTUR & API
[x] 3. Skapa "Help"-sidan (?) med API-statusdiagram och förklaring av inställningar. (Klar: HelpModal implementerad och nås via header)
[x] 4. Implementera "JSON-motor" för realtidsöversättning av UI-text. (Klar: Implementerat UITranslationService och dynamisk text i komponenter)
[x] 4a. Rätta UI-översättningen så att modulernas innehåll också översätts, exempelvis "Your Language" och namnen på alla språken man väljer i listan. (Klar: Uppdaterat LanguageSelector och Selectors med dynamiska labels)
[x] 4b. Även när man väljer ingångar och utgångar behöver en sådan översättning göras. (Klar: Labels skickas in i props)
[x] 4c. Ta även bort väljaren av mjukvaru eller hårdvaru mikrofonförsärkning på sista valet som vi redan valt innan vi kom till det steget. (Klar: Tagit bort Group Toggle from ActiveSessionStep)
  
FAS 2: GUIDEN (WIZARD) - OMSTRUKTURERING
[x] 5. Dela upp "ModeSelectionStep" till separata sidor. (Klar: Har delat upp i Group, Mode, och Audio-steg)
[x] 6. Implementera Auto-advance och Power-knapp i Header. (Klar: Power-knapp för Quick Start/Stop och Auto-advance i guiden)
[x] 6b. Inför "Quick Start"-knappar i alla steg av guiden för snabbstart. (Klar: "Start"-knappar med blixtikon tillagda i alla wizard-steg).

FAS 5: KONTEXT & RAG (PRIORITET 1)
[x] 12. Skapa RAG-filhantering i SpecEditor. (Klar: SpecEditor har nu en dedikerad "Context / RAG"-sektion för filer som börjar med 'rag_').
[x] 13. Implementera kontext-injektion i systemInstruction (Gemini Live). (Klar: GeminiLiveService hämtar nu dynamiskt alla 'rag_'-filer från IndexedDB vid uppkoppling).

FAS 3: FÖRFINING & ROBUSTHET (PRIORITET 2)
[x] 7. UX-översyn av Modes:
    - [x] Kategorisera i "Turas om" (Conversational) och "Pratar samtidigt" (Simultaneous).
    - [x] Inför grafiska illustrationer (SVG/Ikoner) för koncepten.
    - [x] Sub-val för varje kategori (Ljudvåg vs Text, Standard vs Fluid vs Presentation).
    - [x] PIN-kod för "Via Text" (Polished).
    - [x] Byt plats: Simultaneous ska ligga först/överst.
    - [x] Säkerställ vertikal scroll på alla sidor.
[x] 8. Implementera "Source Language Selection". (UTVÄRDERAD: Nedprioriterad. Vi antar att "Your Language" är målet och Input är rummet/kanalen. I MeetingBridge löses detta via routing.)
[x] 18. Hot Swap Source Language. (Klar: Implementerat switchLanguage i useAudioSession och UI i ActiveSessionStep).
[x] 9. UI-polish: "Listening..." i header och miniatyr-spektrum. (Klar: Headern visar nu status och frekvensstaplar).
[x] 10. Implementera Session Resumption (Hot Swap). (Klar: Implementerat Proactive Session Rotation var 12:e minut i useAudioSession).
[ ] 11. Hantera GoAway-meddelanden från servern.

FAS 6: INTEGRATION (MeetingBridge) (PRIORITET 3)
[x] 14. Importera MeetingBridge-kod (Gateway, Mutex). (Klar: GatewayService skapad för WebSocket-kommunikation).
[x] 17. UI för "Meeting Host" (Admin-vy). (Klar: Skapat HostAdminStep för konfiguration av Gateway och Source Switching).
[x] 15. Bygg "Pro Client" logik med WebSocket-klient. (Klar: Implementerat binär ljudmottagning i GatewayService och inputSource='GATEWAY' i useAudioSession).
[x] 16. Implementera Distributed Mutex (Host/Guest/ASIO). (Klar: UI lyssnar nu på 'mutex'-meddelanden från Gateway och blockerar input om Host talar).

FAS 7: PRO UI REFINEMENTS (NY)
[x] 19. Input Monitoring (Input VU Meter / Sidetone Visualizer). (Klar: InputMeter visar nivå oberoende av AI).
[x] 20. Network Resilience Alerts (Gateway Disconnect Warning). (Klar: Tydlig varning i ActiveSession om Gateway-kopplingen bryts).

FAS 8: UNIVERSAL AUDIO ROUTER (VISION)
[x] 21. C++: Implementera ASIO-stöd (Device Selection). (Klar: C++ Backend uppdaterad med PaStreamParameters och device enumeration).
[x] 22. C++: Implementera Bi-directional Audio (Web -> Spela upp). (Klar: C++ Backend tar nu emot binärt ljud via WebSocket och spelar upp lokalt).
[x] 23. Buggfix: C++ Memory Leak & Thread Safety. (Klar: Implementerat AtomicRmsAnalyzer och Leak-Free callback från Gemini 3 Pro).
[x] 24. Web: Skicka mikrofonljud till Gateway. (Löst: Webb-till-Webb Relay implementerat i backend).`;
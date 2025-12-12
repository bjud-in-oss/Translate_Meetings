

export const REQS_MD = `# Kritiska Regler (Systeminstruktioner)
*   **Persistent Design:** Designval får inte raderas utan explicit order.
*   **Modularitet:** Vid kodändringar, ändra minsta möjliga mängd kod.
*   **Diff-säkerhet:** Vid osäker persistens, använd "Import Reference" för att återställa jämförelsegrund.
*   **Säkerhet:** Använd alltid IndexedDB för data som måste överleva en "Hard Reload", med manuell fil-backup som fallback.
*   **Transparens:** Inga dolda kodändringar. Allt ska synkroniseras med Planen.

## Specifikation för Designverktyget (SpecEditor)
- **Funktion:** Flytande editor för att redigera och versionshantera designkrav.
- **Diff-motor:** Genererar "Contextual Diffs" (likt Git) så AI:n ser var ändringar sker (rader före/efter).
- **WYSIWYG/Preview:** Split-View (Sida-vid-sida) för att se Råtext och Renderad Markdown samtidigt.
- **Markdown-stöd:** Rubriker (#), Listor (-), Checkboxar ([ ]) och Fetstil (**).
- **Filhantering:** Fullständigt stöd för CRUD (Create, Read, Update, Delete) på *alla* filer i systemet, inklusive namnbyte.
- **Persistens:** Sparar referens via **IndexedDB** samt manuell Import/Export av filer.

# Användarupplevelse & Principer
Användaren är inte alltid teknisk utan är ibland äldre och oerfaren med teknik och ibland hyperteknisk. SPRÅK, VAD, NÄR, VEM, VARFÖR och HUR måste vara kristallklart enkelt för användaren i varje steg. Guiden skall vara kärnfull men en kontext baserad information sida skall finnas för varje val man gör i guiden. Varje val skall också ha ett eget steg i guiden för att få tydligare rubriker och varje rubrik har en förklarande undertext.

# Flöde & Navigation
- **Scrollbarhet:** Alla steg i guiden (särskilt Mode Selection) måste tillåta vertikal scroll om innehållet flödar över skärmkanten. Inga element får klippas av.
- **Auto-advance:** Vid enkla val går guiden automatiskt vidare.
- **Power-knapp:** Möjlighet att starta/stoppa sessionen direkt från headern.

# Hybrid Architecture & Integration (Fas 6)
- **Arkitektur:** Appen ska stödja två lägen: "Light Client" (Web Audio) och "Pro Client" (WebSocket Gateway till C++ Server).
- **Protokoll:** Kommunikation med C++ backend sker via WebSockets (JSON).
- **Ljudkällor:**
  - *Light:* Webbläsarens mikrofon.
  - *Pro:* NDI/ASIO strömmar från C++ servern.
- **Mutex (Talking Stick):**
  - Servern agerar dirigent.
  - Prioritering: Fasta mikrofoner (ASIO) har företräde (eller ingår i mutex-loopen).
  - Mobiler (WebSockets) mutas när fasta mikrofoner sänder.
  - Om en mobil får ordet, skickas översättningen till PA-systemet (via ASIO Output).
- **Meeting Host:** Ett admin-gränssnitt krävs för att styra rum, se deltagare och hantera Mutex manuellt vid behov.

# RAG & Context (Fas 5)
- **Kontext:** Möjlighet att definiera filer (Text/Markdown) som injiceras i AI:ns systeminstruktion.
- **Syfte:** Ge AI:n tillgång till ordlistor, namn, teman och liturgiska termer för korrekt översättning.
- **Editor:** En sektion i Plan-verktyget ("FILES") ska dedikeras till att redigera dessa kontext-filer.

# Layout för "Välj hur tolkarna pratar" (Mode Selection)
- **Ordning:** "Simultaneous" (Den ena tolken talar samtidigt) ska visas först (Vänster eller Överst beroende på skärmstorlek).
- **Conversational:** Visas som sekundärt val (Höger eller Under).
- **Hierarki:** Sub-alternativ (Ljudvåg/Text, Standard/Faster/Presentation) ska ligga tydligt grupperade under respektive huvudval.

# Header & Status
Skall den alltid vara synlig i sidhuvudet och heta nåt i stil med "Start translating" och att man ser statusen "Listening..." samt en liten version av de vackra frekvens staplarna? Även Language English, Mode simultaneous och knappen "End Session" behöver då alltid synas. Vore det i stället för branding bättre att använda sidhuvudets yta och fokusera på funktionalitetet i stället för namnet på appen. Jag vill inte sälja appen bara att den skall användas i kyrkan. Den vackra gröna statuspukten i övre högra hörnet är också bra, men om man ändå alltid visar en mindre versoin av staplarna där uppe någonstans när översättningen är igång så säger punkten samma sak. Detta designval påverkas av hur APIets olika status hänger samman. Denna fråga behöver grundligt redas ut iterativt.

# Realtidsöversättning av UI
Varje text genereras i realtid utifrån en strukturerad json eller xml översättningsprompt som körs i realtid när man valt språk i väljaren "Your language" som är det första valet som görs. Textinnehållet i alla sidor och deras modaler skall alltså finnas i denna enda prompt. Inget annat för användaren synsligt textinnehåll skall användas i appen utom den första sidan i guiden som genereras och översätts i en separat prompt när appen startar. En stor genomskinlig status visare skall visas över hela skärmen medans översättningsprompterna körs där man i massor av språk och tillfälligt ser ordet "Översätter" över hela skärmen tills översättningsprompten har körts.

# Språkval
Det första som visas i bakgrunden under det första översättningsmeddelandet skall vara "Choose your language" fast i det språk som sparats sedan förra sessionen i webbläsaren eller det förvalda språket som är det som identifieras automatiskt används av webbläsaren.

Angående informationen på denna första sidan: Eftersom det alltid finns två språk så är det inte självklart vilket av dem man menar när man gör sitt val. Detta val behöver redas ut iterativt. Kan och skall i så fall användaren belastas att välja detta.

# Källspråksdetektering
Tidigare är sagt att man alltid översätter från svenska. Men jag har provat prata vilket språk som helst och den översätter automatiskt från andra språk. Då misstänker jag att översättaren inte är inställd för att alltid översätta från svenska. Kanske är det bra att inte ange språk man översätter från utan att detta görs automatiskt eftersom det förenklar. Å andra sidan vet du om det blir bättre översättning om API:t för specificerat vilket språk som man översätter från. Eller kan man specificera detta men att API:t inte bryr sig så mycket om detta? Dessa frågor behöver besvaras i "?" sidan.

# Hjälp & API-status
För att bättre förstå undrar jag också om API:t är gjort för att ställa in vissa inställningar innan sessionen startas, hur många typer av tillstånd har sessionen. Vilka inställningar kan man göra före och under varje sådan eventuell tillstånd. Detta är kritiskt för mig att lära mig förstå för att kunna ställa in guiden i rätt ordning och betydelse. Kan du hjälpa mig att förklara i detalj alla inställningar i förhållande till om de ställs in före eller efter alla status och i vilken ordning dessa status kan köras mellan varandra. Kan du göra en frågetecken ikon och placera den i övre högra hörnet på appen som leder till denna förklarande sida.

Kan du rita en graf över ordningen av alla statusar i förhållande till varandra och vilka inställningar som föregår, görs under eller görs efter varje status. Börja guiden med en sådan sida.

# Inställningar (Mode & Group)
Växlingen mellan small och large kräver att man trycker "End Session" först och startar om fortfarande. Som jag förstår så är det kanske bra att det är så. Jag tänkte den knappen bör läggas in i guiden som ett eget steg efter att man väljer språk. Det behövs en utförlig men enkel förklaring för användaren att förstå vad valet innebär inte bara om det är stor eller liten grupp även om det är konsekvensen. Så förstår man inte varför. Jag söker ord man kan använda för att förenkla men få med essensen av vad det är man väljer.

Sen i Session Setup det sista steget i gudien, så är det två funktioner där. Jag tror det är tydligare om man bara har en funktion man väljer i varje steg i gudien. Dessa två (mötestyp och ljudanslutningar) behöver ha var sitt steg i guiden. Dessa två (mötestyp och ljudanslutningar) behöver ha var sitt steg i guiden.`;
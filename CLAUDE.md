# CLAUDE.md — portfolio di alessandro bottone

Brief operativo aggiornato al 2 ottobre 2026. Le sezioni seguenti descrivono il sito attuale; lo storico in fondo conserva anche scelte poi sostituite. Per la guida pratica parti da [README.md](README.md).

## 0. come lavorare con me

- Le istruzioni in chat hanno priorità su questo file, sulle skill e sulle impostazioni delle librerie.
- Rispondimi in italiano con spiegazioni semplici. Sono un designer.
- Lavora sulle attività già autorizzate fino al risultato verificabile; mostra le modifiche e gli esiti dei controlli. Chiedi soltanto informazioni necessarie che mancano.
- Non installare software di sistema. Per dipendenze nuove non già previste chiedimi prima.
- Push e deploy richiedono una richiesta esplicita. **Il 29 settembre 2026 ho autorizzato un team a fare debugging, pulizia, riorganizzazione, aggiornamento dei Markdown, creazione di un branch GitHub e deploy Vercel.** **Il 1 ottobre 2026 ho autorizzato un team a: mettere il logo dietro il computer, debugging, pulizia, documentazione, merge di `prova/computer-retro` in `main`, push su GitHub e deploy Vercel in produzione, anche con i crediti del computer e della sala ancora segnaposto (rischio accettato).** **Il 2 ottobre 2026 ho chiesto di aggiornare il repository GitHub e il sito su Vercel (merge di `prova/nome-3d-schermo` in `main`, push e deploy in produzione).** Queste autorizzazioni valgono per quei lavori; non autorizzano nuove pubblicazioni future.
- Conserva i file creativi originali e le decisioni storiche. Aggiorna la documentazione quando cambia il comportamento o la struttura.

## 1. il progetto

Portfolio one-page di Alessandro Bottone, designer di Napoli: branding, illustrazione, 3d (web design in arrivo). Percorso unico:

**preloader → header → portfolio → chi sono → contatti**

Solo italiano, desktop e mobile curati allo stesso livello. Il logo è il protagonista: dapprima segno SVG, poi un volto metallico 3d continuo dentro una sala di cemento realistica. Lo scroll guida il racconto in entrambi i sensi.

Il nome grande dell’header diventa un logo tipografico fisso in alto a destra, cliccabile per tornare all’inizio. Nei contatti, sotto i tre pulsanti, compare il copyright con anno corrente. Queste richieste sostituiscono il vecchio vincolo «nessuna navbar, nessun footer».

Riferimenti: pxpush.com per ritmo e interazioni; il Finder del Macintosh 1984 per l’interfaccia del computer. I riferimenti orientano il progetto, non vanno copiati (niente marchi Apple).

## 2. regole non negoziabili

1. Interfaccia con nero `#141414`, grigio `#4d4b4a`, bianco `#c9c5c0` e trasparenze. La scena 3d è in bianco e nero noir (`components/volto/cinema.ts`): l’unico colore della pagina è lo schermo del computer con i progetti. Unico tocco di colore della scena: la luce della fessura, arancione caldo (`cinema.sole`). Eccezioni: immagini dei progetti, luci sul 3d e, solo dentro lo schermo del computer, bianco e nero dei fosfori (bianco caldo `#e7e1d1`, nero del tubo `#161614`). Le copertine rimangono sempre a colori. L’avatar olografico del chi sono usa le foto di alessandro ridotte al bianco della palette.
2. Solo Outfit (Variable; Black statico per il nome in metallo), tranne ChicagoFLF dentro lo schermo del computer; testi visibili, titolo del browser ed etichette accessibili in minuscolo. Apostrofo tipografico (’).
3. Non riscrivere il testo biografico né i testi forniti dei progetti. Testi e link fissi in `src/config/sito.ts`.
4. Scroll sempre controllabile e reversibile. Blocchi temporanei soltanto durante il preloader. Il pin non ferma lo scroll.
5. Niente sezioni o copy aggiuntivi non richiesti. Nome fisso e copyright sono già autorizzati.
6. Testi, pulsanti e copyright devono restare leggibili sopra l’ambiente; le finestre del computer hanno sfondo opaco.
7. Stesso computer, discesa della camera, luci, nebbia ed effetti «cinema» su telefono (lì l’interfaccia occupa la vista). La qualità adattiva (`components/volto/qualita.ts`) può abbassare solo la risoluzione interna di nebbia, riflesso e DPR quando i 60fps non reggono: stessa scena, mai un effetto tolto. Il movimento ridotto è una preferenza di accessibilità, non una semplificazione legata al dispositivo.
8. Tastiera, focus, contrasto, touch e fallback funzionanti; verificare le prestazioni senza promettere risultati non misurati.

## 3. stack e responsabilità

React 19, TypeScript strict, Vite 8, Tailwind v4, GSAP e ScrollTrigger, Motion, Lenis, React Router, Three.js e React Three Fiber. shadcn per il button di base (conservato in `components/ui/`, oggi non usato), Lucide e SVG Figma per le icone. post-produzione con postprocessing e @react-three/postprocessing; PDF con react-pdf e page-flip; Zod per la validazione in sviluppo/build; Sharp e glTF Transform per gli script. Versioni esatte in `package-lock.json`.

- GSAP: scroll, pin, scrub, avvicinamento al computer, preloader, disegno/morph SVG.
- Motion: hover, tap, magnetismo, testi che rotolano, rivelazione delle immagini e micro-interazioni.
- Una sola istanza Lenis sincronizzata con il ticker GSAP; su touch scroll nativo.
- GSAP e Motion non animano la stessa proprietà dello stesso elemento. Usare wrapper distinti.
- GSAP scrive le pose in `percorso.ts`; R3F le legge per fotogramma senza aggiornare lo stato React. La camera reale resta ferma: `Mondo.tsx` muove sala e computer (`components/computer/inquadratura.ts`).
- Plugin GSAP registrati in `src/lib/gsap.ts`; lifecycle e cleanup con `useGSAP`/`gsap.matchMedia`.

Dettagli: [architettura](docs/architettura.md).

## 4. design system

Token in `src/styles/globals.css`: tre colori, Outfit, scala tipografica, bagliore e focus. Testo da leggere bianco sul fondo nero; grigio riservato a superfici, bordi e parole della biografia prima della rivelazione.

Pulsanti Figma in `src/components/bottoni/`: riposo bianco/testo nero, hover/focus nero/testo bianco con bagliore, premuto con bordo bianco. Contatti in misura big, solo testo. Dentro lo schermo del computer valgono le regole del Finder 1984 (`components/computer/computer.css`): bianco e nero dei fosfori, trama grigia retinata, finestre a righe, ChicagoFLF; sopra, un vetro sporco (riflessi, polvere, grana, righe, vignetta) che non riceve clic. Focus bianco 2px con offset 4px; controlli principali almeno 48px.

Durate, scrub e lunghezze di scroll in `src/config/movimento.ts`. Evitare numeri duplicati nelle sezioni.

## 5. il protagonista: il volto

`Volto.tsx` usa la geometria a tratti in `geometria.ts` per preloader, prime fasi dell’header e riserva SVG. `LogoContinuo.tsx` ospita il Canvas della scena (unica eccezione: il Canvas leggero del nome in metallo, §6.2); `Volto3D.tsx` usa `public/volto/logo-metallo-v2.glb`, esportata dalla scena originale `sorgenti/logo-3d/Logo3DAnimabile_MetalloGrezzo_V2.blend`.

Il modello mantiene parti separate, materiale metallico grezzo e shape key. `VoltoContext` e `sguardo.ts` coordinano sguardo, battiti, sonno dopo inattività, risveglio, occhiolino e sorriso. Ai contatti posizione e scala si fermano, espressioni e sguardo continuano.

`Ologramma.tsx` (stesso Canvas) disegna l’avatar del chi sono dall’atlante di fotogrammi in `public/avatar/`.

Gli originali Blender non vanno sovrascritti dagli script web. Le demo delle clip rimangono nei sorgenti; il runtime pilota le espressioni dagli eventi reali. [Volto](docs/volto.md) e [sorgenti Blender](sorgenti/logo-3d/README.md).

## 6. storyboard corrente

### 6.1 preloader

Contatore `000 → 100`, volto che si disegna e si sveglia, poi raggiunge l’header; in basso «scorri per esplorare» si scrive insieme al volto e la freccia compare al risveglio. Caricamento reale di font, codice 3d, GLB V2 condivisa, nome in metallo e prima copertina; minimo 1,6s, massimo 6s, seconda visita 0,8s. Un errore non blocca il sito. Con movimento ridotto niente risorse 3d né volo.

### 6.2 header

Pin ≈ 332vh desktop/tablet e ≈ 249vh telefono (400/300 × 83%). Tre discipline: illustrazione, branding, 3d. Web design è spento finché non ci sono progetti (`webDesignAttivo` in `src/config/discipline.ts`): la sua fase (finestra del browser disegnata attorno al logo, puntatore, clic) è conservata nel codice e torna, con pin 400/300vh, rimettendo `true`; si riaccende solo su richiesta di alessandro. Logo interamente visibile, largo `min(86vw, 104svh)`; nome e cognome, in Outfit Black estruso nello stesso metallo del logo fin dalla fine del preloader, restano fino alla fine della fase 3d (92% con la fase web) e poi si raccolgono in alto a destra, ancora in 3d (`components/nome/`; le lettere DOM restano come sagoma trasparente, con movimento ridotto o errore tornano visibili). Le lettere vicine al cursore si girano verso di lui e prendono la luce. «scorri per esplorare» respira in basso finché non si scorre (al posto della vecchia linea). Etichette grandi, senza numeri e senza quattro trattini. Ambiente e logo metallico compaiono insieme nella fase 3d.

### 6.3 header → portfolio

Sovrapposizione di uno schermo, logo persistente al centro. Nessun rimontaggio del logo.

### 6.4 portfolio: il computer

`Computer.glb` (PC beige, originale in `sorgenti/computer/`) poggia sul pavimento della sala di cemento, nel fascio di sole della fessura. Nessun pin: 100vh di avvicinamento (la camera guarda giù verso il computer a terra e scende fino allo schermo; il volto va dietro il computer, più grande del monitor, e sporge sopra) e 120vh di sosta con la camera ferma. Nella sosta il volto gioca a nascondino dietro il monitor, solo dai lati in cui si vedono gli occhi interi (`latiDisponibili` in `percorso.ts`): su desktop e tablet orizzontale destra e sinistra (sopra non c’è spazio), su tablet verticale sopra e sopra spostato verso un lato; mai lo stesso lato due volte di fila, resta qualche secondo e rientra; mentre dorme non sbuca. Sbatte le palpebre aprendo una cartella, sorride all’apertura di un progetto, fa l’occhiolino alla chiusura; lo sguardo segue il cursore anche sopra il Finder, un clic sull’interfaccia non fa l’occhiolino. Su telefono nessun nascondino: nella sosta l’interfaccia lo copre, si vede grande durante la discesa. Al 90% dell’avvicinamento si accende (tubo che si apre, trama grigia, volto pixelato al posto dell’Happy Mac, scrivania); tornando su si spegne. Desktop/tablet: cornice del monitor visibile. Telefono: la camera supera la cornice e l’interfaccia occupa la vista.

Interfaccia fedele al Finder del Macintosh 1984, DOM vero posato sul vetro con una `matrix3d`: barra dei menu (volto, archivio, vista, speciale), una cartella per disciplina visibile (illustrazione, branding, 3d; web design con l’interruttore), un documento per progetto (un progetto può stare in più cartelle). Clic seleziona, doppio clic apre; tocco, penna e tastiera aprono con un’attivazione. Finestre trascinabili, vista per icona o per nome, Esc e casella di chiusura. Interattiva soltanto nella sosta.

### 6.5 finestra del progetto

`/progetti/:slug` apre la finestra del documento dentro il computer; la home resta montata. Copertina e immagini a colori, discipline · anno · cliente, descrizione, blocchi PDF/immagini/3d/video/testo caricati quando servono. Chiusura con casella, Esc, «archivio → chiudi» o indietro; focus restituito all’icona. Link diretto: home a metà della sosta, computer acceso, finestra aperta, anche su mobile. [Computer](docs/computer.md).

### 6.6 chi sono

Testo biografico attuale invariato: parole dal bianco al 31,5% al bianco pieno. Niente firma. Il logo arriva a sinistra, si schiaccia in una riga e lascia il posto all’avatar di alessandro a nuvola di punti (video di Google Flow, monocromo, bagliore leggero): la testa segue il cursore scegliendo i fotogrammi del video (destra = specchio), su e giù con una piccola inclinazione; con tocco o mouse fermo si guarda intorno da sola. Prima del volo ai contatti l’avatar torna logo. Movimento ridotto: avatar fermo. Pin soltanto se il testo entra nell’altezza disponibile; altrimenti flusso normale. [Volto](docs/volto.md#avatar-olografico-del-chi-sono).

### 6.7 contatti

Logo grande al centro, posizione e scala ferme. Instagram, Behance ed email sotto; copyright con anno corrente. Email copiata con feedback, occhiolino/sorriso e annuncio accessibile; fallback `mailto:` se la copia fallisce.

Dettagli e parametri: [animazioni](docs/animazioni.md), [ambiente 3d](docs/ambiente-3d.md).

## 7. cursore

Solo con mouse e senza movimento ridotto. Punto, anello sui controlli, parola contestuale sulle aree interattive. Sullo schermo del computer lascia il posto alla freccia pixel del 1984. Si aggiorna anche dopo scroll, focus e cambio rotta; su touch cursore di sistema.

## 8. micro-interazioni

Riusare `Bottone`, `RotolaAlPassaggio`, `TestoCheRotola`, `Magnetico` e `NomePesoVariabile`. Ogni hover ha un equivalente touch/focus. Grana animata solo con mouse, statica su touch e con movimento ridotto.

## 9. dati e authoring dei progetti

Una cartella in `src/content/progetti/<slug>/` con `progetto.json`, copertina e file dei blocchi. Titolo, descrizione, discipline, anno e copertina obbligatori; cliente, ordine e blocchi facoltativi. `pubblicato: false` nasconde il progetto, non protegge file riservati.

`src/lib/progetti.ts` legge URL e dati con glob Vite, completa i valori predefiniti, filtra e ordina. Zod e `scripts/valida-progetti.ts` controllano dati e file in sviluppo/build. Gli originali in `_originali/` non entrano nel bundle.

- `npm run nuovo-progetto`: crea dati iniziali non pubblicati.
- `npm run prepara-progetti`: WebP, copertine 900px, GLB Meshopt, controlli e avvisi sul peso.
- `npm run comprimi-pdf -- <entrata> <uscita> [px] [qualità]`: pagine in JPEG dentro un nuovo pdf (PDFKit di macOS) per stare sotto 15 MB; originale in `sorgenti/progetti/<slug>/`.
- `npm run build`: TypeScript, validazione e output Vite.

[Guida pratica](docs/come-aggiungere-un-progetto.md), [schema e script](docs/progetti.md).

## 10. responsive

Telefono <768px, tablet 768–1023px, desktop ≥1024px. Computer e ambiente restano presenti ovunque; su telefono l’interfaccia del computer occupa la vista, con una fascia per il nome fisso. `svh`/`dvh`, safe area iOS e almeno 16px di margine. Verificare anche dispositivi fisici quando disponibili: emulazione non equivale a prestazioni mobili reali.

## 11. prestazioni

Canvas della home su `demand` (anche quello leggero del nome, disegnato solo quando si muove), aggiornamenti soltanto con scena visibile e scheda attiva; DPR massimo 1,5 uguale su desktop e mobile. Modello del computer ≈ 1 MB, scaricato dopo il preloader insieme all’interfaccia; risorse locali liberate allo smontaggio, cache dei modelli conservata. Sala ≈ 4,6 MB (luce cotta in Blender, cemento PBR), scaricata dopo il preloader; post-produzione come render unico (occlusione, volume a risoluzione ridotta fino a 32 campioni, profondità di campo, bagliore e alone, striscia anamorfica, AgX, colore da pellicola, aberrazione, grana; parametri in `components/volto/cinema.ts`); polvere che brilla nel fascio; shader e texture preriscaldati prima che il 3d si veda; mappa d’ombra disegnata una volta; nessuna HDRI di studio. Interfaccia e blocchi divisi in chunk; movimento ridotto evita il download del logo 3d ma scarica computer e sala per la scena ferma.

Obiettivo di fluidità: 60fps. Misurare con `npm run misura-fluidita` (alimentazione collegata: a batteria macOS limita Chrome a 30fps) e sulla versione pubblicata; le misure Lighthouse del 26 settembre sono storiche e precedono l’ambiente V2. [Accessibilità e prestazioni](docs/accessibilita-prestazioni.md).

## 12. accessibilità

Movimento ridotto aggiornabile a sito aperto: niente pin/scrub/Lenis né logo 3d, SVG statici, computer già acceso in una scena ferma e subito utilizzabile, dissolvenze brevi. Tastiera completa; controlli invisibili `inert`; menu con frecce, finestre non modali con Esc e focus restituito all’icona. Un `main`, quattro sezioni etichettate, un `h1`, titoli di sezione accessibili. Canvas decorativo `aria-hidden`, copie `sr-only` dei testi animati. Testi alternativi in minuscolo.

## 13. struttura

[Architettura e cartelle correnti](docs/architettura.md). `src/` contiene codice e progetti, `public/` soltanto asset runtime, `sorgenti/` originali creativi ed esportazioni, `scripts/` strumenti di authoring, `docs/` guide. File originali e backup Blender restano sul disco; cache rigenerabili e backup automatici non si pubblicano. Le letture live dei media query condividono `src/lib/useMediaQuery.ts`.

## 14. lavoro e verifiche

La costruzione iniziale per fasi è conclusa. Per il lavoro autorizzato del 1 ottobre: logo dietro il computer → debugging e pulizia → documentazione coerente → build/lint e verifica dei flussi → merge in `main` → push GitHub → deploy Vercel in produzione. Non creare pause di approvazione già superate dalla richiesta in chat.

## 15. checklist finale

- Palette, Outfit e minuscole; nessun testo fornito modificato.
- Header, discesa al computer, accensione/spegnimento e uscita reversibili.
- Progetti veri nelle cartelle (oggi tre di branding, cinque di illustrazione e uno di 3d; web design spento); finestre, chiusura, indietro e link diretto.
- Crediti CC BY del computer e licenza della sala completi in `sito.computer.crediti`. Il 1 ottobre 2026 alessandro ha scelto di pubblicare comunque con i segnaposto (rischio accettato): restano da completare.
- Nome fisso, biografia leggibile, contatti e copyright.
- Tastiera, movimento ridotto, fallback SVG/DOM, telefono e cambio viewport.
- Build/lint superati; asset, rotte e funzionalità verificati anche nel deploy.
- Risultati e limiti di verifica riportati senza trasformare gli obiettivi in misure.

## 16. materiali

Logo SVG e GLB originali in `sorgenti/logo/`; scene Blender, texture e render in `sorgenti/logo-3d/`; GLB V2 ottimizzata in `public/volto/`. Sala originale `Ambiente.glb`, scena realistica e cottura in `sorgenti/sala/` (licenza da verificare), copia web in `public/sala/`. Computer originale in `sorgenti/computer/` (licenza CC BY: autore e link da ritrovare), copia web in `public/computer/`; ChicagoFLF (dominio pubblico) in `src/assets/font/`; Outfit Black statico (OFL) in `sorgenti/font/`, contorni delle lettere del nome in `public/nome/` (`npm run genera-nome-3d`). Progetti pubblicati: dai tre fuochi, lorenzo, serena brancale (branding, progetti accademici iuad, 2026); arabian sunset, donne selvagge, don’t look medusa, dove la guerra non arriva e la serie inktober (illustrazione, progetti personali, 2025); cuphead e mugman · art toys (3d, progetto accademico iuad, 2026: presentazione pdf, modello glb da `scripts/blender/esporta-cuphead.py`, .blend e .fbx originali in `sorgenti/progetti/cuphead-mugman-art-toys/`); i pdf originali stanno solo sul disco in `sorgenti/progetti/` (fuori da git), nel sito la versione compressa con `npm run comprimi-pdf`. Foto di alessandro originali in `sorgenti/foto/FotoMie/` (fuori da `public/`); foto e video a punti di Google Flow in `sorgenti/foto/flow/`; atlante web in `public/avatar/` (`npm run prepara-avatar`). `sorgenti/foto/avatar/` conserva i materiali della prima prova scartata. Conservare le scene utente anche quando non sono usate dal sito.

## 17. pubblicazione

Repository GitHub `alessandrobottone2005-crypto/alessandrobottone` (prima `ProvaLandingPagePortfolio_Claude`); progetto Vercel `alessandrobottone` (prima `provalandingpageportfolio-claude`), dominio `alessandrobottone.vercel.app` (il vecchio dominio resta attivo). Dal 1 ottobre 2026 si lavora su `main`, dove sono stati fusi `prova/computer-retro` (1 ottobre) e `prova/nome-3d-schermo` (2 ottobre); `codex/manutenzione-portfolio-3d` è il branch storico della manutenzione del 29 settembre. Nuovi merge, push e deploy richiedono una richiesta esplicita. La pubblicazione corrente si documenta solo dopo conferma di URL, commit ed esito. [Procedura e stato](docs/pubblicazione.md).

## decisioni prese

Le voci seguenti sono uno storico cronologico: nomi di file, numeri e soluzioni superati non sono istruzioni per riportare il sito a una versione precedente.


- 2026-09-26 — versioni: vite 8, react 19, react router 8 (modalità libreria con `BrowserRouter`), tailwind 4.3, gsap 3.15, motion 13, lenis 1.3, typescript 6 (strict).
- 2026-09-26 — shadcn inizializzato con base radix e preset "nova"; ha portato le sue dipendenze (`radix-ui`, `class-variance-authority`, `cn`, `tw-animate-css`, `shadcn`). Il font geist del preset è stato rimosso.
- 2026-09-26 — rotta modale: la home resta sempre montata; il pannello è una rotta separata che legge `state.sfondo` per decidere se chiudere tornando indietro (aperto dal sito) o andando a `/` (link diretto).
- 2026-09-26 — validazione progetti condivisa tra sito, script e build (`src/lib/schema.ts` + `scripts/valida-progetti.ts`); i progetti con `pubblicato: false` possono essere incompleti.
- 2026-09-26 — `prepara-progetti` sposta gli originali in `<progetto>/_originali/` (non finiscono nel sito) e crea `<copertina>-card.webp` (900px) per le card; i `.glb` sono compressi con meshopt.
- 2026-09-26 — in sviluppo le sezioni vuote mostrano un’etichetta grigia "provvisorio · …", che sparisce da sola nel sito pubblicato.
- 2026-09-26 — il logo fornito (`public/volto/Logo.svg`) ha forme espanse: il volto è stato ricostruito a tratti in `src/components/volto/geometria.ts`, misurando le forme originali (coincide quasi del tutto; semplificate solo le piccole tacche in basso sulle lenti). La pupilla è un anello ellittico ritagliato sotto la palpebra; la palpebra è un arco con "apertura" da 0 (chiusa, arco verso il basso) a 1 (sveglio). Lo stato "sveglio" è volutamente contenuto: aprendo di più la palpebra si scontra con la lente.
- 2026-09-26 — le favicon (sveglia e addormentata) si generano dalla stessa geometria con `npm run genera-favicon`.
- 2026-09-26 — con movimento ridotto il volto non sbatte le palpebre e le pupille restano ferme; i cambi di stato sono istantanei.
- 2026-09-26 — modello 3d: il file fornito (`public/Logo.glb`, una sola mesh unita, ruotata di ≈ 2°) è compresso con meshopt in `public/volto/volto.glb` (92 kB); il codice lo raddrizza e lo allinea in pixel al volto svg leggendone la posizione a ogni fotogramma.
- 2026-09-26 — header: timeline in unità 0–100 (etichette illustrazione 0, branding 25, 3d 50, web design 75). Nella fase branding il volto si sposta per far posto al logotipo (a destra su desktop, sotto su mobile). La finestra del browser si restringe a una card 4:5 larga ≈ 224/247 del volto, con la copertina del primo progetto: nella fase 4 l’anello partirà da questa misura.
- 2026-09-26 — preloader: contatore grande (peso 200) in basso a destra; il volto del preloader è un po’ più grande (30vmin) e si rimpicciolisce volando su quello dell’header (26vmin, minimo 11rem su mobile).
- 2026-09-26 — fasi 4 e 5 svolte da un team di agenti in autonomia (su richiesta di alessandro), senza commit né push.
- 2026-09-26 — portfolio: la sezione si sovrappone all’ultima schermata dell’header (margine `-100svh`) e resta invisibile finché lo scroll non ci arriva, così la card finale dell’header diventa la card frontale; misura della card derivata da `CARTA` e `volto.header` (`src/sections/Portfolio/comune.tsx`).
- 2026-09-26 — anello: sulla card solo la copertina; titolo, discipline e anno sotto l’anello (e nel testo del link). Scroll in tre tratti: disposizione 70vh, 50vh per progetto, coda 30vh (`movimento.portfolio`). Aggancio e “tieni premuto” gestiti via lenis; “tieni premuto” solo con mouse e penna. Un clic su una card laterale la porta davanti invece di aprirla.
- 2026-09-26 — grigio → colore delle card con due immagini sovrapposte e un velo nero, animando solo l’opacità.
- 2026-09-26 — mobile: pila di card sticky al centro; la prima cresce dalla misura della card dell’header.
- 2026-09-26 — pannello: pdf sfogliabile con `page-flip` (react-pageflip non supporta react 19) in un wrapper nostro, react-pdf disegna le pagine ±3 da quella aperta, senza strato di testo. Dipendenze aggiunte: `react-pdf`, `page-flip`.
- 2026-09-26 — pannello: la pagina sotto arretra con transform su `main` (compensato se al centro c’è una sezione bloccata); la copertina vola con un clone animato solo con transform e clip-path; il focus torna alla card dell’ultimo progetto visto.
- 2026-09-26 — pannello: il canvas 3d nasce la prima volta che il blocco è in vista, poi resta in pausa fuori vista; video da link caricati solo al clic, autoplay muto e in loop solo in vista; su mobile il foglio si chiude trascinando in giù (≥120px o gesto rapido).
- 2026-09-26 — `optimizeDeps.include` in `vite.config.ts` per react-pdf, page-flip e r3f/drei (evita doppie copie di react in sviluppo).
- 2026-09-26 — `src/content/progetti/prova-blocchi/` è un progetto di prova con tutti i tipi di blocco: va eliminato prima della pubblicazione.
- 2026-09-26 — chi sono: parole “spente” = bianco al 31,5% di opacità (= #4d4b4a sul nero), si anima solo l’opacità; testo desktop `clamp(1.125rem, min(2.6vw, 3.5svh), 2.5rem)` per stare tutto nello schermo; pin e griglia foto/testo da 768px.
- 2026-09-26 — foto: in attesa di quella vera c’è `src/assets/foto/foto-provvisoria*`; per sostituirla: foto in `src/assets/foto/`, `npm run foto-palette -- <file>`, cambiare l’import in `ChiSono.tsx`, regolare `src/config/foto.ts` (x/y = punto a metà tra le lenti). Lo script converte pixel per pixel (sharp `.linear()` non funzionava).
- 2026-09-26 — contatti: il testo nero dei pulsanti è una seconda copia ritagliata dal riempimento bianco (cerchio con clip-path dal punto d’ingresso del cursore); tooltip dell’email fatto con motion; se la copia fallisce si apre `mailto:`; su touch i pulsanti rotolano all’entrata in vista.
- 2026-09-26 — `RotolaAlPassaggio` e `Magnetico` sono i componenti da riusare per link e pulsanti in tutto il sito.
- 2026-09-26 — correzioni alla fase 3: lo scroll ora si sblocca a fine preloader (prima restava `overflow: hidden`), lenis nasce già fermo durante il preloader, lettere del nome con `y: 0` esplicito; con un link diretto la home scorre fino ad anello già formato.
- 2026-09-26 — fase 6 (rifinitura) svolta da un agente: lighthouse mobile prestazioni 73→81, accessibilità 92→96, buone pratiche 100, seo 83→100; bundle principale 250→210 kB gzip.
- 2026-09-26 — 3d: drei non si importa più intero; luci da studio e caricamento `.glb` (meshopt) in `src/components/volto/tre.ts` con three puro, condivisi tra header e blocco 3d; da drei solo `OrbitControls` e `ContactShadows`.
- 2026-09-26 — zod non si scarica nel sito: i progetti sono validati in build e nel terminale; nel sito solo i valori predefiniti (`src/lib/dati.ts`). `build.assetsInlineLimit: 0`. Plugin Flip rimosso (non usato).
- 2026-09-26 — `foto-palette` crea anche `<nome>-palette-900.webp`; la foto del chi sono usa `srcset` (900/1600).
- 2026-09-26 — cursore: ricalcola la forma a ogni cambio di indirizzo, di focus e negli scroll interni.
- 2026-09-26 — micro-interazioni: pulsanti di pannello e blocchi con `Magnetico` (4–6px per i controlli ravvicinati) e `RotolaAlPassaggio`; stati premuto con `active:scale`; focus da tastiera che entra in 0,3s.
- 2026-09-26 — movimento ridotto: regola css globale che annulla transizioni e animazioni css tranne le dissolvenze (0,2s).
- 2026-09-26 — nome nell’header limitato anche dall’altezza: `clamp(3.5rem, min(15vw, 26svh), 16rem)`; il chi sono si blocca solo da 768px di larghezza e 560px di altezza.
- 2026-09-26 — il bordo della card dell’header passa da bianco a grigio con la trasparenza (bianco al 31,5% = #4d4b4a).
- 2026-09-26 — testo del chi sono: copia nascosta per gli screen reader, parole animate nascoste (aria-hidden).
- 2026-09-26 — costanti dell’header in `Header/misure.ts`; `Portfolio/comune.tsx` diviso in `carta.ts` e `Copertina.tsx`.
- 2026-09-26 — anticipate dalla fase 7: meta description in `index.html` (da `sito.descrizione`) e `public/robots.txt`.
- 2026-09-26 — fase 7 (preparazione, senza pubblicare): `public/og.png` 1200×630 generata con `npm run genera-og` (stessa composizione dell’header; richiede outfit installato sul computer); meta open graph e twitter in `index.html` (dopo la pubblicazione `og:image` va reso un indirizzo completo); guida `come-aggiungere-un-progetto.md`. Restano da fare con alessandro: git, github, vercel, dominio.
- 2026-09-26 — foto definitiva: originale `src/assets/foto/foto-mia.jpg` (900×1600, figura intera); ritaglio a mezzobusto 4:5 `foto-mia-mezzobusto.jpg` (260×325 px dell’originale, ingrandito a 960×1200) → `foto-mia-mezzobusto-palette.webp`, una sola versione senza srcset. firma in bianco (scelta di alessandro), colore regolabile in `src/config/foto.ts`; x 50 · y 22,1 · scala 21.
- 2026-09-26 — pulizia prima della pubblicazione: eliminato il progetto `prova-blocchi`; i file originali del logo (`Logo.glb`, `Logo.svg`) spostati da `public/` a `sorgenti/`, così restano conservati ma non vengono pubblicati.
- 2026-09-27 — debugging, pulizia e documentazione fatti da un team di agenti prima della pubblicazione: corretti il battito di risveglio (preloader e VoltoContext), il 3d dell’header che se fallisce lascia il volto svg (`Senza3D`), i file `._*` del disco exfat (ignorati da oxlint, git e `prepara-progetti`); eliminati tooltip shadcn e foto provvisorie; `Grana.tsx` → `components/effetti/`, `Magnetico.tsx` → `components/interazioni/`; `pdfjs-dist` dichiarato in `package.json`; documentazione in `README.md` e `docs/`.
- 2026-09-27 — pubblicazione: repository github `alessandrobottone2005-crypto/ProvaLandingPagePortfolio_Claude` (ramo `main`), progetto vercel `provalandingpageportfolio-claude`; nel repository anche `CLAUDE.md`, `sorgenti/` e la foto originale; esclusi `.mcp.json`, `.claude/settings.local.json`, `.vercel`. prima versione online con i 10 segnaposto.
- 2026-09-27 — bottoni da figma (`button_atoms`, `icon button_atoms`, `iconset_atoms`): `components/bottoni/` (`BaseBottone`, `Bottone`, `BottoneIcona`) e `components/icone/Icona.tsx` con gli svg di figma in `src/assets/icone/` (colorati con mask). stati: riposo bianco con testo nero, mouse/focus nero che entra dal lato del cursore + bagliore (`shadow-bagliore`), premuto con bordo bianco, disattivato grigio. testo in minuscolo; pesi 500 (small, medium) e 600 (big), token `text-bottone-s/m/l`. usati solo nei contatti (big, solo testo, niente icone né ↗); icon button e icone pronti e visibili in `/laboratorio`. `simple-icons` rimosso.

- 2026-09-27 — aggiornamento card da figma (`info-card_atoms` 9:607, `card` 121:172): cornice grigia, raggio e bagliore proporzionali, copertina dinamica. su desktop/tablet l’anello prosegue con 160vh di scroll verso la griglia piatta (3 colonne desktop, 2 tablet), poi scroll normale. card interattive solo nella griglia: clic → informazioni sotto l’immagine, una aperta alla volta; espansione sposta le righe successive; “esplora” apre il pannello esistente, “chiudi”/esc richiudono la card. testi informativi tutti bianchi; rimosse le informazioni sotto l’anello. mobile: pila e interazioni precedenti conservate. movimento ridotto: griglia immediata a 3/2/1 colonne. link diretti ai progetti posizionano la home sulla griglia finale.

- 2026-09-27 — aggiornamento percorso logo concordato in chat: logo iniziale grande ma interamente visibile, nome presente fino alle card, categorie evidenti senza numeri e senza quattro trattini. dalla fase 3d un solo volto continuo, ricostruito dai tratti 2d in solidi animabili (originale GLB conservato): sguardo, battiti, sonno, risveglio, occhiolino e sorriso. spirale ispirata alla modalità “Spiral” di k95 anche su telefono, copertine sempre a colori; confermata griglia finale 3/2/1 con card Figma espandibili. il volto si rimpicciolisce di lato nella griglia, affianca il testo biografico invariato (foto e firma rimosse), poi, a testo bianco, si ingrandisce al centro dei contatti con i tre pulsanti sotto. posizione e scala ferme ai contatti; espressioni sempre attive. movimento ridotto: niente pin/spirale/Canvas, SVG statici e griglia immediata; preferenza aggiornata anche a sito aperto.

- 2026-09-27 — logo Blender: su richiesta di alessandro, versione separata in `sorgenti/logo-3d/`, derivata da `~/Desktop/Logo3DAnimabile.blend`; bordi morbidi, espressioni animate e metallo grezzo poco lucido, con mappe ambientCG e HDRI Poly Haven CC0. File originale conservato; esportazioni GLB completa e Web pronte per successiva integrazione.

- 2026-09-27 — integrato il modello Blender metallico nel volto continuo e nel laboratorio: GLB Meshopt locale con shape key, HDRI Studio Small 08, asset precaricati una sola volta. Percorso e interazioni esistenti conservati; movimento ridotto senza download 3D e fallback SVG in caso di errore.

- 2026-09-27 — su richiesta di alessandro: progetti segnaposto portati a 20; copyright con anno corrente sotto i tre contatti. Nome e cognome dell’header si raccolgono in piccolo in alto a destra alla fine del racconto e restano fissi come logo tipografico cliccabile per tornare all’inizio; trasformazione reversibile e cambio diretto senza movimento con preferenza ridotta. Questa scelta aggiorna il precedente vincolo “nessuna navbar, nessun footer”.

- 2026-09-28 — ambiente immersivo dalla V2 Blender, verificata tramite Computer: appare insieme al logo 3d, tre fari bianchi seguono il volto con inerzia, nebbia volumetrica in movimento e camera guidata dallo scroll. Card della spirale realmente dentro la scena WebGL, poi passaggio alla griglia interattiva. Biografia, contatti, copyright e navbar leggibili sopra l’ambiente; pannelli progetto opachi. Stessi effetti su desktop e mobile, senza semplificazioni visive per breakpoint; preferenza movimento ridotto conservata. GLB V2 separata, originale .blend conservato. Dettagli e limiti della riproduzione web in `docs/ambiente-3d.md`.

- 2026-09-28 — approvati e implementati i cinque interventi sulla spirale: card con corpo estruso, smussi, cornice forata e copertina incassata; profondità davanti e dietro al logo; camera diagonale con campo visivo 42° e orbita parziale; due luci radenti sulle cornici; campo lungo finale e distensione nella griglia. Finale portato a 200vh, stesso percorso su telefono. Copertine senza riflessi aggiunti, griglia 3/2/1 e interazioni conservate. Parametri in `movimento.portfolio.spirale3d`, dettagli in `docs/ambiente-3d.md`.

- 2026-09-29 — manutenzione autorizzata a un team: debugging runtime, rimozione del codice non usato e delle copie pubbliche V1/HDRI, rinomina dell’anello in spirale, conservazione dei sorgenti e aggiornamento della documentazione corrente. Autorizzati creazione/push del branch `codex/manutenzione-portfolio-3d` e deploy Vercel; nessun merge richiesto. Lo storico resta preservato, il brief operativo sostituisce le istruzioni iniziali ormai superate.

- 2026-09-29 — pubblicato in produzione il commit `6db4e456239ee683268b7a6d0aeb512719bcb108` dal branch `codex/manutenzione-portfolio-3d`, push riuscito e nessun merge in `main`. Deploy Vercel `READY`, alias esistente aggiornato; versione immutabile e stato della verifica online in [docs/pubblicazione.md](docs/pubblicazione.md).

- 2026-10-01 — su richiesta di alessandro la spirale e la griglia sono sostituite da un computer retrò (`Computer.glb`, PC beige con case e monitor) appoggiato sul pavimento del pozzo della greybox, nella stazione rinominata `computer`. Scelte confermate in chat: il modello resta quello fornito, è l’interfaccia a riprendere il Finder del Macintosh 1984, fedele al 100% (bianco e nero puri e ChicagoFLF solo dentro lo schermo; immagini dei progetti a colori); quattro cartelle per disciplina con un documento per progetto; il progetto si apre in una finestra del computer che segue `/progetti/:slug` (pannello e card rimossi); su desktop/tablet cornice visibile e nessun pin, su telefono interfaccia a tutta vista; accensione automatica con il volto pixelato al posto dell’Happy Mac; movimento ridotto con scena 3d ferma e computer acceso. Il modello è CC BY da Sketchfab ma il link è perso: crediti segnaposto in `sito.computer.crediti`, avviso in build, nessuna pubblicazione finché non sono completi. Lavoro sul branch `prova/computer-retro`, senza push né deploy.

- 2026-10-01 — su richiesta di alessandro la greybox fatta con ChatGPT è sostituita da `Ambiente.glb` (sala di cemento con fessura nel soffitto, Sketchfab), resa realistica. Scelte confermate in chat: tutto il racconto nella stessa sala (header in fondo, computer a terra nel fascio della fessura, biografia verso una parete in ombra, contatti dall’inizio della sala); ricottura in Blender (cemento PBR CC0 quasi grigio, sole dalla fessura, Cycles) più post-produzione nel sito; pavimento di cemento bagnato con riflessi veri; librerie `postprocessing` e `@react-three/postprocessing` autorizzate; peso ≈ 4–6 MB (misurato 4,6). Camera reale a campo 40° e 8,7 u, con il volto della stessa misura. Licenza della sala sconosciuta: credito segnaposto in `sito.computer.crediti`, avviso in build, nessuna pubblicazione finché non è chiara. Greybox tolta dal runtime, sorgenti conservati in `sorgenti/ambiente/`.

- 2026-10-01 — su richiesta di alessandro il chi sono ha un avatar olografico al posto del logo. Scelte confermate in chat: tecnica ibrida (rotazione 2.5D della foto frontale con mappa di profondità + salto glitch alle foto con la testa girata), monocromo in palette, mezzobusto scontornato, al posto del logo nella colonna sinistra; il logo si rompe in glitch nell’ologramma e si ricompone all’uscita verso i contatti; glitch molto disturbato; movimento autonomo su touch e a mouse fermo; cono di luce dal basso e bagliore. Scontorno (MODNet) e profondità (Depth Anything V2 small) generati una volta con l’AI fuori dal progetto, nessuna dipendenza aggiunta al sito. Foto originali spostate da `public/FotoMie/` a `sorgenti/foto/FotoMie/` per non pubblicarle. Questa scelta supera «niente foto» del chi sono.

- 2026-10-01 — la prima versione dell’avatar (foto 2.5D, glitch forte, cono) non è piaciuta ed è sostituita. Alessandro ha generato con Google Flow un ritratto e un video a nuvola di punti; scelte in chat: somiglianza approvata, nessuna clip in più, destra ottenuta specchiando la clip verso sinistra, su e giù con una piccola inclinazione, solo bagliore leggero, passaggio dal logo più elegante (schiacciamento e scansione, niente scosse). Atlante di 24 fotogrammi ≈ 1,1 MB.

- 2026-10-01 — su richiesta di alessandro il volto non si fa più da parte nel portfolio: sta dietro il computer, più grande del monitor visto dalla camera (`movimento.computer.volto.fattore` 1,25), occluso davvero dal depth buffer (la posa ha una profondità `z` oltre alla misura in pixel). Nella sosta nascondino animato da GSAP su `percorso.computer.sbircia` (lati scelti in base allo spazio: su desktop destra/sinistra, su tablet verticale sopra e sopra spostato; nessuno su telefono), reazioni del Finder tramite `VoltoContext`. Dettagli in [computer](docs/computer.md#il-volto-dietro-il-computer).

- 2026-10-01 — debugging, pulizia e pubblicazione autorizzati da alessandro in chat. Debugging: acceso/spento del computer controllato anche a ogni tick di GSAP (i refresh di ScrollTrigger non chiamano `onUpdate`); posizione nella sosta conservata a resize e rotazione; cambiando il movimento ridotto a sito aperto si resta nella stessa sezione (`src/lib/scroll.ts`); evento `cursore:ricalcola` (`src/components/cursore/ricalcola.ts`) inviato da `Interfaccia.tsx` quando lo schermo compare o diventa interattivo; un clic sull’interfaccia del computer non fa più l’occhiolino. Pulizia: tolti valori non usati in `movimento.ts` (`volto.sguardoMax`, `media.chiSonoPin`, `media.chiSonoBasso`), `RAPPORTO_SCHERMO`, `etichette.foto` in `sito.ts`, i token `--text-nome`, `--text-titolo`, `--text-chisono` e alcuni export non usati altrove; conservati per scelta `src/components/ui/button.tsx`, `src/assets/foto/` e `scripts/foto-palette.mjs`. Documentazione allineata al codice. Per scelta esplicita di alessandro `prova/computer-retro` è fuso in `main`, pushato e pubblicato in produzione con i crediti CC BY del computer e della sala ancora segnaposto (rischio accettato, da completare in `sito.computer.crediti`). Esito in [pubblicazione](docs/pubblicazione.md).

- 2026-10-02 — su richiesta di alessandro, quattro miglioramenti decisi in chat (branch locale `prova/nome-3d-schermo`, senza push né deploy). Nome e cognome in 3d nello stesso metallo del logo, in Outfit Black (file statico OFL scaricato da Google Fonts/Outfitio in `sorgenti/font/`), visibili dalla fine del preloader e anche da piccoli nel nome fisso; un Canvas leggero a parte (z-40, senza post-produzione) posa ogni lettera sulla sua sagoma DOM, così le animazioni GSAP restano le stesse; lettere che reagiscono al cursore al posto del peso variabile. La linea che invitava a scorrere è sostituita da «scorri per esplorare», che si scrive nel preloader insieme al volto, poi respira con una freccia che scende. Schermo del computer più realistico, livello «medio»: fosfori caldi al posto di bianco e nero puri (supera la regola del 1 ottobre), vetro con riflessi, polvere e ditate, grana, righe, banda di refresh e bordo scuro del tubo; il bagliore 3d del vetro alimenta il Bloom. Guida per consegnare i progetti aggiunta in `docs/come-aggiungere-un-progetto.md`.
- 2026-10-02 — primi progetti veri: dai tre fuochi, lorenzo e serena brancale, solo branding, anno 2026, cliente «progetto accademico · iuad», ordine alfabetico; descrizione = testo «1.1 chi è» dei brand book, identico e in minuscolo (per lorenzo titolo e paragrafo uniti da un punto). Brand book (21, 67 e 157 MB) compressi in pdf di pagine JPEG (lorenzo 6,1 MB, dai tre fuochi 9 MB a 2000 px; serena 11,6 MB a 1600 px), originali solo sul disco in `sorgenti/progetti/` (ignorata da git). Tolti tutti i 20 segnaposto: illustrazione, 3d e web design per ora vuote. Nelle cartelle i nomi lunghi dei documenti vanno a capo.
- 2026-10-02 — illustrazioni: cinque documenti in illustrazione, in ordine alfabetico — arabian sunset, donne selvagge, don’t look medusa, dove la guerra non arriva (singole: solo copertina, nessun blocco per non ripetere l’immagine) e inktober (copertina crown, blocco immagini con le cinque tavole mustache, weave, crown, murky, deer). anno 2025, cliente «progetto personale»; descrizioni brevi scritte da claude e approvate da alessandro nel piano.
- 2026-10-02 — progetto 3d «cuphead e mugman · art toys» (3d, 2026, progetto accademico iuad): copertina = pagina 1 della presentazione; finestra con presentazione pdf (10 MB, intera anche con le immagini ufficiali del gioco, scelta di alessandro), modello 3d e testo con i paragrafi del concept (l’ispirazione, il piedistallo, la palette); descrizione = «il gesto». Modello esportato dal .blend senza salvarlo (`scripts/blender/esporta-cuphead.py`): solo la collezione «Statue», decimate a ≈ 400 mila triangoli, colori del materiale al posto della miscela con la texture (non leggibile in gltf), ruvidità media, normal map conservata, statuette girate verso lo spettatore come nella camera del render; compresso da `prepara-progetti` a 4,2 MB (≈ 290 mila triangoli). «LinguaAction» è un’azione vuota: modello fermo. GLB prima della compressione fuori da git (`_originali/*.glb`).
- 2026-10-02 — su richiesta di alessandro web design è tolto per ora da header e computer, con un interruttore manuale (`webDesignAttivo` in `src/config/discipline.ts`, da riaccendere solo quando lo chiede lui). Header a tre fasi con lo stesso ritmo: la timeline salta i 17 punti della fase web, il finale (logo al centro, nome in alto a destra) parte a 75 e il pin si accorcia in proporzione (≈ 332/249vh). Codice della fase web conservato e verificato riaccendendo l’interruttore. «web design» resta una disciplina valida nei `progetto.json` (avviso in validazione se un progetto è solo web design con l’interruttore spento). Descrizione del sito (meta e open graph): «branding, illustrazione e 3d».
- 2026-10-02 — su richiesta di alessandro: landing più fluida e più «cinema» (estetica letta in chat come brutalismo cinematografico monocromo). Fluidità: nebbia a risoluzione ridotta con ricomposizione, qualità adattiva (stessi effetti, risoluzione interna variabile: regola 7 aggiornata con il suo consenso), preriscaldamento di shader e texture, mappa d’ombra statica, riflesso legato alla qualità, niente doppio anti-aliasing, letture di layout ridotte (avatar, nome in metallo), vetro del computer senza filtri durante la discesa, scrub e Lenis un po’ più morbidi. Misurato sul M5: spariti gli scatti da 83 ms (arrivo del 3d) e 183 ms (avatar, telefono emulato). Cinema: profondità di campo che segue il protagonista, polvere che brilla nel fascio, grana pellicola, alone, lieve aberrazione, striscia anamorfica sulle luci forti al posto di un flare (la camera non inquadra mai la fessura), raggi più netti, colore quasi monocromo caldo/freddo solo nella scena 3d, respiro steadicam della camera (fermo davanti allo schermo e con movimento ridotto). Lightmap 4096 non ridotta: confronto ancora da fare.
- 2026-10-02 — su richiesta di alessandro tutta la scena 3d diventa un bianco e nero noir profondo (saturazione 0, curva noir gamma 1,7 con neri chiusi sotto 0,03, vignetta più scura): restano fuori lo schermo del computer con le copertine a colori, il nome in metallo e tutta la UI (DOM o Canvas separato). Computer beige in b/n. Polvere finissima (≈ 9000 granelli da 1–2 px, niente bokeh) e nebbia a grana fine (rumore ad alta frequenza con soglia); grana pellicola un po’ più presente. Questo supera il colore caldo/freddo deciso poco prima.
- 2026-10-02 — su richiesta di alessandro: noir un po’ meno scuro (gamma 1,35, vignetta 0,68) e luce della fessura arancione caldo (`cinema.sole.colore` #ff7a24) come unico colore della scena oltre allo schermo dei progetti: macchia di sole su pareti e pavimento (luce cotta tinta dentro il fascio), sole sul computer, polvere; il velo del volume resta quasi neutro (la camera è spesso dentro il fascio), i riflessi della sala restano neutri. Il colore finale tiene solo l’arancione con croma sufficiente, tutto il resto in b/n. Rinomina in «alessandrobottone»: repository GitHub `alessandrobottone2005-crypto/alessandrobottone` e remote locale, progetto Vercel `alessandrobottone` con dominio `alessandrobottone.vercel.app` collegato alla produzione già pubblicata (nessun nuovo deploy; vecchio dominio attivo), `og:url`/`og:image` aggiornati per il prossimo deploy. Cartella locale da rinominare a sessione chiusa (`Projects/alessandrobottone`).
- 2026-10-02 — su richiesta di alessandro, `prova/nome-3d-schermo` è fuso in `main` (fast-forward `975aa0f..87d70a5`), pushato con il suo branch e pubblicato in produzione dall’integrazione Git di Vercel su `alessandrobottone.vercel.app` (deploy `READY`), con lint/build e verifiche online superati; crediti del computer e della sala ancora segnaposto. Esito in [pubblicazione](docs/pubblicazione.md).
- 2026-10-02 — correzioni dai test di alessandro su iPhone e Mac (locali, senza push né deploy): ombre del computer al posto giusto durante la discesa (la camera d’ombra ruota con la sala, `Sala.tsx`); messa a fuoco sul computer già dall’inizio della discesa con zona nitida più ampia (`cinema.fuoco.intervalloComputer`); il sole della fessura non illumina più il logo (`senzaSole` in `Volto3D.tsx` non aveva effetto: il logo appariva marrone/arancione), ora metallo grigio scuro ovunque; chi sono su telefono con avatar grande sopra il testo (scelta di alessandro); nessun segno della copia nascosta nel testo che rotola dei pulsanti. In sospeso: blocchi arancioni e bordi seghettati visti solo su iPhone, da diagnosticare sul telefono.
- 2026-10-02 — su richiesta di alessandro la favicon è il render 3d del logo nella sala (inquadratura dei contatti, scelta tra due candidate): `favicon.png`, `favicon-dorme.png` e `apple-touch-icon.png` in `public/volto/` da `npm run genera-favicon-3d`; le favicon svg piatte restano come riserva in `sorgenti/logo/favicon-svg/`.

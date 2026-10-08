> Aggiornamento dell’8 ottobre 2026: [accesso immediato ai lavori](accesso-rapido.md). La scelta iniziale e l’archivio non caricano la scena; l’esperienza parte su richiesta. Questa descrizione prevale sulle indicazioni storiche di avvio e navigazione riportate sotto.

# architettura

**Aggiornamento 7 ottobre 2026:** la presentazione dei progetti passa all’[archivio a tutta vista](archivio-progetti.md), separato dal Finder. Sono valide `/`, `/progetti` e `/progetti/:slug`; la home resta montata. Le descrizioni precedenti di finestre progetto dentro il monitor sono storiche.

Il sito separa racconto della home, scena immersiva e interfaccia del computer con le finestre dei progetti. Testi e parametri hanno una fonte condivisa; le pose 3d vengono aggiornate senza render React a ogni fotogramma.

## librerie e responsabilità

| tecnologia | ruolo |
|---|---|
| React 19, TypeScript strict, Vite 8 | componenti, tipi, sviluppo e build |
| Tailwind v4 | token e stile in `src/styles/globals.css` |
| GSAP, ScrollTrigger, SplitText, DrawSVG, MorphSVG | pin/scrub, avvicinamento al computer, testo biografico, SVG e preloader |
| Motion | hover/tap, magnetismo, testi, rivelazione delle immagini e cursore |
| Lenis | unica istanza di scroll fluido, sincronizzata con GSAP; touch nativo |
| Three.js e React Three Fiber | Canvas globale della home e visualizzatori dei progetti |
| drei | `OrbitControls` e `ContactShadows` nei modelli dei progetti |
| React Router | home sempre montata; `/progetti/:slug` apre la finestra del progetto nel computer |
| Radix/shadcn | `Slot` del button di base (`components/ui/button.tsx`, conservato ma oggi non importato dal sito) |
| Lucide e SVG Figma | icone dei controlli dei blocchi (Lucide) e icone social Figma (`components/icone/`, oggi visibili solo in `/laboratorio`) |
| react-pdf, pdfjs-dist, page-flip | PDF sfogliabili |
| Outfit Variable, ChicagoFLF | Outfit per il sito; ChicagoFLF solo dentro lo schermo del computer |
| postprocessing, @react-three/postprocessing | post-produzione della scena (scaricata con il 3d) |
| Zod, Sharp, glTF Transform | validazione/build e strumenti di authoring |
| chess.js | regole degli scacchi nel computer (chunk a parte e web worker) |
| Funzioni Vercel (Node) | `api/dediche.ts`: dediche su Google Drive, senza librerie |

Zod non è nel runtime di produzione; shadcn è uno strumento di sviluppo, i componenti generati sono sorgenti locali. Le versioni esatte sono nel lockfile.

## cartelle

```text
.
├─ README.md, CLAUDE.md       guida iniziale, brief corrente e storico
├─ docs/                     guide tecniche e pubblicazione; indice in README.md
├─ scripts/                  authoring, validazione, immagini e icone
│  ├─ verifiche/             navigazione, computer, fluidità e diagnostica luce
│  ├─ lib/                   controllo Chrome condiviso dalle verifiche
│  └─ blender/               esportazione dei modelli dei progetti
├─ verifiche/                guida ai controlli e risultati locali
│  └─ risultati/             screenshot e report, esclusi da Git e deploy
├─ sorgenti/                 originali creativi; esclusi dal sito
│  ├─ logo/                  Logo.svg e Logo.glb originali forniti
│  ├─ logo-3d/               scene Blender, texture, export, script e anteprime
│  │  └─ legacy/             vecchio volto.glb conservato
│  ├─ sala/                  Ambiente.glb, scena realistica, cottura ed esportazione
│  ├─ computer/              fonte, licenza e procedura della postazione Macintosh
│  │  ├─ originali/          ScrivaniaComputer.glb intatto, unico computer conservato
│  │  └─ export/             derivato intermedio rigenerabile, escluso da Git
│  ├─ progetti/              pdf originali dei progetti, solo sul disco (ignorati da git)
│  ├─ font/                  Outfit-Black.ttf statico (OFL) per il nome in metallo
│  ├─ audio/                 musica e suoni originali, solo sul disco; fonti e licenze nel README
│  ├─ ambiente/              greybox brutalista non più usata, conservata
│  └─ foto/                  foto originali (FotoMie/), materiali Google Flow (flow/), prima prova avatar (avatar/)
├─ public/                   asset serviti senza trasformazione
│  ├─ audio/                 musica in loop e suoni brevi, webm e m4a (da npm run prepara-audio)
│  ├─ avatar/                atlante dell’avatar a punti giro.webp e fermo.webp (da npm run prepara-avatar)
│  ├─ computer/              computer.glb (da npm run prepara-computer)
│  ├─ nome/                  contorni delle lettere del nome (da npm run genera-nome-3d)
│  ├─ sala/                  sala.glb e luce cotta (da npm run prepara-sala)
│  ├─ volto/                 logo-metallo-v2.glb, favicon e icona iOS dal render 3d (npm run genera-favicon-3d), crediti
│  ├─ og.png
│  └─ robots.txt
├─ index.html                meta, lingua, titolo e favicon
├─ api/                      funzioni Vercel: dediche.ts (archivio delle dediche su Google Drive)
├─ .env.example              nomi delle variabili delle dediche, senza valori
├─ vite.config.ts            controllo progetti, avviso sui crediti, preload font, alias @, /api/dediche finta in sviluppo
├─ vercel.json               fallback SPA delle rotte (tranne /api/)
├─ .vercelignore             esclusioni dal caricamento di deploy
└─ src/
   ├─ main.tsx, App.tsx, router.tsx
   ├─ config/                sito.ts e movimento.ts
   ├─ styles/                globals.css
   ├─ lib/                   scroll, GSAP, caricamento, dati/schema/progetti, appunti, useMediaQuery, audio/ (motore)
   ├─ components/
   │  ├─ volto/              SVG, context, sguardo, logo V2, avatar, sala, mondo, computer 3d e post-produzione
   │  ├─ computer/           interfaccia finder 1984, inquadratura, stato, finestre e blocchi lazy (blocchi/)
   │  │  └─ app/             applicazioni della scrivania: scacchi (avversario in web worker), paint, dediche
   │  ├─ nome/               nome e cognome in metallo (Canvas leggero a parte) e caricamento del font
   │  ├─ cursore/            cursore e segnale cursore:ricalcola
   │  ├─ preloader/, testo/, interazioni/, effetti/
   │  ├─ audio/              ingresso «inizia a scrollare», pulsante audio, audio del computer
   │  ├─ bottoni/, icone/     componenti Figma
   │  └─ ui/                 button shadcn di base, non usato
   ├─ sections/
   │  ├─ Header/             racconto iniziale, tavola e nome fisso
   │  ├─ Portfolio/          spazio di scroll del computer e versione ferma
   │  ├─ ChiSono/, Contatti/
   ├─ laboratorio/           solo sviluppo
   ├─ assets/                icone Figma, font ChicagoFLF e foto/ (fotografie conservate, non importate dalla home)
   ├─ types/                 tipi page-flip
   └─ content/progetti/      una cartella per progetto
```

`public/` viene copiata nella build: non usarla come archivio. Foto e scene originali non importate dal codice restano sul disco/repository, non nel sito. Cache di render e backup automatici Blender non vengono caricati per il deploy.

## avvio

1. `main.tsx`: `BrowserRouter` → `VoltoProvider` → `AvvioProvider` → `App` e stile globale.
2. `App.tsx`: avvia scroll, monta le quattro sezioni, `LogoContinuo`, preloader, cursore e grana; `main` resta `aria-busy` fino a sito pronto.
3. `caricamento.ts`: misura font, codice 3d, GLB V2 condivisa, nome in metallo (codice e contorni) e prima copertina. Un errore non impedisce la fine del preloader. Il ramo movimento ridotto evita codice e asset 3d.
4. `Preloader.tsx`: contatore e disegno, risveglio, passaggio all’header. Durate in `movimento.preloader`. Lo scroll riparte con il pulsante «inizia a scrollare» (`components/audio/Ingresso.tsx`), che avvia anche l’audio; con un link diretto subito. [Audio](audio.md).
5. A sito pronto: refresh delle misure e rotte; con link diretto a un progetto la home va a metà della sosta davanti al computer acceso, con la finestra del progetto aperta, su tutti i dispositivi. Il modello del computer e l’interfaccia si scaricano dopo il preloader.

## scena continua

`LogoContinuo.tsx` è un host fisso, senza rimontaggi tra sezioni. Unica eccezione: il nome in metallo ha un suo Canvas leggero (`components/nome/`), visibile da subito e sopra le sezioni, senza post-produzione. Il Canvas diventa visibile insieme al logo metallico nell’header. `Volto3D.tsx` compone volto, mondo (sala e computer), camera, fari e post-produzione.

| modulo | responsabilità |
|---|---|
| `modelloLogo.ts` | unica promessa GLB V2, Meshopt e cache condivisa |
| `percorso.ts` | pose del logo e ancoraggi DOM tra le sezioni; volto dietro il monitor (profondità `z`, rollio) e lati del nascondino (`latiDisponibili`) |
| `scenaImmersiva.ts` | posizione/scala del logo e posizioni dei fari |
| `CameraImmersiva.tsx` | camera reale ferma, inclinazione d’ingresso nell’header |
| `Mondo.tsx` | sala e computer mossi come se si spostasse una camera virtuale (`components/computer/inquadratura.ts`) |
| `ComputerNellaScena.tsx`, `modelloComputer.ts` | postazione Macintosh, bagliore sul piano del vetro condiviso, aggancio dell’interfaccia |
| `LuciTeatro.tsx` | tre fari V2 con inerzia |
| `Sala.tsx`, `modelloSala.ts`, `luceSala.ts` | sala con luce cotta, pavimento bagnato riflettente, sole in tempo reale |
| `Rifinitura.tsx` | post-produzione e render finale: occlusione, volume, bagliore, vignetta, AgX |
| `NebbiaVolumetrica.tsx` | effetto del volume: alone del volto e polvere nel fascio della fessura |
| `Ologramma.tsx`, `ologramma.glsl.ts` | avatar a punti del chi sono, nello stesso Canvas |
| `VoltoContext.tsx`, `sguardo.ts` | umore, sonno, azioni (battito, occhiolino, sorriso) e sguardo condivisi da SVG e 3d |
| `ScenaRidotta.tsx` | Canvas a parte per il movimento ridotto: sala e computer acceso, inquadratura ferma, senza volto |

Le timeline scrivono valori condivisi; R3F li legge nel ciclo di rendering. Gli SVG rimangono disponibili come riserva. [Ambiente 3d](ambiente-3d.md).

## scroll e layout

`lib/gsap.ts` registra i plugin. `lib/scroll.ts` crea Lenis, lo collega a ScrollTrigger e al ticker GSAP, gestisce blocco/ripresa (preloader) e scroll programmati. Movimento ridotto: scroll nativo; se la preferenza cambia a sito aperto, `scroll.ts` riporta la pagina nella stessa sezione dopo che le sezioni si sono rimontate (nel portfolio a metà della sosta).

- Header: circa 332vh desktop/tablet e 249vh telefono, con le tre discipline attive (400/300vh se si riattiva web design).
- Portfolio: si sovrappone all’ultimo schermo dell’header; 100vh di avvicinamento e 120vh di sosta senza pin (ScrollTrigger `portfolio-computer`, letto da `percorso.ts`, da `scroll.ts` e dal link diretto). L’interfaccia del computer è DOM `fixed` posato sul vetro con una `matrix3d`, interattiva solo nella sosta. Acceso/spento si controlla anche a ogni tick di GSAP (i refresh di ScrollTrigger non chiamano `onUpdate`); a resize e rotazione chi sta nella sosta resta nello stesso punto. Il nascondino del volto è `useNascondino` in `Portfolio.tsx`.
- Biografia: pin solo quando il testo entra nello schermo; altrimenti flusso normale. Testo sopra il volume.
- Contatti: logo fermo in posa/dimensione, espressioni vive; pulsanti e copyright sopra l’ambiente.

GSAP e Motion non animano le stesse proprietà dello stesso elemento. GSAP scrive l’avvicinamento al computer; accensione e spegnimento del tubo sono transizioni CSS su un elemento interno.

## computer e laboratorio

`router.tsx` accetta `/` e `/progetti/:slug`; la finestra del progetto in `Finder.tsx` segue l’indirizzo. La home resta montata. Ogni blocco si scarica soltanto se usato. [Computer](computer.md).

Le applicazioni della scrivania (scacchi, paint, dediche) sono chunk separati; le dediche passano dalla funzione `api/dediche.ts`, che in sviluppo è sostituita da un archivio in memoria. `tsconfig.node.json` controlla anche `api/`; la build Vite non la include nel sito. [Dediche su Google Drive](dediche-google-drive.md).

`/laboratorio` è dietro `import.meta.env.DEV`: serve a provare stati, sguardo, azioni, volto 3d e cursore; non è pubblicato.

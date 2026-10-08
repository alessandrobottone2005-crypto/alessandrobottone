> Aggiornamento dell’8 ottobre 2026: [accesso immediato ai lavori](docs/accesso-rapido.md). La scelta iniziale e l’archivio non caricano la scena; l’esperienza parte su richiesta. Questa descrizione prevale sulle indicazioni storiche di avvio e navigazione riportate sotto.

# portfolio di alessandro bottone

Portfolio one-page in italiano, raccontato dallo scroll. Il volto parte come segno e diventa un logo metallico 3d animato nell’ambiente della scena Blender V2.

**preloader → header → portfolio → chi sono → contatti**

- Header con tre discipline attive; il nome grande si raccoglie in alto a destra e resta cliccabile per tornare all’inizio.
- Portfolio dentro una postazione Macintosh 128K con scrivania e accessori in una sala di cemento realistica (luce cotta in Blender, pavimento bagnato che riflette, polvere nel fascio di sole): la camera scende fino allo schermo, il computer si accende e si usa. L’interfaccia riprende il Finder del Macintosh 1984 (bianco e nero, ChicagoFLF): una cartella «progetti» apre l’archivio a tutta vista, con filtri per disciplina, copertine grandi e PDF verticali con zoom; le app restano nel monitor. Il volto metallico sta dietro il monitor, gioca a nascondino e reagisce a cartelle e progetti.
- Biografia invariata, rivelata parola per parola; a sinistra il logo si trasforma in un avatar a punti che segue il cursore; contatti con logo grande, Instagram, Behance, email e copyright.

La stessa esperienza 3d è presente su mobile. Su telefono l’interfaccia occupa tutta la vista. Con movimento ridotto: SVG statici, scroll nativo e computer già acceso in una scena ferma. In caso di errore WebGL restano il volto SVG e l’interfaccia del computer. Progetti pubblicati: dai tre fuochi, lorenzo e serena brancale (branding); arabian sunset, donne selvagge, don’t look medusa, dove la guerra non arriva e inktober (illustrazione); cuphead e mugman · art toys (3d).

## avvio

Serve Node.js compatibile con Vite 8; la pubblicazione usa Node 24. Dal terminale nella cartella del progetto:

```sh
npm ci
npm run dev
```

Apri [localhost:5173](http://localhost:5173). Per fermare il server: `ctrl + c`. `npm ci` installa le versioni del lockfile; dopo modifiche intenzionali alle dipendenze usare `npm install` e aggiornare anche `package-lock.json`.

In sviluppo [laboratorio](http://localhost:5173/laboratorio) permette di provare volto e cursore; non è incluso nella build pubblicata.

## comandi

| comando | risultato |
|---|---|
| `npm run dev` | server locale, aggiornamento automatico e controllo dei progetti |
| `npm run build` | controllo TypeScript, validazione dei progetti e sito pronto in `dist/` |
| `npm run preview` | anteprima locale della build, normalmente su porta 4173 |
| `npm run lint` | controllo del codice con Oxlint |
| `npm run nuovo-progetto` | crea una cartella e un JSON iniziale non pubblicato |
| `npm run prepara-progetti` | ottimizza immagini/copertine/GLB e controlla i file dei progetti |
| `npm run prepara-computer` | prepara la postazione Macintosh, il GLB web e le misure del vetro dall’originale in `sorgenti/computer/originali/` |
| `npm run prepara-sala` | rigenera `public/sala/` dall’esportazione Blender in `sorgenti/sala/export/` |
| `npm run genera-favicon` | rigenera favicon sveglia, addormentata e icona iOS |
| `npm run genera-og` | rigenera l’immagine social; richiede Outfit TTF installato sul computer |
| `npm run prepara-avatar` | dal video a punti in `sorgenti/foto/flow/` crea l’atlante dell’avatar in `public/avatar/` (serve ffmpeg) |
| `npm run foto-palette -- <file>` | helper opzionale per convertire una foto nella palette |

## dove modificare

| contenuto | file |
|---|---|
| testi, biografia, contatti, email, copyright, menu del computer, crediti ed etichette | `src/config/sito.ts` |
| tempi, scroll, avvicinamento e sosta del computer | `src/config/movimento.ts` |
| ancoraggi e percorso continuo del logo, volto dietro il monitor e lati del nascondino | `src/components/volto/percorso.ts` |
| nascondino del volto nella sosta | `useNascondino` in `src/sections/Portfolio/Portfolio.tsx` (tempi in `movimento.computer.sbircia`) |
| modello, espressioni e composizione della scena | `src/components/volto/Volto3D.tsx` |
| percorso della camera e posizione del computer | `src/components/computer/inquadratura.ts` |
| interfaccia del computer | `src/components/computer/` |
| sala, fari, effetti e computer 3d | `src/components/volto/Sala.tsx`, `LuciTeatro.tsx`, `Rifinitura.tsx`, `NebbiaVolumetrica.tsx`, `ComputerNellaScena.tsx` |
| progetti | `src/content/progetti/<slug>/`; [guida pratica](docs/come-aggiungere-un-progetto.md) |
| meta e indirizzi social del sito | `index.html` |

Scrivere i testi in minuscolo con apostrofi tipografici (’). Gli originali creativi si conservano in `sorgenti/`; soltanto le versioni runtime necessarie stanno in `public/`. Gli strumenti browser sono in `scripts/verifiche/`, screenshot e report in `verifiche/risultati/` (fuori da Git). Indici: [cartelle e responsabilità](docs/architettura.md), [sorgenti](sorgenti/README.md), [strumenti](scripts/README.md), [controlli](verifiche/README.md).

## pubblicazione

Repository: [alessandrobottone](https://github.com/alessandrobottone2005-crypto/alessandrobottone) (prima `ProvaLandingPagePortfolio_Claude`, GitHub reindirizza il vecchio indirizzo). Progetto Vercel: `alessandrobottone`, ambiente Node 24/Vite. Dominio: [alessandrobottone.vercel.app](https://alessandrobottone.vercel.app); il vecchio `provalandingpageportfolio-claude.vercel.app` resta attivo.

`main` è il ramo di produzione; incorpora il lavoro sul computer, audio e app della scrivania tramite i merge documentati in `docs/pubblicazione.md`; `codex/manutenzione-portfolio-3d` è il branch storico del 29 settembre. Lo stato del deploy, la versione e i controlli online si trovano in [pubblicazione](docs/pubblicazione.md). Dal 6 ottobre 2026 i crediti della sala e della nuova postazione Macintosh sono completi in `src/config/sito.ts`; il PC precedente e il Macintosh Classic alternativo sono stati eliminati su richiesta. La postazione con scrivania è l’unico computer conservato; lo stato della pubblicazione è in `docs/pubblicazione.md`. Il push di un branch e il deploy in produzione sono operazioni distinte. La configurazione mantiene il refresh delle rotte `/progetti/<slug>`.

## documentazione

| guida | contenuto |
|---|---|
| [come aggiungere un progetto](docs/come-aggiungere-un-progetto.md) | authoring, file e controlli |
| [architettura](docs/architettura.md) | responsabilità, cartelle, avvio, scroll e rotte |
| [volto](docs/volto.md) | SVG, modello V2, espressioni e cache |
| [ambiente 3d](docs/ambiente-3d.md) | sala di cemento, luce cotta, riflessi, post-produzione ed esportazione |
| [animazioni](docs/animazioni.md) | comportamento e parametri delle sezioni |
| [progetti](docs/progetti.md) | schema JSON, caricamento e script |
| [archivio progetti](docs/archivio-progetti.md) | archivio a tutta vista, filtri, immagini e PDF con zoom |
| [computer](docs/computer.md) | discesa, interfaccia finder 1984, finestre, cinque tipi di blocco e crediti |
| [accessibilità e prestazioni](docs/accessibilita-prestazioni.md) | tastiera, movimento ridotto, fallback e limiti delle misure |
| [pubblicazione](docs/pubblicazione.md) | GitHub, Vercel, asset pubblici e verifiche |
| [sorgenti Blender](sorgenti/logo-3d/README.md) | scene, controlli, rigenerazione e licenze |
| [sorgenti del computer](sorgenti/computer/README.md) | postazione Macintosh, originali, rigenerazione e licenze |
| [sorgenti della sala](sorgenti/sala/README.md) | scena Blender, cottura, rigenerazione e licenza |
| [scena Blender completa della landing](sorgenti/landing/README.md) | stanza, Macintosh, interfacce incorporate, logo animato e camere per render autonomi |
| [CLAUDE.md](CLAUDE.md) | brief operativo e storico delle decisioni |


### navbar e verifica mobile (5 ottobre 2026)

Tre collegamenti persistenti dopo l’ingresso, salto al computer già acceso, ottimizzazioni del nome e della qualità adattiva, preparazione progressiva di shader/texture. [Comportamento, verifiche e misure](docs/navbar-mobile.md).

- `npm run verifica-navigazione -- http://127.0.0.1:4173/`: flussi su build di produzione locale, tastiera, rotazione, rete lenta e WebGL assente.
- `npm run misura-fluidita -- http://127.0.0.1:4173/ telefono`: attiva l’ingresso, verifica lo scroll, misura separatamente ingresso e percorso; `MISURA_OUTPUT=/percorso/risultato.json` salva i campioni.
- `npm run diagnostica-luce -- http://127.0.0.1:4173/`: fotografie comparative con esclusioni solo diagnostiche.

Gli strumenti usano Node e Google Chrome già installato su macOS; non installano dipendenze.

### postazione Macintosh (6 ottobre 2026)

Scrivania completa da `ScrivaniaComputer.glb` di kreems, CC BY 4.0, con marchi rimossi e CRT collegato al Finder. GLB web 1,06 MiB (1,11 MB decimali); originali e guida in [sorgenti del computer](sorgenti/computer/README.md). `npm run verifica-computer` controlla asset, accensione, viewport e fallback e salva anteprime locali.

Per misurare anche il ritorno davanti al Finder già acceso: `npm run misura-fluidita -- http://127.0.0.1:4173/ --computer-acceso` (aggiungere `telefono` prima del flag per il viewport mobile con CPU 4×).

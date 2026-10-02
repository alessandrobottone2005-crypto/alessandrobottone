# il volto

il logo è un pittogramma del volto di alessandro: due lenti, una linea orizzontale che fa da ponte, un naso a “l”, palpebre ad arco con pupille, un sorriso. Le prime fasi usano il segno bianco su nero; dalla fase 3d il modello metallico grezzo della V2 prende il suo posto e rimane protagonista.

## la geometria (`src/components/volto/geometria.ts`)

il file originale (`sorgenti/logo/Logo.svg`) ha le forme espanse (riempimenti), che non si possono disegnare né animare. per questo il volto è stato ricostruito **a tratti**: ogni parte è una linea con il suo spessore, nelle stesse coordinate dell’originale (247.41 × 176.88, con un po’ di spazio sotto per il sorriso: viewbox 247.41 × 180).

| parte | come è fatta |
|---|---|
| lenti | due ellissi (`LENTE`); la destra è lo specchio della sinistra rispetto all’asse centrale (`ASSE`) |
| ponte | linea orizzontale tra le lenti (`PONTE`) |
| naso | linea verticale che gira a destra in basso, a “l” (`NASO`) |
| pupille | un anello ellittico (`PUPILLA`), ritagliato dentro la lente e sotto la palpebra |
| palpebre | un arco tra due punti fissi della lente; la funzione `palpebra(apertura)` lo calcola |
| sorriso | un arco (`SORRISO`) e una versione più ampia (`SORRISO_AMPIO`) per il morph |

spessori: occhi 13.6, naso e ponte 15.3, sorriso 12.1 (`SPESSORE`).

**apertura delle palpebre** (`APERTURA`): da 0 (chiusa, arco verso il basso) a 1 (spalancata). valori usati: `dorme` 0, `sorride` 0.42, `naturale` 0.5 (come il logo), `sveglio` 1. lo stato sveglio è volutamente contenuto: aprendo di più la palpebra toccherebbe la lente.

`sottoPalpebra(apertura)` è la zona sotto la palpebra: la pupilla si vede solo lì, quindi più la palpebra sale, più pupilla si vede.

`svgStatico()` restituisce il volto come file svg completo (per favicon e immagine og).

## il componente `<Volto />` (`src/components/volto/Volto.tsx`)

un solo componente svg, inserito nella pagina (non come immagine), usato nel preloader, nelle prime fasi dell’header, nel laboratorio e come riserva per movimento ridotto o WebGL assente.

### props

| prop | cosa fa |
|---|---|
| `stato` | `dorme`, `naturale`, `sveglio`, `occhiolino`, `sorride`. se manca, segue l’umore globale (dorme / naturale) |
| `guarda` | un punto dello schermo `{ x, y }` o un elemento da guardare; se manca segue il cursore (o l’ultimo tocco) |
| `disegno` | quanto è disegnato, da 0 a 1 |
| `dimensione` | larghezza (es. `"26vmin"` o un numero in pixel) |
| `etichetta` | se c’è, il volto è un’immagine con `role="img"` e quella descrizione; se manca è decorativo (`aria-hidden`) |
| `interattivo` | clic o tap → occhiolino (predefinito: sì) |
| `filtro` | id di un filtro svg (l’header lo usa per il tratto “a matita”) |

con un `ref` si ottengono dei comandi diretti: `disegna(p)`, `battito()`, `occhiolino()`, `sorridi()` e l’elemento `svg`. il preloader disegna il volto così, senza passare da react a ogni fotogramma.

### come si anima

tutto dentro l’svg è animato da gsap:

- **stati**: al cambio di stato le palpebre vanno all’apertura giusta (1,2s per addormentarsi, 0,35s per il resto); con `occhiolino` si chiude solo l’occhio destro; con `sorride` il sorriso passa a `SORRISO_AMPIO` con morphsvg.
- **battito**: le palpebre si chiudono e si riaprono in pochi centesimi di secondo. parte da solo a intervalli casuali tra 3 e 7 secondi (`movimento.volto.battitoMin/Max`). non succede se il volto dorme o sta facendo l’occhiolino.
- **occhiolino**: occhio destro chiuso per un istante; non succede se dorme.
- **sorriso** (`sorridi()`): sorriso ampio per circa un secondo, poi torna normale.
- **disegno**: i tratti si disegnano con drawsvg in quest’ordine: lenti, ponte, naso, palpebre, pupille, sorriso. a disegno completo le linee tornano normali, così le palpebre possono cambiare forma.
- **clic o tap** sul volto (se `interattivo`): occhiolino.

## umore globale (`src/components/volto/VoltoContext.tsx`)

`VoltoProvider` (in `main.tsx`) vale per tutti i volti del sito:

- **sonno**: dopo 8 secondi senza input (`movimento.volto.sonnoDopo`; input = movimento del mouse, tocco, tasti, rotella, scroll) l’umore diventa `dorme`.
- **risveglio**: al primo input torna `naturale` e, dopo 0,4s, tutti i volti sbattono le palpebre.
- **scheda non attiva**: il titolo diventa `zzz… torna qui` (`sito.titoloAssente`), la favicon passa a `/volto/favicon-dorme.png` e i volti dormono. tornando sulla scheda: titolo e favicon di prima, risveglio con battito.
- **azioni per tutti**: `azione('battito' | 'occhiolino' | 'sorriso')` fa compiere l’azione a tutti i volti montati.

un volto con `stato` esplicito ignora l’umore globale (per esempio il preloader, o i contatti prima di essere disegnati).

## lo sguardo (`src/components/volto/sguardo.ts`)

un solo ascoltatore globale, condiviso da tutti i volti, tiene: l’ultimo punto del mouse o dell’ultimo tocco, se la pagina sta scorrendo, se l’ultimo input è stato un tocco.

in `Volto.tsx` le pupille si spostano verso il bersaglio con inerzia (0,6s), al massimo del 20% del raggio della lente (`SGUARDO_MAX` in `geometria.ts`). regole:

- se dorme: pupille al centro
- su touch, mentre si scorre (e senza un `guarda`): guardano in basso
- se c’è `guarda`: guardano quel punto o quell’elemento
- altrimenti: il cursore o l’ultimo tocco
- con movimento ridotto le pupille restano ferme; il cambio della preferenza è seguito in tempo reale

dove si usa `guarda`: nell’header il volto ogni tanto guarda in basso (invito a scorrere); nei contatti guarda il pulsante sotto il mouse o con il focus.

## il volto 3d continuo

- `LogoContinuo.tsx` monta un unico Canvas fisso per tutta la home. `Volto3D.tsx` usa il modello Blender `public/volto/logo-metallo-v2.glb` (circa 872 kB), con nove mesh separate, shape key e materiale PBR metallico grezzo.
- sorgenti, script Python e animazioni originali sono conservati in `sorgenti/logo-3d/`. Il vecchio `volto.glb` è conservato in `sorgenti/logo-3d/legacy/`, fuori dagli asset pubblicati.
- `modelloLogo.ts` condivide una sola promessa di caricamento fra preloader, home e laboratorio: GLB Meshopt V2 con texture WebP incorporate. Il preloader misura i byte ricevuti. In caso di errore il sito parte con il volto SVG di riserva. Con movimento ridotto non scarica modello o scena 3D. La home V2 non usa HDRI.
- ogni istanza clona la gerarchia e i pesi morph, condividendo geometrie, materiali e texture. Le risorse in cache non vengono eliminate allo smontaggio del Canvas.
- le timeline GSAP scrivono in `percorso.ts`; posizione e scala seguono gli ancoraggi DOM: header → centro → dietro il computer durante la discesa e la sosta (con una profondità `z` propria, coperto davvero dal monitor; vedi [computer](computer.md#il-volto-dietro-il-computer)) → sinistra della biografia → centro dei contatti. La posa neutra del modello viene centrata e misurata senza includere le deformazioni dei morph.
- il sito pilota direttamente le shape key Blender: `chiusura` di palpebre e pupille, `sorriso_ampio` della bocca. Gli oggetti `sguardo_sx/dx` seguono puntatore, tocco e pulsanti dei contatti. Sonno e risveglio seguono `VoltoContext`; battiti casuali, occhiolino al clic o tocco sul logo (`LogoContinuo.tsx`, ma non su pulsanti, link, finestre e schermo del computer), occhiolino e sorriso alla copia email, leggero respiro durante il sonno. Dal Finder: battito aprendo una cartella, sorriso aprendo un progetto (anche con link diretto), occhiolino chiudendolo; se in quel momento è nascosto dietro il monitor sbuca e ripete l’espressione. Lo sguardo segue il cursore anche sopra l’interfaccia del computer. Le clip dimostrative rimangono nel file sorgente; il runtime combina le forme con gli eventi reali.
- materiale e mappe vengono mantenuti dal GLB; tre luci d’area dalla V2 (`LuciTeatro.tsx`), volume in movimento e percorso guidato dallo scroll. La camera reale è ferma, campo 40° a 8,7 u (si muove il mondo, vedi [computer](computer.md)); il laboratorio usa ancora la vista frontale a 18°. DPR massimo 1,5 su desktop e mobile. Vedi [ambiente 3d](ambiente-3d.md).
- Canvas su `demand`: disegna soltanto con logo visibile e scheda attiva. `ScenaProtetta` mantiene il fallback SVG; con movimento ridotto gli SVG restano statici nelle sezioni.
- texture derivate da ambientCG Metal032 CC0; la precedente HDRI Poly Haven Studio Small 08 resta in `sorgenti/logo-3d/textures/` e non viene caricata dalla home; crediti in `public/volto/crediti.txt`.

## avatar olografico del chi sono

- stile «nuvola di punti» bianchi su nero, generato con Google Flow: foto `sorgenti/foto/flow/Ologramma_Foto.jpeg` e video `sorgenti/foto/flow/Ologramma_Video.mp4` (9:16, 4 s, 24 fps; la testa gira verso la sinistra dello schermo e torna al centro). Prompt e criteri in `sorgenti/foto/flow/avatar-punti/brief.md`.
- `npm run prepara-avatar` (`scripts/prepara-avatar.mjs`, serve ffmpeg) trova il picco della rotazione, prende 24 fotogrammi tra il primo e il picco, li ritaglia 4:5, li porta in scala di grigi e li impacchetta in `public/avatar/giro.webp`: celle 540×675 in griglia 4×2, tre fotogrammi per cella, uno per canale R/G/B. `public/avatar/fermo.webp` è il primo fotogramma. Peso attuale ≈ 1,1 MB.
- `Ologramma.tsx` vive nello stesso Canvas del logo, su un piano piatto sopra la colonna `[data-logo-biografia]`. Il cursore sceglie il fotogramma più vicino (niente dissolvenze, quindi niente punti doppi); verso destra lo shader specchia gli stessi fotogrammi. Su e giù inclinano appena il piano (`movimento.avatar.inclinazioneMax`). Con tocco o mouse fermo da `autonomoDopo` secondi si guarda intorno da solo; quando il volto dorme guarda in basso.
- shader `ologramma.glsl.ts`: luminanza → bianco palette, punti chiari appena sopra la soglia del bagliore di `Rifinitura.tsx`; luce sommata alla scena senza toccare l’alfa del buffer; colori limitati per non spargere NaN nel bagliore. Nessun glitch continuo: nel passaggio dal logo una scansione dall’alto con una fascia spostata; ogni tanto un glitch casuale più forte (righe, blocchi, punti persi, salto di fotogramma, copie sfasate; [glitch](animazioni.md#glitch)).
- per cambiare avatar: nuovo video con lo stesso tipo di movimento al posto di `Ologramma_Video.mp4`, `npm run prepara-avatar`, aggiornare `movimento.avatar.fotogrammi` con il numero stampato.
- movimento ridotto o 3d non disponibile (`data-volto-riserva` su `<html>`): in colonna `fermo.webp`, mascherata in luminanza sul bianco della palette con righe statiche.

## favicon

Le favicon sono il render 3d vero del sito: il logo metallico davanti alla sala, inquadratura dei contatti (scelta di alessandro del 2 ottobre 2026). `npm run genera-favicon-3d -- [url] [cartella]` (`scripts/genera-favicon-3d.mjs`) apre il sito acceso (`npm run build && npm run preview`, di base `http://localhost:4173/`) in Chrome senza finestra con la gpu del Mac, scorre fino ai contatti, nasconde pulsanti, copyright, nome fisso, grana e cursore, scatta e ritaglia un quadrato attorno al logo con un po’ più di luce (il metallo scuro deve leggersi anche a 16 px). Crea in `public/volto/`:

- `favicon.png` (96 px): volto sveglio, con il puntatore al centro per lo sguardo dritto
- `favicon-dorme.png` (96 px): volto addormentato dopo il sonno per inattività (usata quando la scheda non è attiva)
- `apple-touch-icon.png`: 180 px, per safari e ios

Con il secondo argomento le scrive in un’altra cartella, per provarle prima di sostituirle. Se cambiano logo, luci o sala, rilancia il comando.

La versione vettoriale di prima (`npm run genera-favicon`, da `svgStatico()` di `geometria.ts`) resta come riserva in `sorgenti/logo/favicon-svg/` e non si pubblica; se cambi la geometria del volto rilancia anche `npm run genera-og`.

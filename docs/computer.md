# computer

Il portfolio è un computer beige appoggiato sul pavimento della sala di cemento, nel fascio di luce della fessura. Dopo l’header la camera abbassa lo sguardo, scende fino allo schermo e il computer si accende. Sullo schermo c’è un’interfaccia che riprende il Finder del Macintosh 1984: scrivania con una cartella per disciplina (illustrazione, branding, 3d; web design torna con `webDesignAttivo` in `src/config/discipline.ts`) e, dentro, un documento per progetto. Sulla scrivania ci sono anche tre applicazioni: «scacchi», «paint» e «dediche» ([applicazioni](#applicazioni)).

Regole concordate il 1 ottobre 2026: dentro lo schermo bianco e nero e carattere ChicagoFLF (eccezione alle regole 1 e 2 di `CLAUDE.md`, valida solo lì); copertine e immagini dei progetti sempre a colori; testi in minuscolo come nel resto del sito. Dal 2 ottobre 2026 bianco e nero non sono più puri: sono i fosfori di un tubo vero (`--mac-bianco` #e7e1d1, `--mac-nero` #161614).

## il vetro

L’interfaccia resta DOM (cliccabile e accessibile), quindi non passa per la post-produzione della scena. Per non sembrare un livello incollato, `computer.css` le mette sopra un vetro (`.mac-crt`, `.mac-banda`, nessun livello riceve clic):

- fosfori: colori caldi e un po’ spenti, leggera sfocatura (0,3px) e aberrazione rossa/blu di mezzo pixel sul testo;
- tubo: angoli più arrotondati, bordi scuri con ombra interna (profondità dentro la cornice), vignetta, righe orizzontali;
- riflessi: macchia di luce convessa in alto a sinistra, striscia della luce della sala, bordo alto che prende luce;
- sporco: polvere, aloni e due ditate generati come SVG `feTurbulence` in data URI (nessun file), in `screen`;
- movimento: grana a scatti, banda di refresh lenta e sfarfallio; fermi con movimento ridotto. Su telefono grana e ombre sono più leggere.

Nella scena 3d il piano di luce davanti al vetro ha il colore dei fosfori ed è appena sopra la soglia del Bloom, così cornice, tastiera e pavimento ricevono l’alone dello schermo acceso.

## file

| file | ruolo |
|---|---|
| `src/sections/Portfolio/Portfolio.tsx` | spazio di scroll (avvicinamento + sosta), ScrollTrigger `portfolio-computer`, accensione e spegnimento; versione ferma con movimento ridotto |
| `src/components/computer/inquadratura.ts` | posizione del computer, rettangolo del vetro, percorso della camera virtuale, proiezione degli angoli e `matrix3d` |
| `src/components/computer/stato.ts` | fase `spento → avvio → acceso` e aggancio tra scena 3d e interfaccia |
| `src/components/computer/Interfaccia.tsx` | DOM posato sul vetro, avvio con il volto pixel, effetto tubo catodico |
| `src/components/computer/Finder.tsx` | barra dei menu, scrivania, cartelle, documenti, finestra del progetto legata all’indirizzo |
| `Finestra.tsx`, `BarraMenu.tsx`, `icone.tsx`, `voltoPixel.ts`, `computer.css` | finestre, menu, icone 1-bit e stile |
| `src/components/computer/app/` | applicazioni della scrivania (scacchi, paint, dediche), caricate solo all’apertura |
| `api/dediche.ts` | funzione Vercel delle dediche (archivio su Google Drive) |
| `src/components/volto/ComputerNellaScena.tsx`, `modelloComputer.ts`, `Mondo.tsx`, `ScenaRidotta.tsx` | modello 3d, bagliore del vetro, movimento del mondo, scena ferma |

## come si muove

La camera reale non si sposta mai (z ≈ 8,7, campo 40°): il volto è misurato in pixel e non cambia scala; sta sul piano z = 0, tranne dietro il computer dove ha una sua profondità. A muoversi è il «mondo» (`Mondo.tsx`): edificio e computer ricevono la trasformazione inversa di una camera virtuale che percorre l’edificio. `percorso.stazione` va da 0 (header) a 1 (davanti allo schermo), 2 (biografia), 3 (contatti).

- avvicinamento, 100vh (`movimento.computer.avvicinamento`): la camera scivola dalla stazione header a quella del computer, abbassa lo sguardo sul computer a terra (≈ 40% del tratto) e poi scende fino allo schermo. Il volto va dietro il computer (sezione seguente).
- accensione al 90% dell’avvicinamento (`accendiDa`); tornando sotto il 60% (`spegniSotto`) lo schermo si richiude in una riga. Il primo avvio dura 2,2s (trama grigia, poi il volto pixelato sul piccolo computer), i successivi 0,7s.
- acceso/spento si ricava sempre da `percorso.computer.vicino`, controllato a ogni tick di GSAP: ScrollTrigger, nei refresh (resize, ricarica, link diretto), sposta la timeline senza eventi `onUpdate`, quindi non bastano i callback del tween.
- resize e rotazione: chi sta nella sosta resta nello stesso punto della sosta (anche con un progetto aperto); la posizione si legge al primo evento `resize`, prima che l’header rifaccia il pin. Cambiando la preferenza di movimento a sito aperto si resta nella stessa sezione (`src/lib/scroll.ts`); nel portfolio si torna a metà della sosta.
- quando lo schermo compare o diventa interattivo sotto un mouse fermo, l’interfaccia avvisa il cursore (`components/cursore/ricalcola.ts`), che lascia il posto alla freccia pixel senza aspettare un movimento.
- sosta, 120vh (`sosta`): camera ferma, schermo acceso, interfaccia utilizzabile. Nessun pin: lo scroll continua sempre.
- uscita: con l’ingresso della biografia la camera si rialza e si gira verso la parete della biografia; l’interfaccia segue il vetro finché è visibile.

Su desktop e tablet lo schermo occupa circa metà dell’altezza (`altezzaSchermo` 0,5, `larghezzaSchermo` 0,6) e la cornice resta visibile. Su telefono (< 768px) la camera supera la cornice e nell’ultimo tratto l’interfaccia passa dal vetro a tutta la vista, con una fascia nera in alto per il nome fisso.

## il volto dietro il computer

`leggiPosa` (`src/components/volto/percorso.ts`) proietta l’ingombro del monitor (`MONITOR` e `proiettaMonitor` in `inquadratura.ts`, mesh «monik2» di `Computer.glb`) e posa il volto rispetto a quel rettangolo. Oltre a posizione e larghezza in pixel la posa ha una profondità `z`: il volto sta `distacco` unità dietro il punto più lontano del monitor e `Volto3D.tsx` converte i pixel alla sua profondità. L’occlusione è quella vera del depth buffer; l’interfaccia DOM resta sopra il vetro. Le proporzioni del volto (lenti, pupille) vengono da `geometria.ts`. `inquadratura.ts` registra la proiezione in `misureScena` quando arriva il codice 3d, così three.js resta fuori dal bundle iniziale.

- discesa (`movimento.computer.volto`): fra `versoDa` e `versoA` dell’avvicinamento il volto scivola dal centro dietro il monitor, largo `fattore` (1,25) volte il monitor visto dalla camera, con lenti e occhi sopra il bordo. Da `nascondiDa` (0,85) si abbassa e arretra finché, visto da qui, è largo `fattoreNascosto` (0,86) volte il monitor: tutto coperto. Tutto scrubbato e reversibile.
- nascondino (`movimento.computer.sbircia`, `useNascondino` in `Portfolio.tsx`): solo fermi davanti allo schermo, GSAP anima `percorso.computer.sbircia` {lato, uscita}. Il volto esce (0,9s), resta 4–8s, rientra (0,7s), aspetta 1,4–3s e cambia lato; mai lo stesso due volte di fila. I lati dipendono dallo spazio (`latiDisponibili`): un lato vale se si vedono gli occhi interi. Su desktop e tablet orizzontale c’è spazio solo ai lati (destra/sinistra, lente intera e testa inclinata di 9°); su tablet verticale sopra, e destra/sinistra diventano «sopra, spostato». Su telefono nessun nascondino: l’interfaccia copre tutto. Mentre dorme non sbuca.
- reazioni: aprendo una cartella battito; aprendo un progetto (anche con link diretto) sorriso, con gli occhi che si stringono come nel logo 2d; chiudendolo occhiolino, con l’occhio che si vede. Se il volto è nascosto sbuca subito e ripete l’espressione quando è fuori. Lo sguardo segue il cursore anche sopra l’interfaccia; un clic sull’interfaccia non fa l’occhiolino (`LogoContinuo.tsx` ignora `[data-mac]`).
- uscita verso la biografia: parte dalla posa in cui si trova (anche sbucato) e torna al piano z = 0.

## interfaccia posata sul vetro

L’interfaccia non è una texture: è DOM vero, quindi nitida, cliccabile e accessibile. La sua risoluzione è la misura in pixel del vetro nella sosta (`misuraSosta`); a ogni fotogramma i quattro angoli del vetro vengono proiettati e trasformati in una `matrix3d` (omografia). La scena 3d chiama l’aggiornamento subito prima di disegnare, così DOM e WebGL restano allineati; senza scena (errore o caricamento) l’interfaccia si aggiorna da sola sul ticker di GSAP.

Il rettangolo del vetro (`VETRO` in `inquadratura.ts`) è misurato in Blender con una vista frontale di `Computer.glb`. Se il modello cambia va rimisurato ([sorgenti del computer](../sorgenti/computer/README.md)).

## uso

- clic seleziona, doppio clic apre; con tocco, penna o tastiera basta un’attivazione (Invio o Spazio).
- cartelle: finestra trascinabile con il mouse dalla barra del titolo; vista «per icona» (documento con la copertina a colori) o «per nome» (elenco con anno e discipline).
- documento: la finestra del progetto mostra copertina, discipline · anno · cliente, descrizione e blocchi. Segue l’indirizzo `/progetti/:slug`: aprirla aggiunge una voce alla cronologia, indietro la chiude, un link diretto porta la home davanti al computer già acceso con la finestra aperta.
- menu: volto (informazioni e crediti), archivio (apri, chiudi; vale anche per le applicazioni), vista (per icona, per nome), speciale (riordina le finestre).
- chiusura: casella a sinistra nella barra del titolo, «archivio → chiudi» o Esc (con una tendina aperta, Esc chiude prima la tendina). Il focus torna all’icona che aveva aperto la finestra.
- rotella e tocco: dentro una finestra scorre la finestra; sulla scrivania scorre la pagina.
- su telefono ogni finestra occupa la scrivania.

## applicazioni

Tre icone sotto le cartelle (`app/elenco.ts`). Si aprono come le cartelle (doppio clic, un tocco o Invio), in finestre del Finder trascinabili con casella di chiusura ed Esc; il focus torna all’icona. Su telefono occupano la scrivania. Il codice di ognuna è un chunk a parte (`app/Applicazioni.tsx`, `React.lazy`): nel caricamento iniziale entrano solo le icone. Suoni (`app/suoni.ts`, motore in `src/lib/audio/motore.ts`): `clic` a ogni scelta, `disco` all’apertura di un’applicazione, `floppy` all’invio di una dedica. Testi in `sito.app` (`src/config/sito.ts`), stile in `app/app.css` (stessi fosfori, trama e ChicagoFLF del Finder). Pezzi e strumenti sono disegnati a pixel nel codice (`app/pixel.tsx`): nessun file né licenza esterna.

### scacchi

- Si gioca con i bianchi contro il computer. Regole di [chess.js](https://github.com/jhlywa/chess.js) (BSD-2, unica dipendenza aggiunta il 2 ottobre 2026): mosse legali, arrocco, en passant, promozione, scacco, scaccomatto e patta (stallo, materiale insufficiente, tripla ripetizione, cinquanta mosse).
- Avversario scritto per il sito (`app/scacchi/avversario.ts`): negamax con potatura alfa-beta, valutazione materiale + posizione (tabelle «semplificate» di Michniewski), catture ordinate per prime. «facile» profondità 2 con un po’ di casualità, «medio» profondità 3; approfondimento iterativo con un tempo massimo (1,2 / 3 s), così non si blocca mai. Gira in un web worker (`avversario.worker.ts`): la scena 3d resta fluida mentre pensa. Misurato in Node sul Mac: prima risposta ≈ 0,2 s (facile) e ≈ 0,6 s (medio).
- Scacchiera `role="grid"`: clic o tocco su un pezzo e poi sulla casa (le mete sono un quadratino, le prese un riquadro), da tastiera frecce e Invio, Esc annulla la scelta. Promozione con scelta del pezzo. Stato annunciato (`role="status"`), mosse del computer annunciate.
- Volto: occhiolino quando il computer dà scacco, sorriso quando vinci.

### paint

- Tela 1-bit 512×342 (`app/paint/tela.ts`): matita (partendo da un punto nero cancella, come nel 1984), pennello (spessori 1, 2, 4, 8 con la trama scelta), gomma, linea, rettangolo vuoto e pieno, secchiello; dieci trame 8×8; annulla (24 passi) e cancella tutto.
- Mouse, penna e tocco con pointer events; `touch-action: none` sulla tela. Il punto si legge da `offsetX/offsetY`, già nelle coordinate locali anche con la `matrix3d` dello schermo. Da tastiera: frecce (maiuscolo: 8 pixel) e Invio/Spazio per abbassare e alzare la punta (linea e rettangolo: primo e secondo punto; secchiello: riempie).
- Sotto: dedica (massimo 140 caratteri), nome facoltativo e pubblico, «invia». Il png è a 1 bit con la palette dei fosfori (pochi kB), codificato nel browser con `CompressionStream`. Dopo l’invio si apre la cartella «dediche» con la nuova voce in testa.

### dediche

- Cartella pubblica: i disegni inviati, visibili subito a tutti, i più recenti per primi, 12 per pagina; «aggiorna». Ogni voce si apre (disegno, dedica, nome, data) e ha «segnala»: dopo 3 segnalazioni la voce sparisce. Esc nel dettaglio torna all’elenco.
- Dati da `/api/dediche` (`api/dediche.ts`): archivio su Google Drive, immagini servite dalla funzione. In sviluppo un archivio in memoria (`vite.config.ts`), in produzione senza variabili un avviso gentile. Guida per attivarle: [dediche su google drive](dediche-google-drive.md).

## accessibilità

L’interfaccia è una regione etichettata; resta `inert` finché la camera non è ferma davanti allo schermo acceso. Icone e voci sono pulsanti, le tendine usano `role="menu"` con frecce, le finestre sono `role="dialog"` non modali etichettate dal titolo. Aperture e chiusure sono annunciate con `aria-live`. Sullo schermo il cursore del sito lascia il posto alla freccia pixel.

## movimento ridotto

Il 3d si scarica comunque (scelta del 1 ottobre 2026), ma la scena è ferma: sezione alta uno schermo, inquadratura della sosta, computer già acceso senza avvio, niente sfarfallio del tubo né transizioni.

## crediti

`Computer.glb` è un modello Sketchfab con licenza CC BY 4.0: autore e link vanno indicati in `src/config/sito.ts` (`computer.crediti.modello` e `modelloLink`) e compaiono in «informazioni»; lo stesso vale per la sala (`ambiente` e `ambienteLink`, licenza da verificare). Finché mancano, la build mostra un avviso. Il 1 ottobre 2026 alessandro ha scelto di pubblicare comunque con i segnaposto (rischio accettato): i crediti restano da completare ([sorgenti del computer](../sorgenti/computer/README.md), [sorgenti della sala](../sorgenti/sala/README.md)). ChicagoFLF è di Robin Casady, dominio pubblico (`src/assets/font/README.ChicagoFLF.txt`).

## verifica — 1 ottobre 2026

Build TypeScript/Vite e lint superati; la build avvisa che i crediti del computer e della sala sono incompleti. Bundle iniziale ≈ 207 kB gzip: three.js, modello e interfaccia arrivano dopo il preloader. `computer.glb` 1,03 MB (originale 14,4 MB).

Verifica nel server di sviluppo con Chrome headless a 1440×900, 820×1180 e 390×844 (viewport emulati, non telefoni reali; nessuna misura di fps): discesa con il computer visto dall’alto, accensione, sosta, cartelle per icona e per nome, finestra del progetto con indirizzo `/progetti/…`, menu e informazioni, Esc su tendina e finestre con ritorno del focus, spegnimento tornando su e riaccensione, uscita verso la biografia, tocco su telefono, link diretto su telefono, movimento ridotto (scena ferma, computer acceso e usabile), modello bloccato (interfaccia comunque usabile). Il volto ora sta di proposito dietro il monitor (sezione «il volto dietro il computer»).

## i blocchi

`src/components/computer/Blocchi.tsx` mostra i blocchi in ordine, dentro la finestra del progetto. ogni tipo è un file a parte in `src/components/computer/blocchi/`, caricato con `React.lazy` solo quando serve. Dentro lo schermo i token del sito diventano i due colori dei fosfori e il cursore è la freccia pixel: le parole del cursore («sfoglia», «ruota», «play») qui non compaiono: mentre si scarica c’è un riquadro d’attesa della stessa forma (la pagina non salta). se un blocco si rompe, il resto della finestra continua a funzionare.

### pdf (`Pdf.tsx`)

- **react-pdf** disegna le pagine (worker di pdf.js configurato per vite, senza strato di testo né annotazioni); **page-flip** le fa girare come un libro. `react-pageflip` non supporta react 19, quindi page-flip è usato direttamente: il codice crea i nodi delle pagine e ci disegna dentro con dei portali react.
- **doppia pagina** quando lo spazio è largo almeno 700px, altrimenti una pagina (su telefono si gira con uno swipe). la prima pagina è la copertina. altezza massima: 72% dello schermo.
- pagine disegnate man mano: solo quelle entro 3 da quella aperta; una volta disegnate restano.
- controlli: pagina precedente, contatore `3 / 24` (annunciato agli screen reader), pagina successiva, schermo intero (su safari ios, che non lo permette, il libro occupa tutta la finestra). pulsanti magnetici (6px).
- giro di pagina 0,8s (`movimento.blocchi.giroPagina`); con movimento ridotto niente animazione né ombre.
- cursore “sfoglia”. se il pdf non si apre, il blocco non viene mostrato (avviso nella console).

### modello3d (`Modello3D.tsx`)

- un `<Canvas>` dedicato che nasce la prima volta che il blocco si avvicina allo schermo (200px prima) e si mette in pausa quando esce.
- il modello (`.glb` compresso con meshopt, caricato con `useModello` di `src/components/volto/tre.ts`) viene centrato e scalato per stare sempre nell’inquadratura.
- `OrbitControls` di drei: rotazione con inerzia, rotazione automatica finché non lo si tocca, zoom limitato (distanza 2,6–7), niente spostamento laterale.
- luci “da studio” (`<Luci />`), luce ambiente leggera e ombra di contatto (`ContactShadows`).
- barra di caricamento sottile al centro; pulsante per ripristinare la vista (e riattivare la rotazione automatica).
- dpr massimo 1,5 su telefono. cursore “ruota”. con movimento ridotto niente inerzia né rotazione automatica.

### video (`Video.tsx`)

- **file mp4** (con `poster` facoltativo): controlli personalizzati play/pausa, barra di avanzamento (trascinabile; da tastiera frecce ±5s, `home`, `end`; `role="slider"`), audio sì/no, schermo intero (su safari ios passa al lettore di sistema). clic sul video = play/pausa. cursore “play” / “pausa”.
- **`autoplay: true`**: parte muto e in loop solo quando è in vista, si ferma quando esce. l’audio non parte mai da solo.
- **link vimeo o youtube** (`url`): all’inizio c’è solo il poster (se c’è) e un pulsante play; il lettore esterno (youtube-nocookie, vimeo con `dnt=1`) si carica solo al clic. Questi parametri limitano il tracciamento previsto dai player, ma non rendono la riproduzione indipendente dai servizi esterni. un link non riconosciuto non mostra niente (avviso nella console).

### immagini (`Immagini.tsx`)

- `piena`: una sotto l’altra; `griglia`: due colonne da 768px.
- ogni immagine entra quando arriva in vista con una maschera che si apre dal basso (`clip-path`) e un leggero zoom indietro (motion); nella griglia la seconda colonna parte un attimo dopo. con movimento ridotto: dissolvenza.
- `loading="lazy"`; testo alternativo `immagine <n> di <titolo>`.

### testo (`Testo.tsx`)

paragrafi; una riga vuota nel testo li separa.

# accessibilità e prestazioni

## leggibilità

Palette in `src/styles/globals.css`: nero `#141414`, grigio `#4d4b4a`, bianco `#c9c5c0`. Copertine a colori e luci 3d sono le eccezioni previste; dentro lo schermo del computer valgono bianco e nero puri e ChicagoFLF (eccezione concordata il 1 ottobre 2026). Outfit Variable locale nel resto del sito, testi/etichette in minuscolo, selezione bianca con testo nero.

Il testo da leggere resta bianco sul fondo scuro; il grigio è riservato a bordi, superfici e parole biografiche prima della rivelazione. Biografia, etichette, nome fisso, contatti e copyright sono sopra il Canvas. Le finestre del computer sono opache: immagini e colori dei progetti non vengono alterati dall’ambiente.

## movimento ridotto e riserva

`prefers-reduced-motion: reduce` è rispettato anche se cambia a pagina aperta (si resta nella stessa sezione, `src/lib/scroll.ts`): niente Lenis, pin, scrub, battiti, cursore personalizzato o grana animata; volto SVG statico. Il portfolio usa una scena 3d ferma davanti al computer già acceso (il 3d del computer e della sala si scarica comunque, per scelta); restano dissolvenze brevi. Il preloader non scarica il logo 3d in questa modalità. [Comportamenti completi](animazioni.md#movimento-ridotto).

Un errore del logo o del Canvas viene gestito da `ScenaProtetta`: volto SVG di riserva. Se il computer 3d non si carica, l’interfaccia resta usabile in sovrimpressione nella posizione del vetro. Il fallback non sostituisce i test sui dispositivi/browser reali.

## tastiera, touch e struttura

- Focus bianco 2px con offset 4px, sempre visibile.
- Nome fisso attivabile da tastiera per tornare all’inizio. Dopo l’ingresso sono sempre visibili i link portfolio, chi sono e contatti: altezza 48px, nessun hamburger. La navbar è fuori dai pin, con una riga sotto il nome su mobile e link a sinistra su desktop; safe area e fascia del Finder condividono `--nav-bottom`.
- Computer: regione etichettata, `inert` finché la camera non è ferma sullo schermo acceso. Icone e voci sono pulsanti (Invio/Spazio aprono), menu con frecce ed Esc, finestre `role="dialog"` non modali; Esc chiude la finestra in primo piano e il focus torna all’icona che l’aveva aperta; aperture e chiusure annunciate con `aria-live`.
- Video: slider con frecce, Home/End; PDF con pulsanti e contatore accessibile.
- Contatti: hover equivalente a focus/tocco; copia email annunciata con `aria-live`.
- Controlli principali almeno 48px; contatti 56px, margini minimi 16px e safe area iOS.

`html lang="it"`, un `main`, quattro sezioni etichettate, un `h1` e titoli di sezione `sr-only`. Testi animati hanno una copia accessibile e la copia visuale `aria-hidden`. Canvas, tavola, grana e cursore sono decorativi. Le copertine hanno etichette descrittive; nessuna foto o firma nella home: l’avatar del chi sono è decorativo (Canvas `aria-hidden`, o immagine di riserva senza testo).

## caricamento e rendering

| risorsa | quando viene richiesta |
|---|---|
| codice della scena Three.js/R3F e GLB V2 | preloader, salvo movimento ridotto |
| computer 3d (≈ 1 MB) e interfaccia | dopo il preloader |
| copertine | icone dei documenti nelle cartelle aperte e finestra del progetto; il preloader include la prima |
| blocchi PDF, modello 3d, video, immagini, testo | solo se usati dal progetto aperto |
| laboratorio | solo sviluppo |
| player esterno Vimeo/YouTube | clic sul pulsante play |

- Modello V2 circa 872 kB con Meshopt, texture WebP incorporate e cache condivisa; nessuna HDRI di studio scaricata dalla home.
- Canvas della scena e del nome su `demand`, con richieste continue limitate a 60fps e DPR adattivo condiviso; la scena si aggiorna solo quando visibile e con scheda attiva; le espressioni continuano quando posizione/scala sono ferme. I modelli nelle finestre si fermano fuori vista.
- Stessi effetti su desktop e mobile, con qualità adattiva: se i fotogrammi non reggono scendono la risoluzione interna della nebbia, del riflesso e il DPR (massimo 1,5). Il telefono parte dal livello 1, il desktop dal 3. La risalita richiede 12 secondi consecutivi ad almeno 58fps e almeno 15 secondi dall’ultimo cambio; la discesa richiede 2 secondi sotto 52fps e almeno 3 secondi tra cambi. Preriscaldamento e scheda nascosta non alimentano la misura. Non esiste un ramo mobile che elimina l’ambiente o un effetto ([ambiente 3d](ambiente-3d.md#rifinitura-post-produzione)).
- Shader e texture preparati progressivamente durante l’header 2d: un oggetto con `compileAsync` oppure un upload per tick, poi alcuni render della post-produzione. Un salto al computer ha precedenza e non aspetta il preriscaldamento; mappa d’ombra disegnata una volta; il layout della pagina si legge solo quando serve (avatar, nome in metallo); il vetro del computer non ha filtri CSS mentre la camera scende.
- Materiali locali, luci e render target liberati allo smontaggio. Le risorse delle GLB condivise restano in cache.
- Immagini WebP fino a 2400px, copertine piccole da 900px per le icone. I file rimangono separati dal codice (`assetsInlineLimit: 0`).
- Zod esegue controlli in sviluppo/build, non viene scaricato dal sito di produzione.
- Video autoplay soltanto muti e in vista; PDF renderizzati vicino alla pagina aperta; grana animata solo con mouse.

## verifiche e limiti delle misure

Build e lint verificano codice e file dei progetti; la verifica browser deve coprire scroll avanti/indietro, accensione e spegnimento, cambio viewport, cartelle, finestre e link diretto, navbar, contatti, movimento ridotto e caricamento 3d fallito. Gli ultimi controlli sono descritti in [computer](computer.md#verifica--1-ottobre-2026).

Le misure Lighthouse del 26 settembre 2026 (prestazioni 81, accessibilità 96, buone pratiche 100, SEO 100) precedono il logo e l’ambiente V2: sono storiche e non descrivono la build corrente. L’obiettivo di 60fps non è una garanzia su ogni dispositivo. Ripetere misure sulla versione pubblicata e su telefoni fisici; un viewport mobile emulato verifica layout e interazioni, non le prestazioni del telefono.

## misura storica della fluidità — 2 ottobre 2026

**Non usare questa tabella come baseline del lavoro del 5 ottobre:** precede le correzioni allo strumento per attivare il pulsante d’ingresso e verificare lo sblocco dello scroll. La nuova verifica è in [navbar e mobile](navbar-mobile.md).

`npm run misura-fluidita -- <url> [telefono]` (`scripts/verifiche/misura-fluidita.mjs`) apre Google Chrome senza finestra con la GPU vera del Mac, scorre la pagina a velocità costante e riporta per tratto fps medi, 1% peggiore, fotogrammi oltre 33 ms e il più lungo. «telefono» = viewport 390×844 con CPU 4× più lenta: indica i problemi di CPU, non le prestazioni grafiche di un telefono vero.

Build di produzione, MacBook Pro M5 (alimentazione collegata), prima e dopo la fase di fluidità:

| tratto | prima (desktop) | dopo (desktop) | prima (telefono emulato) | dopo (telefono emulato) |
|---|---|---|---|---|
| header 2d | 60 fps, max 17 ms | 60 fps, max 17 ms | 60 fps, max 17 ms | 60 fps, max 17 ms |
| header 3d | 57 fps, **scatto 83 ms** | 60 fps, max 17 ms | 56 fps, **scatto 83 ms** | 60 fps, max 17 ms |
| discesa | 59 fps, max 50 ms | 60 fps, max 17 ms | 60 fps, max 33 ms | 60 fps, max 17 ms |
| chi sono | 60 fps, max 50 ms | 60 fps, max 17 ms | 56 fps, **scatto 183 ms** | 60 fps, max 17 ms |
| contatti | 60 fps | 60 fps | 60 fps | 60 fps |

Gli effetti «cinema» sono stati aggiunti dopo queste misure; la misura successiva è stata fatta a batteria (18%), quando macOS limita Chrome a 30fps anche senza effetti (`?effetti=0`), quindi non è confrontabile: va ripetuta con l’alimentazione collegata. Sui telefoni veri resta da misurare: la qualità adattiva interviene da sola se i 60fps non reggono.

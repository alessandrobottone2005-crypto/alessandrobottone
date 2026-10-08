> Aggiornamento dell’8 ottobre 2026: [accesso immediato ai lavori](accesso-rapido.md). La scelta iniziale e l’archivio non caricano la scena; l’esperienza parte su richiesta. Questa descrizione prevale sulle indicazioni storiche di avvio e navigazione riportate sotto.

# archivio progetti a tutta vista

Dal 7 ottobre 2026 la cartella «progetti» sostituisce le cartelle delle discipline sulla scrivania del Macintosh. Si apre con un clic, tocco o Invio; scacchi, paint e dediche conservano le finestre e lo stato nel Finder.

## percorsi

- `/progetti`: archivio con tutti i lavori pubblicati, nel loro ordine esistente. Filtri per disciplina; ogni progetto compare una volta nella vista «tutti».
- `/progetti/:slug`: scheda del lavoro, con copertina, metadati, descrizione e blocchi nel loro ordine originale.
- Ritorno all’archivio: ripristina filtro, posizione e focus sulla copertina. Il tasto indietro del browser segue lo stesso percorso.
- «torna al computer»: chiude la vista ampia e riporta davanti al Macintosh acceso, conservando le applicazioni. I collegamenti diretti aprono subito la vista richiesta dopo il preloader, senza accensione né pulsante d’ingresso.

## visualizzazione

`src/components/progetti/ArchivioProgetti.tsx` è un dialog nativo montato nel body: il top layer lo separa da trasformazioni, grana e vetro CRT. La home resta montata. Lo scroll della home è sospeso con un motivo distinto dal preloader; lo scroll del dialog resta nativo e la chiusura ripristina la navigazione.

ChicagoFLF, palette Macintosh e barre a righe; immagini originali senza filtri. Tre colonne da 1100px, due da 600px e una sotto. Copertine integrali, nessun lavoro in evidenza. La vista entra con un’espansione dal rettangolo del monitor solo quando viene aperta dal computer; niente animazione con movimento ridotto.

## materiali

I PDF usano react-pdf senza page-flip: tutte le pagine sono disposte verticalmente nello stesso flusso della scheda. Ogni pagina conserva le proprie proporzioni; un IntersectionObserver monta i canvas soltanto vicino alla lettura e li smonta quando si allontanano. Controlli persistenti per zoom 100–300%, adattamento alla larghezza, pagina corrente e PDF originale. Le pagine ingrandite si esplorano orizzontalmente senza muovere la home.

Copertine e gallerie aprono una lente con zoom. Esc chiude prima la lente, poi riporta dalla scheda all’archivio, poi al computer. Il focus torna al controllo di origine. PDF e immagini falliti mostrano un errore con «riprova»; un modulo che non si scarica offre «ricarica progetto» per ricreare anche gli import falliti. Gli altri blocchi restano utilizzabili. Il testo e i collegamenti presenti nei PDF sono abilitati; un PDF composto da sole immagini conserva i limiti di accessibilità dell’originale. La lente si esplora anche da tastiera. Senza WebGL, il modello offre il file originale mentre la presentazione PDF rimane disponibile. Modelli 3d e video mantengono i controlli precedenti.

## verifiche

`node scripts/verifiche/verifica-archivio.mjs http://127.0.0.1:4173/` verifica archivio, filtri, nove schede, zoom, PDF progressivi, cronologia, focus, ritorno al computer, conservazione delle app, collegamenti diretti, refresh e rotazione. Casi desktop, telefono, tablet con movimento ridotto e fallback WebGL. Risultati e schermate in `verifiche/risultati/archivio/`.

Build e lint restano `npm run build` e `npm run lint`. Questi controlli non pubblicano il sito.

Controllo dei materiali: `node scripts/verifiche/verifica-materiali-archivio.mjs` prova errori di rete e recupero, zoom reale, rilascio dei canvas lontani, brand book e modello 3d. I viewport mobile e tablet sono emulati in Chrome, non dispositivi fisici.

Verifica finale: build e lint superati; quattro configurazioni del browser superate. Controllati brand book da 30 e 70 pagine, recupero di PDF/immagini dopo errore di rete, liberazione dei canvas lontani e caricamento del modello. `node scripts/verifiche/verifica-tastiera-archivio.mjs` verifica lo spostamento nella lente da tastiera e l’alternativa del modello senza WebGL. Nessun deploy eseguito.

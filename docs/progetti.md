# progetti

Dal 7 ottobre 2026 i contenuti si aprono nell’[archivio a tutta vista](archivio-progetti.md), fuori dal vetro del Macintosh. Schema e file sorgente restano invariati; i PDF ora scorrono in verticale. Le indicazioni precedenti sulle cartelle delle discipline e sullo sfogliamento sono storiche.

per aggiungere un progetto basta creare una cartella: il sito la trova da solo. guida pratica passo passo: [come aggiungere un progetto](come-aggiungere-un-progetto.md). qui c’è come funziona dietro.

## la cartella

```
src/content/progetti/
  nome-progetto/           ← il nome della cartella diventa l’indirizzo /progetti/nome-progetto
    progetto.json
    copertina.webp
    copertina-card.webp    ← creata da npm run prepara-progetti (900px, per le icone)
    …altri file dei blocchi (webp, pdf, glb, mp4)
    _originali/            ← creata da npm run prepara-progetti: gli originali, non finiscono nel sito
```

- il nome della cartella può avere solo lettere minuscole, numeri e trattini (es. `mio-progetto`)
- le cartelle che iniziano con `_` o `.` vengono ignorate
- niente sottocartelle per i file: tutto nella cartella del progetto

## `progetto.json`

schema in `src/lib/schema.ts` (zod). non sono ammessi campi diversi da questi.

| campo | obbligatorio | cosa è |
|---|---|---|
| `titolo` | sì | testo, non vuoto |
| `descrizione` | sì | testo breve, non vuoto |
| `discipline` | sì | almeno una tra `branding`, `illustrazione`, `3d`, `web design` |
| `anno` | sì | numero intero tra 2000 e 2100 |
| `cliente` | no | testo |
| `ordine` | no | numero: più basso = prima |
| `pubblicato` | no | `true` (predefinito) o `false` per nasconderlo senza cancellarlo |
| `copertina` | sì | nome del file della copertina (proporzione 4:5) |
| `blocchi` | no | elenco dei blocchi della finestra del progetto, nell’ordine in cui compaiono (predefinito: nessuno) |

### i blocchi

| `tipo` | campi | note |
|---|---|---|
| `pdf` | `file` | pdf verticale con zoom e pagine progressive |
| `immagini` | `file` (un nome o un elenco), `layout` | `layout`: `piena` (predefinito, una sotto l’altra) o `griglia` (due colonne da tablet in su) |
| `modello3d` | `file` | un `.glb` |
| `video` | `file` **oppure** `url` (uno solo dei due), `poster`, `autoplay` | `url`: link vimeo o youtube. `autoplay` (predefinito `false`): muto e in loop, solo per clip brevi |
| `testo` | `testo` | una riga vuota separa i paragrafi |

i blocchi si possono ripetere e combinare. come si comportano nella finestra: [computer](computer.md#i-blocchi).

**ordine dei progetti**: prima quelli con `ordine` (dal numero più basso), poi quelli senza, dal più recente per `anno` (a parità di anno, in ordine alfabetico di cartella).

## come il sito legge i progetti

`src/lib/progetti.ts`:

1. con `import.meta.glob` di vite legge tutti i `src/content/progetti/*/progetto.json` e tutti i file `webp, avif, jpg, jpeg, png, gif, pdf, glb, gltf, mp4, webm` delle cartelle, come indirizzi (`?url`). i file dentro `_originali/` non vengono presi.
2. completa i valori predefiniti (`pubblicato`, `blocchi`, `layout`, `autoplay`) senza zod, così zod non si scarica nel sito: i valori condivisi stanno in `src/lib/dati.ts` (`DISCIPLINE`, `SLUG_VALIDO`, `fileUsati`).
3. salta i progetti non pubblicati; trasforma ogni nome di file in un indirizzo; se esiste `<copertina>-card.webp` la usa per le icone dei documenti (`copertinaCard`).
4. ordina e restituisce `progetti`; `trovaProgetto(slug)` trova il progetto della rotta `/progetti/:slug`.

in sviluppo, se un `progetto.json` non va, l’errore compare anche nella console del browser.

## i controlli

`scripts/valida-progetti.ts` controlla ogni cartella:
- nome della cartella valido
- `progetto.json` presente e scritto correttamente
- campi conformi allo schema (errori tradotti in frasi italiane da `spiegaErrori`)
- per i progetti pubblicati, che tutti i file citati esistano. i progetti con `pubblicato: false` possono essere incompleti

dove gira:
- **`npm run build`**: il plugin `controlla-progetti` in `vite.config.ts` ferma la build con l’elenco dei problemi, es. `progetto "nome-progetto": manca il file "manuale.pdf"`
- **`npm run dev`**: stesso controllo all’avvio e a ogni file aggiunto, cambiato o tolto in `src/content/progetti/`; gli errori compaiono nel terminale
- **`npm run prepara-progetti`**: alla fine del lavoro

## gli script

### `npm run nuovo-progetto` (`scripts/nuovo-progetto.mjs`)

chiede nel terminale: titolo, indirizzo (proposto dal titolo), breve descrizione, discipline (per numero), anno (proposto l’anno in corso), cliente (facoltativo). le risposte diventano minuscole. crea `src/content/progetti/<indirizzo>/progetto.json` con `pubblicato: false`, `copertina: "copertina.webp"` e nessun blocco. non accetta un indirizzo già usato.

### `npm run prepara-progetti` (`scripts/prepara-progetti.mjs`)

per ogni progetto:
- **immagini** (`jpg, jpeg, png, avif, tif, tiff, webp`): l’originale va in `_originali/`, al suo posto c’è un `.webp` con lato massimo 2400px (qualità 82). se l’estensione cambia, `progetto.json` viene aggiornato da solo. un file già presente in `_originali/` non viene rifatto
- **copertina piccola**: crea `<copertina>-card.webp` largo 900px (la ricrea se la copertina è più recente)
- **modelli `.glb`**: l’originale va in `_originali/`, la versione compressa (meshopt, texture in webp, con `gltf-transform`) prende il suo posto
- **avvisi**: pdf sopra 15mb, video sopra 25mb, file `.mov`/`.m4v` da esportare in mp4 (h.264)
- alla fine esegue il controllo completo e dice quanti progetti ci sono e quanti sono pubblicati; se ci sono problemi esce con errore

## progetti pubblicati

Dal 2 ottobre 2026 i venti segnaposto non ci sono più. In `src/content/progetti/` ci sono `dai-tre-fuochi`, `lorenzo` e `serena-brancale` (branding, 2026, progetto accademico iuad), ognuno con copertina e brand book in pdf, e cinque illustrazioni (2025, progetto personale): `arabian-sunset`, `donne-selvagge`, `dont-look-medusa`, `dove-la-guerra-non-arriva` (solo copertina) e `inktober` (cinque tavole in un blocco immagini). In 3d `cuphead-mugman-art-toys` (2026, progetto accademico iuad): presentazione pdf, modello 3d e testo del concept. Le cartelle del computer si riempiono da sole con i progetti pubblicati, in base alle `discipline` (un progetto con più discipline compare in più cartelle): non serve modificare il codice. Una cartella senza progetti apre una finestra vuota. Il preloader include la copertina del primo progetto.

## pdf troppo pesanti

`npm run comprimi-pdf -- <entrata.pdf> <uscita.pdf> [lato lungo px, 1600] [qualità 0–1, 0.7]` (`scripts/comprimi-pdf.swift`, solo PDFKit di macOS) disegna ogni pagina come JPEG e ricompone un pdf con le stesse misure. Il testo diventa immagine: per la massima nitidezza è meglio riesportare da InDesign (immagini 150 ppi, JPEG qualità media). L’originale va in `sorgenti/progetti/<slug>/`, che git ignora (GitHub rifiuta i file sopra 100 MB).

## contenuti pubblici

`pubblicato: false` è una scelta editoriale, non un controllo di accesso. I file importati o caricati sul sito possono essere raggiungibili tramite URL; non inserire contenuti riservati confidando che un progetto nascosto li protegga. `_originali/` è esclusa dagli import del runtime e dall’upload CLI configurato in `.vercelignore`, ma può restare nel repository GitHub. Le finestre opache proteggono la fedeltà visiva delle immagini, non rendono privati i file.

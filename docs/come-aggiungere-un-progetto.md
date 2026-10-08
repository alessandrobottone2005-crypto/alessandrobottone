# come aggiungere un progetto

guida veloce, senza codice. ogni progetto è una cartella: il sito la trova da solo.

---

## 1. crea il progetto

apri il terminale nella cartella del sito e scrivi:

```
npm run nuovo-progetto
```

ti farà qualche domanda (titolo, indirizzo, descrizione, discipline, anno, cliente).
alla fine trovi una nuova cartella in `src/content/progetti/<nome-progetto>/` con dentro `progetto.json`.

il nome della cartella diventa l’indirizzo della pagina: `tuosito.it/progetti/<nome-progetto>`.

## 2. metti i file nella cartella

- la **copertina** (proporzione 4:5, verticale): chiamala `copertina.jpg`, `copertina.png` o `copertina.webp`
- tutti gli altri file del progetto: immagini, pdf, modelli 3d (`.glb`), video (`.mp4`)

non servono sottocartelle: tutto nella cartella del progetto.

## 3. scegli i contenuti (i “blocchi”)

apri `progetto.json` con un editor di testo e compila `"blocchi"`. compaiono nella finestra del progetto, dentro il computer, nell’ordine in cui li scrivi. puoi usarne quanti vuoi, anche ripetuti.

```json
"blocchi": [
  { "tipo": "testo", "testo": "un paragrafo sul progetto." },
  { "tipo": "immagini", "file": ["01.jpg", "02.jpg"], "layout": "griglia" },
  { "tipo": "immagini", "file": ["03.jpg"], "layout": "piena" },
  { "tipo": "pdf", "file": "manuale.pdf" },
  { "tipo": "modello3d", "file": "modello.glb" },
  { "tipo": "video", "file": "reel.mp4", "poster": "poster.jpg", "autoplay": false },
  { "tipo": "video", "url": "https://vimeo.com/000000000" }
]
```

| blocco | a cosa serve |
|---|---|
| `testo` | paragrafi; una riga vuota tra due paragrafi li separa |
| `immagini` | una o più immagini, `"piena"` (una sotto l’altra, grandi) o `"griglia"` |
| `pdf` | un manuale o una presentazione da sfogliare come un libro |
| `modello3d` | un modello da ruotare con il mouse o con il dito |
| `video` | un file mp4 (con immagine di anteprima) oppure un link vimeo o youtube. `"autoplay": true` solo per clip brevi: parte muto e in loop |

## 4. pubblica il progetto

in `progetto.json` cambia `"pubblicato": false` in `"pubblicato": true`.

altre cose che puoi regolare:
- `"ordine": 1` → il progetto va per primo (numero più basso = prima). senza ordine, i più recenti vengono prima
- `"pubblicato": false` → nasconde il progetto senza cancellarlo
- `"cliente"` si può togliere se non c’è

scrivi sempre tutto in minuscolo.

## 5. prepara i file e controlla

```
npm run prepara-progetti
```

questo comando:
- converte le immagini in webp e le ridimensiona (gli originali restano in `_originali/`, che non finisce nel sito)
- crea la versione piccola della copertina per l’icona del documento
- comprime i modelli 3d
- ti avvisa se un pdf supera 15mb o un video 25mb
- controlla che non manchi niente

se qualcosa non va, leggi il messaggio: dice esattamente quale progetto e quale file, per esempio
`progetto "nome-progetto": manca il file "manuale.pdf"`.

## 6. guarda il risultato

```
npm run dev
```

Apri [localhost:5173](http://localhost:5173): scendi fino al computer e apri «progetti» con un clic, poi scegli la copertina nell’archivio a tutta vista. Verifica titolo, discipline, anno, descrizione e blocchi nella finestra. Prova anche il link diretto `http://localhost:5173/progetti/<nome-progetto>` con lo slug effettivo, e i formati desktop/telefono.

## 7. pubblica il sito

Quando il progetto è pronto, esegui `npm run lint` e `npm run build`, poi controlla la build con `npm run preview`. Salva le modifiche nel branch di lavoro su GitHub. Il push può creare un’anteprima se l’integrazione Git è configurata; per aggiornare il sito in produzione segui la [procedura di pubblicazione](pubblicazione.md). Non confondere una preview con il dominio pubblico.

---

### se preferisci passarmi i materiali

Per ogni progetto prepara una cartella con:

- le immagini (jpg o png grandi), i pdf, i video mp4 e gli eventuali `.glb`;
- un file `testo.txt` con: titolo, descrizione (verrà pubblicata così com’è), anno, cliente (facoltativo), discipline (illustrazione, branding, 3d, web design: anche più di una; per web design la cartella va prima riaccesa, chiedimelo), quale immagine è la copertina e in che ordine vuoi i contenuti nella finestra.

Io creo le schede (`progetto.json`), ottimizzo i file con `npm run prepara-progetti`, controllo che tutto si apra nel computer. Se un pdf è troppo pesante lo comprimo io (vedi sotto).

### consigli sui file

- **contenuti**: il sito è pubblico; `pubblicato: false` nasconde il progetto ma non protegge file riservati.
- **immagini**: jpg o png grandi vanno bene, il comando del punto 5 le ottimizza
- **pdf**: esporta per lo schermo (non per la stampa) per restare sotto i 15mb. se è più pesante: `npm run comprimi-pdf -- originale.pdf src/content/progetti/<nome-progetto>/brand-book.pdf` e sposta l’originale in `sorgenti/progetti/<nome-progetto>/` (resta sul computer, non va su github)
- **video**: mp4 (h.264). se hai un .mov, esportalo in mp4
- **modelli 3d**: `.glb`; da blender: file → esporta → gltf 2.0 (.glb). se il modello ha centinaia di migliaia di triangoli o materiali fatti con nodi di miscela, passami il `.blend` con le risorse impacchettate: lo riduco ed esporto io senza toccare l’originale (esempio: `scripts/blender/esporta-cuphead.py`)

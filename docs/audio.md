> Aggiornamento dell’8 ottobre 2026: [accesso immediato ai lavori](accesso-rapido.md). La scelta iniziale e l’archivio non caricano la scena; l’esperienza parte su richiesta. Questa descrizione prevale sulle indicazioni storiche di avvio e navigazione riportate sotto.

# audio e ingresso

Il sito ha una base musicale di sottofondo e i suoni del computer e dei glitch. I browser fanno partire l’audio solo dopo un gesto: per questo, a preloader finito, c’è il pulsante «inizia a scrollare».

## ingresso

- Durante il preloader non compare più nessuna scritta: la vecchia «scorri per esplorare» con la freccia è stata tolta.
- A preloader finito compare in basso al centro il pulsante «inizia a scrollare» (`Bottone` di Figma, misura big; su telefono sopra il cognome). Prende il focus da solo.
- Finché non si preme, lo scroll resta bloccato come nel preloader: `html.scroll-fermo` e Lenis fermo (rotella, tastiera), `touchmove` annullato (iPhone), `main` è `inert` (niente focus su elementi nascosti).
- Clic, tocco, Invio o spazio: l’audio parte (dentro il gesto), lo scroll si libera, il pulsante esce scendendo e sfumando.
- Seconda visita nella stessa sessione: preloader breve, pulsante come la prima volta (serve comunque il gesto per l’audio).
- Link diretto `/progetti/:slug`: nessun pulsante, la pagina va subito davanti al computer acceso con la finestra aperta; l’audio parte al primo clic, tocco o tasto nella pagina.
- Movimento ridotto: stesso pulsante, solo una dissolvenza breve.

Codice: `components/audio/Ingresso.tsx`, stato `entrato` in `components/preloader/AvvioContext.tsx`, sblocco in `Preloader.tsx` (`finito && entrato`). Testo in `ingresso` di `src/config/sito.ts`.

## motore

`src/lib/audio/motore.ts`, un solo `AudioContext` creato in `audio.avvia()`:

```text
musica (loop) → bus musica → abbassamento ┐
effetti (glitch)       → bus effetti ─────┼→ generale (muto) → uscita
computer (ventola, …)  → bus computer ────┘
```

- La musica si scarica a preloader finito (`audio.precarica()`), si decodifica all’avvio e parte con una dissolvenza di 2 s fino al volume di sottofondo (35%). Ciclo esatto con `AudioBufferSourceNode.loop`.
- `audio.abbassaMusica(true)` abbassa la musica di 10 dB con una rampa morbida; `false` la riporta su.
- `audio.suona(nome, { volume, velocita, bus, ciclo })`: `glitch` sceglie una di quattro varianti con una velocità leggermente diversa (bus effetti); `accensione`, `accordo`, `ventola`, `disco`, `clic`, `floppy`, `spegnimento` vanno sul bus computer. `accensione` porta con sé l’accordo d’avvio 0,9 s dopo. I suoni brevi suonano solo se già pronti (si preparano tutti all’avvio, pochi kB); con `ciclo: true` il suono parte appena caricato e restituisce `{ ferma }`.
- Muto (`audio.impostaMuto`) ricordato in `localStorage` (`audio:muto`): il volume scende in 0,3 s e il contesto si sospende. Anche con la scheda nascosta il contesto si sospende e riparte da dove era.
- Il movimento ridotto non spegne l’audio.
- `audio.diagnosi` serve solo alle verifiche (stato del contesto, musica, cicli attivi).
- Su iPhone l’interruttore del silenzioso spegne anche l’audio del sito (comportamento predefinito di Safari per Web Audio).

Formati: `.webm` (opus) dove il browser lo dichiara sicuro, altrimenti `.m4a` (aac, Safari); se la decodifica fallisce si prova l’altro. Volumi e tempi in `audio` di `src/config/movimento.ts`; lì anche la durata esatta dei file in ciclo (`cicli`), da aggiornare se cambia lo script.

## pulsante audio

`components/audio/PulsanteAudio.tsx`: `Bottone` di Figma (misura small, 40px) con testo visibile «audio-on» / «audio-off», posizionato nella navbar in alto insieme ai link di navigazione (`Header.tsx`). Compare dopo l’ingresso. `aria-label` «attiva audio» / «disattiva audio» e `aria-pressed` (premuto = audio attivo).

## computer

`components/audio/AudioComputer.tsx` controlla sul ticker di GSAP lo stato del computer (`leggiFase()` di `components/computer/stato.ts`) e la posa (`percorso.computer.vicino` ≥ 0,999 e `percorso.stazione` < 1,001, la stessa condizione del nascondino): davanti allo schermo acceso la musica si abbassa e parte la ventola in ciclo; uscendo dalla sosta, o a computer spento, la ventola sfuma e la musica torna su. Con movimento ridotto basta che la sezione del portfolio occupi il centro dello schermo. Gli altri suoni del computer (accensione, clic, disco, floppy, spegnimento) li chiama l’interfaccia del computer.

## file

`npm run prepara-audio` rigenera `public/audio/` dagli originali in `sorgenti/audio/` (fuori da git; si può indicare un’altra cartella: `npm run prepara-audio -- <cartella>`). Serve ffmpeg.

| file | durata | webm | m4a |
|---|---|---|---|
| musica (stereo, loop) | 92,16 s | 1,1 MB (96 kbps) | 1,4 MB (128 kbps) |
| ventola (loop) | 6 s | 36 kB | 49 kB |
| accensione, spegnimento, accordo, disco | 2–4 s | 13–25 kB | 18–36 kB |
| clic, floppy, glitch-1…4 | < 1 s | 3–6 kB | 4–9 kB |

Fonti, autori e licenze: [sorgenti/audio/README.md](../sorgenti/audio/README.md).

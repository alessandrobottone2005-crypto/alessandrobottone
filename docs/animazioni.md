# animazioni

cosa si muove, dove sta il codice e quali numeri si possono regolare. tutti i tempi e le lunghezze di scroll regolabili sono in `src/config/movimento.ts` (ultima sezione di questa pagina).

## header e logo continuo

file: `src/sections/Header/Header.tsx`, `Tavola.tsx`, `src/components/volto/LogoContinuo.tsx`, `Volto3D.tsx`, `percorso.ts`.

- header bloccato per ≈ 332vh desktop/tablet, ≈ 249vh telefono. una timeline in unità 0–100: illustrazione 0, branding 25, 3d 50, finale 75–83. web design è spento (`webDesignAttivo` in `src/config/discipline.ts`): rimettendo `true` torna la fase web a 75, il finale si sposta a 92–100 e il pin torna 400/300vh, senza altre modifiche.
- volto interamente visibile, largo `min(86vw, 104svh)`. nome e cognome restano sui bordi fino al 92% dell’header, poi si riducono in due righe fisse in alto a destra, cliccabili per tornare all’inizio; etichette grandi, senza numeri, nessun trattino di avanzamento.
- nome in metallo (dal 2 ottobre 2026): `src/components/nome/Nome3D.tsx` estrude ogni lettera in outfit black con il materiale del logo e la posa sulla lettera dom corrispondente, che resta trasparente come sagoma (stesse animazioni gsap di prima: entrata, raccolta in alto a destra, versione ridotta). le lettere vicine al cursore si girano verso di lui, avanzano un poco e prendono la luce; su touch restano ferme. canvas leggero a parte, z-40, senza post-produzione, disegnato solo quando qualcosa si muove. movimento ridotto o errore: la scritta dom torna visibile.
- «scorri per esplorare» (`src/components/preloader/InvitoScorrere.tsx`): nel preloader le lettere salgono una dopo l’altra insieme al disegno del volto (`invito.ts`), la freccia compare al risveglio; nell’header la stessa scritta, nella stessa posizione, respira e la freccia scende in loop. sparisce nei primi istanti di scroll e torna risalendo. su telefono sta sopra il cognome. movimento ridotto: ferma.
- illustrazione: filtro matita e schizzi; branding: griglia di costruzione e campioni, piccolo arretramento del volto; 3d: SVG e modello animabile si sovrappongono e si dissolvono, poi rotazione fino a -35°; finale: il volto torna quasi frontale e raggiunge la misura con cui il portfolio lo riceve al centro. con web design attivo, prima del finale: finestra del browser disegnata e puntatore, il volto arretra dentro la finestra; la finestra svanisce, il volto resta.
- il Canvas globale continua attraverso tutte le sezioni. `percorso.ts` legge gli ancoraggi DOM e i numeri delle timeline: nessun rimontaggio tra header, portfolio, biografia e contatti. tutto si riavvolge tornando su.

## portfolio: il computer

file: `src/sections/Portfolio/Portfolio.tsx` (id ScrollTrigger `portfolio-computer`), `src/components/computer/`, `src/components/volto/Mondo.tsx`, `ComputerNellaScena.tsx`. guida completa: [computer](computer.md).

- nessun pin: 100vh di avvicinamento e 120vh di sosta, poi la biografia entra dal basso.
- avvicinamento: la camera scivola alla stazione del computer, guarda giù verso il computer a terra e scende fino allo schermo; il volto lascia il centro e va dietro il computer, più grande del monitor, con lenti e occhi sopra il bordo. arrivando davanti allo schermo si abbassa e si nasconde.
- nascondino nella sosta: il volto sbuca dai lati in cui si vedono gli occhi (destra e sinistra su desktop e tablet orizzontale; sopra e sopra spostato su tablet verticale; nessuno su telefono, dove l’interfaccia lo copre) e reagisce al Finder (vedi [computer](computer.md#il-volto-dietro-il-computer)).
- al 90% il computer si accende: il tubo si apre da una riga, trama grigia, volto pixelato sul piccolo computer, poi la scrivania. tornando sotto il 60% lo schermo si richiude in una riga; le finestre restano dove erano.
- sosta: camera ferma, interfaccia utilizzabile. su telefono l’interfaccia occupa tutta la vista.
- uscita: con la biografia la camera si rialza e si gira verso la parete; l’interfaccia segue il vetro.
- tutto è reversibile in entrambe le direzioni.

## chi sono (`src/sections/ChiSono/ChiSono.tsx`)

- testo biografico invariato; a sinistra l’avatar olografico di alessandro (vedi [volto](volto.md#avatar-olografico-del-chi-sono)). su mobile la colonna è più piccola per lasciare spazio al testo.
- scambio: il logo arriva nella colonna, all’inizio del pin si schiaccia in una riga come un tubo che si spegne e l’avatar a punti si disegna con una scansione dall’alto; alla fine del pin avviene il contrario e il logo vola ai contatti. `percorso.biografia.ologramma` (0 logo → 1 avatar), durata `movimento.chiSono.scambio`. tutto guidato dallo scroll, quindi reversibile.
- SplitText accende ogni parola da opacità 0,315 a 1, in sequenza, durante 150vh di scroll. poi 100vh accompagnano il logo verso il centro e la misura dei contatti; il testo si dissolve.
- il pin si usa soltanto se il testo entra nello schermo (meno dell’86% dell’altezza, schermo alto più di 500px). altrimenti testo in flusso normale e uscita del logo guidata dall’ultimo tratto di scroll della sezione.
- `autoSplit` riallinea le parole dopo i cambi di font/layout. copie `sr-only` per lettura accessibile, parole animate `aria-hidden`.

## contatti (`src/sections/Contatti/Contatti.tsx`)

- **entrata**: il logo 3d arriva dalla biografia, grande al centro; resta fermo in posizione e scala, continuando espressioni, sonno e sguardo. i pulsanti e il copyright sottostante salgono sfalsati quando i contatti arrivano al 65% dello schermo. l’anno del copyright si aggiorna automaticamente.
- **sguardo**: il volto segue il cursore; con il mouse (o il focus da tastiera) su un pulsante, guarda quel pulsante.
- **pulsanti**: il `Bottone` di figma in misura big (`src/components/bottoni/`), solo testo; in riga da 768px, in colonna a tutta larghezza sotto:
  - a riposo pieno bianco con testo nero; al passaggio un cerchio nero si allarga dal punto da cui entra il cursore (`clip-path`) ed esce dal punto da cui esce, con il testo bianco come seconda copia ritagliata, e sotto si accende il bagliore bianco (`shadow-bagliore`, solo opacità); premendo compare un bordo bianco
  - il testo rotola (`RotolaAlPassaggio`); il pulsante è attratto dal cursore fino a 12px (`Magnetico`)
  - su touch: il nero entra dal punto toccato e sparisce dopo 0,45s; il testo rotola una volta quando il pulsante entra in vista
  - `BottoneIcona` (cerchio 40/48/56px) e `Icona` (svg di figma) sono pronti ma per ora si vedono solo in `/laboratorio`
- **email**: un clic copia l’indirizzo (`src/lib/appunti.ts`, con una soluzione di riserva per i browser senza api degli appunti). l’etichetta diventa “copiata” per 2s, il volto fa l’occhiolino e sorride, gli screen reader sentono “indirizzo email copiato”. se la copia non riesce si apre il programma di posta (`mailto:`). al passaggio del mouse o con il focus compare un piccolo suggerimento con l’indirizzo (fatto con motion).

## glitch

Disturbi casuali che si vedono e si sentono (`src/lib/glitch.ts`, parametri in `movimento.glitch`).

- **pianificatore** (`avviaGlitch`, montato dalla scena 3d della home): uno ogni 12–25s a caso, durata 0,2–0,5s, intensità 0,45–1 (×0,8 a tutto schermo). Parte solo dopo l’ingresso (`audio.avviato`); si ferma con la scheda nascosta e con movimento ridotto (anche cambiato a sito aperto: un glitch in corso si spegne subito) e non disturba chi usa il computer acceso davanti allo schermo (sosta e finestra di un progetto). Se ora non c’è niente da disturbare riprova dopo 2–4s.
- **bersaglio** scelto fra ciò che è in vista, con pesi: ologramma 3 (chi sono in vista e avatar acceso), logo 1,5 (logo 3d visibile, non ancora schiacciato nell’avatar), camera 1 (scena 3d visibile). Soprattutto l’ologramma.
- **logo** (`Volto3D.tsx`): piccoli salti a scatti di posizione, rotazione e altezza, fasce orizzontali del modello che scivolano di lato (vertici del materiale) e sdoppiamento attorno al logo nella post-produzione. Applicato dopo la posa del fotogramma: al fotogramma dopo torna identico, `percorso.ts` non cambia.
- **ologramma** (`Ologramma.tsx`, `ologramma.glsl.ts`): righe spostate, blocchi che pescano da un altro punto, punti persi, salti a un altro fotogramma del video (anche specchiato), copie sfasate nel bianco della palette.
- **camera** (`EffettoGlitch` in `effettiCinema.ts`, `Rifinitura.tsx`): bande spostate, blocchi, sdoppiamento rgb, righe e una fascia d’ombra, quadro che scivola appena. Passaggio a sé prima di fuoco, tonalità e colore noir (le frange rgb tornano quasi grigie); spento a riposo, quindi senza costo; acceso anche nei fotogrammi di riscaldamento per compilarlo prima. `?senza=glitch` lo esclude.
- **suono**: a ogni glitch `audio.suona('glitch', { volume, velocita, bus: 'effetti', ciclo: true })` con volume e velocità casuali, fermato alla fine del disturbo: dura quanto il glitch qualunque sia la lunghezza del campione.
- **sicurezza fotosensibile**: mai due glitch a meno di 1/3s (`emetti` li scarta), ciò che cambia la luminosità (punti persi, fascia d’ombra) cambia al massimo 6 volte al secondo (3 lampi, `glitch.semeLuce`), gli spostamenti a 14 scatti al secondo; nessun lampo bianco: il disturbo non schiarisce mai la scena (solo spostamenti e ombre, righe −12%, fascia −25%).
- in sviluppo `window.__glitch.emetti({ bersaglio: 'camera', durata: 0.5, intensita: 1 })` lo forza.

## cursore (`src/components/cursore/Cursore.tsx`)

- esiste solo con il mouse (`(hover: hover) and (pointer: fine)`) e senza movimento ridotto; nasconde il cursore di sistema.
- gsap sposta il contenitore con leggera inerzia (`quickTo`, 0,18s); motion cambia la forma dentro.

| dove | forma |
|---|---|
| ovunque | punto bianco da 10px |
| link, pulsanti, elementi con focus | anello da 44px |
| elementi con `data-cursore="…"` | cerchio pieno da 96px con la parola in nero |
| pressione | si contrae a 0,8 |

sullo schermo del computer (`[data-mac]`) il cursore del sito si nasconde e compare la freccia pixel del 1984. i blocchi conservano le parole `sfoglia` (pdf), `ruota` (3d), `play` / `pausa` (video) nel codice, ma oggi si trovano solo dentro lo schermo e quindi non compaiono.

la forma si ricalcola anche senza muovere il mouse: dopo uno scroll (anche dentro una finestra), a ogni cambio di focus, a ogni cambio di indirizzo (apertura e chiusura di un progetto) e quando lo schermo del computer compare o diventa interattivo sotto un mouse fermo (evento `cursore:ricalcola`, `src/components/cursore/ricalcola.ts`, inviato da `Interfaccia.tsx`).

## micro-interazioni riusabili

| componente | cosa fa | dove si usa |
|---|---|---|
| `src/components/testo/RotolaAlPassaggio.tsx` | testo di link e pulsanti che “rotola”: le lettere salgono e una copia arriva dal basso. si attiva da solo con passaggio del mouse o focus da tastiera sul link/pulsante che lo contiene (su touch al tocco), oppure con la prop `attivo` | pulsanti dei contatti |
| `src/components/testo/TestoCheRotola.tsx` | quando il testo cambia, le lettere vecchie salgono e le nuove arrivano dal basso | etichette dell’header |
| `src/components/testo/NomePesoVariabile.tsx` | le lettere vicine al cursore diventano più pesanti (asse `wght` di outfit, in base alla distanza); su touch nel punto toccato. con peso fisso (min = max) l’effetto è spento | nome dell’header (oggi fisso a 900, sagoma del nome in metallo) |
| `src/components/interazioni/Magnetico.tsx` | involucro attratto dal cursore (max 12px, `movimento.magnetismo.pulsanti`; 4–6px per i controlli piccoli). solo con il mouse | pulsanti dei contatti e dei blocchi |
| `src/components/effetti/Grana.tsx` + `.grana` in `globals.css` | rumore leggerissimo (opacità 4%) su tutto il sito; animato solo con mouse e senza movimento ridotto, fermo su touch | ovunque |

altre regole:
- stati “premuto” con `active:scale-…` sui pulsanti.
- focus da tastiera: anello bianco 2px con distanza 4px, che entra stringendosi in 0,3s (`globals.css`).

## cosa controlla `src/config/movimento.ts`

| gruppo | valori |
|---|---|
| `ease` | curve: `entrata` (`expo.out`), `transizione` (`power3.inOut`) |
| `durata` | `micro` 0,25s · `standard` 0,7s · `grande` 1,4s · `ridotta` 0,2s (movimento ridotto) |
| `scrub` | `desktop` 1 · `mobile` 0,6 |
| `lenis` | `lerp` 0,1 (più basso = più morbido e lento) |
| `preloader` | `minimo` 1,6s · `massimo` 6s · `breve` 0,8s (seconda visita nella stessa sessione) |
| `header` | `pinDesktop` 400 · `pinMobile` 300 (vh) · `inizioNomeCompatto` 92 (% dell’header in cui il nome inizia a raccogliersi) |
| `computer` | `avvicinamento` 100vh · `sosta` 120vh · `accendiDa` 0,9 · `spegniSotto` 0,6 · `avvio` 2,2s · `avvioBreve` 0,7s · `altezzaSchermo` 0,5 · `larghezzaSchermo` 0,6 |
| `computer.volto` | volto dietro il monitor: `fattore` 1,25 · `fattoreNascosto` 0,86 · `distacco` 0,5 u · `versoDa` 0,3 · `versoA` 0,55 · `nascondiDa` 0,85 · `margine` 0,03 ([computer](computer.md#il-volto-dietro-il-computer)) |
| `computer.sbircia` | nascondino: `uscita` 0,9s · `rientro` 0,7s · `restaMin/Max` 4–8s · `nascostoMin/Max` 1,4–3s · `rollio` 9° · `altezza` 0,38 · `spostamento` 0,16 |
| `chiSono` | `pin` 150 · `versoContatti` 100 (vh) · `scambio` 14 (scroll in cui logo e avatar si scambiano) |
| `avatar` | `fotogrammi` 24 · `inclinazioneMax` 11° · `smorzamento` 6 · `autonomoDopo` 2s |
| `volto` | `battitoMin` 3s · `battitoMax` 7s · `sonnoDopo` 8s |
| `blocchi` | `giroPagina` 0,8s (pdf) |
| `magnetismo` | `pulsanti` 12px |
| `glitch` | `intervallo` 12–25s · `riprova` 2–4s · `durata` 0,2–0,5s · `intensita` 0,45–1 · `camera` ×0,8 · `pesi` ologramma 3, logo 1,5, camera 1 · `scatti` 14/s · `lampiMax` 3/s · `volume` 0,45–0,85 · `velocita` 0,85–1,25 ([glitch](#glitch)) |

nello stesso file:
- `media`: i breakpoint (telefono < 768px, tablet 768–1023px, desktop ≥ 1024px, mouse, movimento ridotto)
- `volto`: dimensione del volto nel preloader (`max(30vmin, 12rem)`) e nell’header (`min(86vw, 104svh)`)

## movimento ridotto

con `prefers-reduced-motion: reduce`:

- niente lenis (scroll nativo), niente pin né scrub
- header: nome e volto fermi, niente tavola né 3d, niente etichette delle fasi; all’uscita dell’header il nome passa direttamente al formato piccolo fisso
- portfolio: scena 3d ferma davanti al computer già acceso, subito utilizzabile; niente avvio né sfarfallio del tubo
- chi sono: testo tutto bianco da subito e avatar fermo (primo fotogramma del video a punti, `public/avatar/fermo.webp`, nel bianco della palette con righe di scansione statiche)
- contatti: volto già disegnato e sveglio, pulsanti che entrano con una dissolvenza; riempimento nero dei pulsanti in dissolvenza invece del cerchio
- volto: niente battiti, pupille ferme, cambi di stato istantanei; la preferenza aggiorna questi comportamenti anche a sito aperto
- testi che rotolano: diventano dissolvenze
- cursore di sistema (il cursore personalizzato non c’è), grana ferma, magnetismo spento
- preloader: solo dissolvenze di 0,2s
- css (`globals.css`): tutte le transizioni e animazioni css annullate, tranne le dissolvenze (`transition-opacity`, 0,2s)

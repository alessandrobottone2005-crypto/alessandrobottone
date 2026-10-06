# navbar, orientamento e verifiche

La navigazione persistente mostra portfolio, chi sono e contatti dopo l’ingresso. Il nome in alto riporta all’header. I link spostano anche il focus nella sezione di destinazione e hanno un’area touch di almeno 44px.

Il link portfolio raggiunge metà della sosta, accende subito il computer e sincronizza scroll, camera e interfaccia. La stessa destinazione viene usata dai link diretti `/progetti/:slug`. Tornando all’header e poi al portfolio, finestre e computer acceso vengono conservati. Riferimenti: `src/lib/scroll.ts`, `src/sections/Header/Header.tsx`, `src/components/computer/stato.ts`.

## telefono e rotazione

Il Finder occupa la vista sui telefoni, anche con puntatore touch in orizzontale sotto 1024px di larghezza e 500px di altezza. La fascia superiore lascia spazio a nome e navbar, quella inferiore al controllo audio. La rotazione conserva la posizione nella sosta. Desktop e tablet mantengono la cornice del Macintosh attorno all’interfaccia.

Movimento ridotto: scroll nativo e computer acceso; se WebGL fallisce resta il Finder DOM. Nome 3d e qualità della scena vengono aggiornati senza render React a ogni fotogramma; texture e shader si preparano progressivamente. La qualità adattiva interviene sulla risoluzione interna mantenendo gli effetti della scena.

## verifiche ripetibili

La [guida ai controlli](../verifiche/README.md) raccoglie comandi e percorsi dei risultati. `verifica-navigazione` copre navbar, tastiera, finestre, rotazione, rete lenta, link diretto, movimento ridotto e WebGL assente. `verifica-computer` aggiunge tablet e telefono orizzontale, avvio e fallback del modello.

`misura-fluidita` distingue ingresso e scroll; `--computer-acceso` prova anche il ritorno davanti al Finder acceso. `diagnostica-luce` produce confronti della stessa posa per isolare gli effetti della scena. I controlli emulati sul Mac non confermano la resa o le prestazioni di un iPhone fisico; il difetto di luce segnalato su iPhone 14 con iOS 17.0.1 e Chrome richiede una verifica su quel dispositivo. [Misure e limiti](accessibilita-prestazioni.md).

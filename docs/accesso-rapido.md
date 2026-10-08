# Accesso immediato ai lavori

Aggiornamento dell’8 ottobre 2026. Integra e sostituisce le indicazioni precedenti sull’avvio dell’esperienza.

## Flusso

`/` mostra immediatamente nome, posizionamento e due azioni: «vedi progetti» apre `/progetti`; «inizia a scrollare» richiede l’esperienza, avvia l’audio secondo la preferenza memorizzata e raggiunge `/#header` dopo il preloader. Non c’è un secondo clic da compiere dopo il caricamento.

La navigazione della home contiene «progetti», «chi sono», «contatti» e audio. Il Macintosh conserva la cartella «progetti» e le altre applicazioni. Solo l’apertura dal monitor usa l’espansione della finestra.

«Torna al computer» raggiunge `/#portfolio` e accende il computer. «Contatti», in fondo a ciascuna scheda, raggiunge `/#contatti`. Queste azioni esplicite aggiungono una destinazione alla cronologia: indietro può riaprire la scheda precedente. La cronologia conserva separatamente posizione della home, focus del controllo d’origine e scroll della scheda. Il ritorno da una scheda all’archivio conserva filtro, scroll e copertina selezionata.

## Risorse e stato

L’interfaccia dell’archivio è indipendente da `pronto` del preloader. `AvvioContext` distingue richiesta dell’esperienza, preparazione, disponibilità e attività della scena. `Esperienza` è un modulo differito: sala, computer, nome e logo 3D non vengono richiesti dalla schermata iniziale o dall’archivio diretto. Anche l’audio non parte con i clic sui progetti.

Dopo la richiesta, la home rimane montata. Con archivio o ingresso iniziale davanti, i Canvas decorativi passano a `frameloop="never"`; i ticker del nome, il pianificatore dei glitch e il nascondino rispettano lo stato di attività. I modelli dei progetti hanno un lifecycle indipendente. Il ritorno riattiva i Canvas esistenti e conserva le applicazioni del Finder.

PDF, modelli e video si attivano quando il relativo blocco si trova entro circa un’altezza del contenitore di lettura. Dopo l’attivazione il PDF rimane montato fino all’uscita dalla scheda; vengono liberati solo i canvas delle pagine lontane. La cronologia può riattivare i blocchi per ricostruire l’altezza necessaria a ripristinare una posizione profonda. Le immagini conservano le dimensioni già lette e vengono caricate durante il ripristino delle gallerie, così lo scroll non si ferma sulle altezze provvisorie. Una nuova interazione di scroll interrompe il ripristino in attesa.

In Cuphead il modello precede il PDF. Gli altri ordini, gli originali, lo schema e i testi dei progetti sono invariati. Non sono state estratte anteprime WebP aggiuntive.

## Testi

Le [nove bozze](bozze-schede-progetti.md) sono un documento di revisione separato e non vengono importate dall’applicazione. Le attribuzioni mancanti o ambigue restano esplicite nel documento, senza inventare ruoli o risultati.

## Verifiche

- `node scripts/verifiche/verifica-accesso-rapido.mjs`: ingresso, risorse, cronologia, contatti, ripristino di schede lunghe e pausa dei Canvas.
- `node scripts/verifiche/verifica-archivio.mjs`: filtri, nove lavori, immagini, PDF, app del Macintosh, tastiera e dimensioni.
- `node scripts/verifiche/verifica-materiali-archivio.mjs`: errori e riprova, documenti lunghi, modello.
- `node scripts/verifiche/verifica-tastiera-archivio.mjs`: ingrandimento da tastiera e fallback WebGL.
- `node scripts/verifiche/misura-accesso-rapido.mjs`: richieste, byte trasferiti e chiamate di disegno, con 15 secondi di assestamento e 2 di campionamento per ogni ingresso.
- `npm run lint` e `npm run build`: controlli statici, validazione dei contenuti e compilazione.

I rapporti sono in `verifiche/risultati/`. Le prove telefono e tablet usano emulazione Chrome, non Safari su iPhone reale. Le misure dei trasferimenti e delle chiamate di disegno sono locali, a cache fredda e con la stessa finestra di osservazione; non sono una promessa di tempi di apertura o risparmio energetico. Nessun intervento sugli shader iOS e nessuna pubblicazione.

## Esito del confronto locale

Campioni dell’8 ottobre 2026, build locale, Chrome 1440×900, profili nuovi per ogni visita. Stesse attese (15 s + 2 s) prima e dopo. Sono byte trasferiti delle risorse osservate, inclusi header; non dimensioni dei file originali né tempi di apertura su rete mobile.

| Ingresso | Prima | Dopo | Canvas prima / dopo |
|---|---:|---:|---:|
| `/` | 9.785.842 byte, 36 richieste | 276.241 byte, 14 richieste | 2 / 0 |
| `/progetti` | 10.787.312 byte, 45 richieste | 1.300.723 byte, 24 richieste | 2 / 0 |

Nel campione precedente l’archivio diretto produceva 5.610 chiamate di disegno in 2 secondi; nel campione aggiornato ne produce zero. Il test di navigazione controlla inoltre zero chiamate sotto l’archivio dopo aver già aperto la scena e verifica che i suoi canvas rimangano montati.

Riferimenti: `verifiche/risultati/accesso-rapido/confronto.json` e `risultati.json`. Build e lint completati; Vite continua a segnalare chunk oltre 500 kB, ora separati per funzione e caricati su richiesta. I risultati mobili sono emulati e non certificano Safari/iPhone.

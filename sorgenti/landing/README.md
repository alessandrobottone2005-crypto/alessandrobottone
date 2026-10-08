# scena Blender della landing

LANDING COMPLETA · alessandro bottone

SCENA
Stessa sala, stessa postazione Macintosh e logo V2 della landing.
Oggetti e texture originali conservati; tutte le immagini effettive incorporate.
Camere e compositing sono tarati per la resa web, con render Cycles.

CAMERE
01: postazione ampia, attiva all'apertura. 02: monitor. 03: sala generale.
04: vista dall'alto. 05: header. 06: confronto 976x1072.
Seleziona una camera e Ctrl+Numpad0 per renderizzare da quella camera.
Le camere non sono animate: scegli liberamente le tue inquadrature.

SCHERMO
Seleziona CTRL SCHERMO, Proprietà oggetto > Proprietà personalizzate.
stato: 0 spento, 1 avvio, 2 disturbo, 3 desktop, 4 illustrazione,
5 branding, 6 3d, 7 paint, 8 scacchi, 9 progetto lorenzo.
Per uno stato manuale, scollega prima l'azione del CTRL SCHERMO nell'Action Editor.
L'azione rimane conservata: schermo · avvio e interfacce reali.
fotogramma_avvio: 0–109. luminosita: indipendente dalla sequenza.
La sequenza di avvio è acquisita dal sito a intervalli reali e normalizzata a 24fps;
le prime schermate hanno la risoluzione dell'inquadratura larga durante lo zoom.
L'atlante è un'immagine incorporata: non richiede video o PNG esterni.

LOGO
Seleziona CTRL LOGO: posizione, orientamento e scala muovono insieme il logo e i fari.
Le proprietà battito, occhiolino, sorriso, sonno, sguardo_x e sguardo_y
pilotano le shape key e le pupille. I driver sono semplici, senza script auto-run.
NLA: clip riutilizzabili logo · battito, occhiolino, sorriso, sonno e risveglio, sguardo.
Per impostare espressioni manualmente, silenzia le tracce NLA del CTRL LOGO.
La camera ampia riproduce il logo sporgente sopra il monitor, nelle dimensioni del sito.
La posizione resta fisica nella stanza cambiando camera: il sito invece ricompone
il logo in spazio schermo a ogni posa. Per altre viste puoi riposizionare CTRL LOGO.

RENDER
1920x1080, 24fps, Cycles, AgX, 128 campioni con denoising.
Timeline dimostrativa 1–432, libera da modificare. Il file apre sul desktop (frame 150).
Sole arancione, cemento PBR, pavimento bagnato, nebbia leggera, 9000 granelli.
Fari collegati soltanto al logo; sole collegato a stanza e postazione.
Per togliere la polvere o il volume dal render, nascondi la collezione atmosfera.

CREDITI
Postazione: Macintosh 128K, kreems, CC BY 4.0.
https://sketchfab.com/3d-models/macintosh-128k-896ea439b67b4606a23fb8b93be6af6d
Modifiche derivate dal sito: marchi rimossi, CRT adattato, scala e orientamento.
Sala: Brutalism Scene Baked, abhayexe, Free Standard Sketchfab, con attribuzione.
https://sketchfab.com/3d-models/brutalism-scene-baked-93ba334484ca44058f6dde30a3d4f066
Cemento: Modular Concrete Interior (CC0). Metallo: ambientCG Metal032 (CC0).
ChicagoFLF: Robin Casady, dominio pubblico. Logo, interfacce e progetti: Alessandro Bottone.

## anteprime e verifica finale

Verificato il 7 ottobre 2026 in Blender 5.2.2 LTS: 43 controlli superati su
geometrie, camere, interfacce, espressioni e driver. Le 25 immagini utilizzate
sono incorporate. Una copia del solo `.blend` è stata riaperta in una cartella
temporanea separata e ha prodotto un render del monitor senza risorse mancanti.

- [Postazione ampia, 1920×1080](anteprime/postazione-ampia.png)
- [Monitor con la cartella branding, 1920×1080](anteprime/monitor-branding.png)
- [Sala generale, 1920×1080](anteprime/sala-generale.png)
- [Confronto nel formato della landing](anteprime/confronto-landing.png)
- [Controlli finali](verifica-finale.json) e [prova di portabilità](verifica-portabilita.json)

Le geometrie, le proporzioni e le trasformazioni provengono dai sorgenti della
landing. La luce e il compositing sono tarati per Cycles: il risultato conserva
differenze di resa rispetto agli effetti del motore web e non è identico pixel
per pixel. Il logo resta un oggetto fisico nella stanza quando cambi camera;
il sito ne adatta anche la posizione allo spazio dello schermo.

La cartella `scripts/` conserva gli strumenti di assemblaggio e verifica.
`costruisci_landing.py` rigenera la scena dai sorgenti e sovrascrive il file di
destinazione: conserva una copia prima di usarlo su una scena modificata.

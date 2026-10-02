# ambiente 3d: la sala di cemento

Dal 1 ottobre 2026 l’ambiente è una sala di cemento realistica (`sorgenti/sala/`), al posto della greybox brutalista. Header, computer, biografia e contatti sono punti diversi della stessa sala. Il logo resta quello della V2 (`sorgenti/logo-3d/Logo3DAnimabile_MetalloGrezzo_V2.blend`), con i suoi tre fari.

## percorso

La camera reale resta ferma (campo 40°, a 8,7 u dal piano del volto, così il volto ha la stessa misura di prima). Il mondo (sala e computer, `Mondo.tsx`) riceve la trasformazione inversa di una camera virtuale (`components/computer/inquadratura.ts`):

- header: in fondo alla sala, guardando la parete con la colonna di luce;
- discesa: la camera arretra e si alza, il computer appare a terra nel fascio di sole della fessura, poi scende fino allo schermo; il volto va dietro il monitor, coperto dal buffer di profondità ([computer](computer.md#il-volto-dietro-il-computer));
- biografia: si gira verso la parete sinistra in ombra; la metà destra resta scura per il testo;
- contatti: dall’inizio della sala si vede tutta la sua lunghezza, con il fascio di luce al centro; una sfumatura scura in basso tiene leggibili pulsanti e copyright.

I punti vengono da `src/components/volto/stazioniSala.json`, scritto da `prepara_sala.py` (passo `stazioni`) e copiato da `npm run prepara-sala`. Percorso del computer e interfaccia: [computer](computer.md).

## luce

- **cotta in Blender** (Cycles, rimbalzi completi, ripulita con OIDN): sole stretto e neutro dalla fessura del soffitto + cielo grigio. Pareti 4096, pavimento 2048, su una seconda serie di UV. Nel sito è la `lightMap` dei materiali (`Sala.tsx`, `modelloSala.ts`): la luce diffusa di pareti e pavimento viene solo da lì.
- **in tempo reale** soltanto per ciò che si muove: un sole direzionale con ombre morbide su computer e tastiera (il volto ne è escluso e resta illuminato dai suoi fari), un piano che raccoglie l’ombra del computer, il bagliore dello schermo.
- **riflessi**: il cemento riflette un ambiente generato una volta sola dalla sala stessa (PMREM); il pavimento è cemento bagnato con riflessi veri (`MeshReflectorMaterial` di drei), sfocati sull’asciutto e più netti nelle chiazze bagnate, con effetto Fresnel. Riflette anche computer e volto.
- colori: cemento quasi grigio (8% del colore originale) verso la palette; computer beige e copertine risaltano.

## rifinitura (post-produzione)

`Rifinitura.tsx`, con `postprocessing` e `@react-three/postprocessing`. È anche il render finale del Canvas: un solo disegno della scena.

| effetto | ruolo |
|---|---|
| N8AO | occlusione ambientale: contatto tra computer e pavimento, angoli dei pilastri |
| `NebbiaVolumetrica.tsx` | passaggio a risoluzione ridotta (metà, poi meno con la qualità adattiva) e ricomposizione a piena risoluzione; fino a 32 campioni per raggio con sfalsamento a rumore intercalato: alone leggero attorno al volto e pulviscolo nel fascio della fessura, bordi del fascio più netti (`cinema.nettezzaFascio`) |
| profondità di campo | `DepthOfFieldEffect`: fuoco sul volto, poi sullo schermo del computer durante la discesa e la sosta, poi di nuovo sul volto; bokeh ridotto ai livelli bassi di qualità |
| Bloom + alone | bagliore sulle zone più luminose e un secondo bagliore largo e tenue (halation) |
| striscia anamorfica | `effettiCinema.ts`: striscia orizzontale appena fredda sulle luci forti, letta dalla texture dell’alone |
| Vignette, AgX | vignetta e tone mapping; il renderer non applica AgX una seconda volta |
| colore | `effettiCinema.ts`: bianco e nero noir (curva gamma 1,35, neri chiusi sotto 0,015, vignetta 0,68) con colore selettivo: resta solo l’arancione della luce della fessura (tonalità 24° ±26°, croma > 0,12). Schermo del computer, nome e UI restano fuori perché non sono nella scena |
| sole arancione | `cinema.sole.colore` #ff7a24: `Sala.tsx` tinge la luce cotta dentro il fascio (stesso test geometrico del volume), il sole tinge il computer, la polvere è arancione; volume e riflessi della sala restano quasi neutri, così il volto resta in b/n |
| glitch | `EffettoGlitch` (`effettiCinema.ts`): passaggio a sé subito dopo l’occlusione, acceso solo durante un glitch della camera o del logo (bande, blocchi, sdoppiamento rgb poi ridotto dal colore noir); a riposo spento ([glitch](animazioni.md#glitch)) |
| aberrazione, grana | aberrazione cromatica lieve verso i bordi; grana pellicola animata dopo la tonalità. Il velo CSS `.grana` si spegne quando la scena 3d è visibile (`html[data-grana-webgl]`) |

Nella sala, `PolvereNelFascio.tsx`: ≈ 9000 granelli finissimi (1–2 px) dentro il fascio di sole (un terzo attorno al computer), fluttuano lenti e scintillano pochi alla volta; niente dischi sfocati. Il volume usa un rumore ad alta frequenza con soglia: grana fine invece di velature. La camera respira come su uno steadicam (`CameraImmersiva.tsx`), ferma davanti allo schermo per tenere l’interfaccia allineata al vetro. Tutti i numeri sono in `cinema.ts`.

Parametri di prova in sviluppo: `?ambiente=0` (senza sala), `?effetti=0` (senza post-produzione), `?senza=ao,nebbia,bagliore,vignetta,fuoco,polvere,alone,striscia,colore,aberrazione,grana,respiro,glitch`, `?polvere=0.02` (densità del pulviscolo nel volume, predefinita 0,008), `?qualita=0..3` (livello di qualità fisso).

**Qualità adattiva** (`qualita.ts`, `PerformanceMonitor` di drei): stessa scena e stessi effetti su ogni dispositivo; se i fotogrammi non stanno nei 60fps scendono in ordine la risoluzione e i passi della nebbia, la risoluzione del riflesso del pavimento e il DPR (1,5 → 1,25 → 1), e risalgono quando c’è margine. **Preriscaldamento** (`riscaldamento.ts`): appena sala, computer e avatar sono scaricati, mentre il Canvas è ancora invisibile, si compilano tutti gli shader, le texture salgono sulla GPU e si disegnano alcuni fotogrammi: il passaggio al 3d e l’arrivo dell’avatar non scattano più. La mappa d’ombra del sole si disegna una volta (sala e computer si muovono insieme alla luce), a ogni fotogramma si aggiorna solo la sua matrice. Con movimento ridotto: stessa sala e stessi effetti, volume e polvere fermi, niente respiro.

## computer

- `Computer.glb` (originale in `sorgenti/computer/`) è ottimizzato in `public/computer/computer.glb` (≈ 1 MB) con `npm run prepara-computer`.
- Poggia dove la luce della fessura tocca il pavimento, scala ×4, vetro rivolto verso l’inizio della sala.

## file da regolare

- `sorgenti/sala/scripts/prepara_sala.py`: scala, materiali, sole, stazioni e cottura ([sorgenti della sala](../sorgenti/sala/README.md)).
- `src/components/computer/inquadratura.ts`: percorso della camera virtuale tra le stazioni.
- `src/components/volto/Sala.tsx`, `modelloSala.ts`, `luceSala.ts`: materiali, lightmap, pavimento bagnato, sole in tempo reale.
- `Rifinitura.tsx` e `NebbiaVolumetrica.tsx`: effetti, polvere e nebbia.
- `LuciTeatro.tsx`: fari del volto. `Volto3D.tsx`: viso, espressioni e composizione della scena.

Le geometrie/materiali dei modelli restano nella cache del caricatore; materiali, luci e render target locali vengono liberati allo smontaggio. Se la sala non si carica, la scena resta nel nero con volto e computer; se il 3d fallisce, rimangono il volto SVG e l’interfaccia del computer.

## peso

`public/sala/`: `sala.glb` 4,45 MB (texture WebP 2048, Meshopt) + luce cotta 0,16 MB = 4,6 MB, scaricati dopo il preloader. Le librerie di post-produzione sono nel codice della scena 3d, non nel bundle iniziale (≈ 207 kB gzip).

## verifica — 1 ottobre 2026

Build e lint superati. Chrome headless (GPU Metal, Mac con chip M5) a 1440×900 e 390×844, più tablet 820×1180 per il computer: header, discesa, sosta, biografia, contatti, movimento ridotto. Discesa con scroll continuo: 60 fps medi a 1440×900 (95° percentile 20 ms) e 59 fps a 390×844 (viewport emulato). Sono misure locali su un computer veloce: non valgono per un telefono reale, da provare.

## esportazione del logo

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b sorgenti/logo-3d/Logo3DAnimabile_MetalloGrezzo_V2.blend --python sorgenti/logo-3d/scripts/export_v2_web.py
node_modules/.bin/gltf-transform optimize sorgenti/logo-3d/Logo3DAnimabile_V2_Web.glb public/volto/logo-metallo-v2.glb --flatten false --join false --instance false --simplify false --compress meshopt --texture-compress webp --texture-size 1024
```

L’esportazione prende solo la gerarchia del logo, con shape key e posa neutra degli occhi; volume e luci vengono ricostruiti nel sito. Le espressioni restano interattive. La GLB compressa pesa circa 872 kB.

Riferimenti tecnici: [luci d’area](https://threejs.org/docs/pages/RectAreaLight.html), [buffer di profondità](https://threejs.org/docs/pages/DepthTexture.html), [render target](https://threejs.org/manual/pages/rendertargets.html).

## storico: verifica della spirale — 28 settembre 2026

La spirale descritta qui è stata sostituita dal computer il 1 ottobre 2026.

Build TypeScript/Vite e lint completati. Verifica nel browser a 1440×900, 820×1180 e 390×844: geometrie e camera, griglia 3/2/1 senza overflow orizzontale, espansione di una sola card, apertura e chiusura del pannello, ritorno alla spirale e all’header. L’allineamento delle venti pose alle card HTML prima dello scambio è entro la precisione numerica. Il cambio a movimento ridotto smonta il Canvas e lascia tutti i venti progetti utilizzabili. Nessun errore nel caricamento e percorso finali; l’utility delle normali è inclusa nell’ottimizzazione iniziale di Vite per evitare ricaricamenti delle dipendenze durante lo sviluppo. Restano gli avvisi già presenti sui bundle grandi. Le dimensioni mobili sono simulate nel browser, non costituiscono una misura di prestazioni su un telefono fisico.

## manutenzione — 29 settembre 2026

Allora il componente di scroll era `Spirale.tsx` in `src/sections/Portfolio/`, con l’id ScrollTrigger `portfolio-anello`; entrambi sono stati rimossi il 1 ottobre 2026 con il passaggio al computer (oggi `Portfolio.tsx`, id `portfolio-computer`). La pila mobile e le misure della vecchia card header sono state eliminate perché non usate. La home usava già la V2: copie pubbliche del modello V1 e dell’HDRI rimosse, sorgenti conservati fuori dal runtime. Debugging e controlli correnti sono descritti in [accessibilità e prestazioni](accessibilita-prestazioni.md) e [pubblicazione](pubblicazione.md).

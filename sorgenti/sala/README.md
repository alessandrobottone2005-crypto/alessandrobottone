# sala di cemento

`Ambiente.glb` è il modello originale (18 MB, Sketchfab): una sala di cemento 20 × 29 m con pilastri, mensole e una fessura di luce nel soffitto. Ha la luce già dipinta in un’unica texture e un finto specchio d’acqua (sala capovolta sotto il pavimento). Non va modificato dagli script.

## come si rigenera

```sh
# 1. scena realistica, anteprime Cycles, cottura della luce (≈ 3 minuti su GPU Metal), esportazione
/Applications/Blender.app/Contents/MacOS/Blender -b --python sorgenti/sala/scripts/prepara_sala.py -- costruisci anteprime cuoci esporta
# 2. versione web in public/sala/ (≈ 4,6 MB) e punti del racconto in src/components/volto/stazioniSala.json
npm run prepara-sala
```

Passi di `prepara_sala.py` (si possono lanciare anche uno alla volta):

- `costruisci`: toglie il finto specchio, scala ×2,5 (la sala diventa 50 × 72 × 23 u), pavimento nuovo, UV «cemento» (proiezione in metri) e «luce» (per la cottura), cemento PBR CC0 reso quasi grigio verso la palette, pavimento con chiazze bagnate (rugosità bassa), sole stretto dalla fessura e cielo grigio. Salva `Sala_Realistica.blend`.
- `stazioni`: riscrive soltanto i punti del racconto (header, computer, biografia, contatti) senza ricuocere.
- `anteprime`: render Cycles delle stazioni in `anteprime/`.
- `cuoci`: luce diffusa (diretta + rimbalzi) cotta su pareti (4096) e pavimento (2048), ripulita con OIDN.
- `esporta`: `export/Sala_Web.glb` (UV0 cemento, UV1 luce) e lightmap in PNG con un fattore comune salvato in `stazioni.json`.

Il segnaposto del computer (cubo nascosto) sta dove la luce della fessura tocca il pavimento: lì il sito appoggia la postazione Macintosh (`public/computer/computer.glb`).

`export/*.exr`, `export/Sala_Web.glb` e `textures/` sono rigenerabili e non vanno su GitHub.

## materiali

Cemento di pareti e pavimento: pacchetto «Modular Concrete Interior» in `sorgenti/ambiente/assets_online/` (CC0, texture da texturehaven.com e cc0textures.com).

## licenza

`Ambiente.glb` proviene da Sketchfab: **[Brutalism Scene Baked](https://sketchfab.com/3d-models/brutalism-scene-baked-93ba334484ca44058f6dde30a3d4f066)** dell’autore **[abhayexe](https://sketchfab.com/abhayexe)** (pubblicato il 13 maggio 2026, 2.100 triangoli). Licenza: **Free Standard** (uso con attribuzione).

I crediti ufficiali con il link sono registrati in `src/config/sito.ts` (`sito.computer.crediti.ambiente` e `ambienteLink`) e compaiono nella finestra «informazioni» del computer nel portfolio.

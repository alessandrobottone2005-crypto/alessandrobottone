# logo originale

File del logo forniti da alessandro, conservati come riferimento. Il sito non li carica.

- `Logo.svg`: logo vettoriale originale (forme espanse). Il volto del sito è ricostruito a tratti da questo file in `src/components/volto/geometria.ts`; le favicon vettoriali di riserva si generano dalla stessa geometria con `npm run genera-favicon` in `favicon-svg/` (il sito usa quelle dal render 3d, `npm run genera-favicon-3d`).
- `favicon-svg/`: favicon vettoriali usate nel sito fino al 2 ottobre 2026, ora riserva non pubblicata.
- `Logo.glb`: primo modello 3d fornito (una sola mesh unita). Superato dal logo Blender animabile in `../logo-3d/` (la copia web in uso è `public/volto/logo-metallo-v2.glb`).

Fino al 26 settembre 2026 stavano in `public/`; poi in `sorgenti/`, dal 2 ottobre 2026 in questa cartella.

# postazione Macintosh del portfolio

Il portfolio usa l’unica postazione scelta da Alessandro: **Macintosh 128K con scrivania completa** (monitor, tastiera, mouse, cavi, libri, fogli, post-it e portamatite). Il modello originale resta intatto.

| file | provenienza e uso |
|---|---|
| `originali/ScrivaniaComputer.glb` (6,68 MiB) | [Macintosh 128K](https://sketchfab.com/3d-models/macintosh-128k-896ea439b67b4606a23fb8b93be6af6d), **kreems**, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); originale della postazione attuale |
| `export/Postazione.glb` | derivato intermedio rigenerabile, escluso da Git e deploy |
| `../../public/computer/computer.glb` | versione web Meshopt, texture WebP ≤1024 px, 1.108.492 byte (1,06 MiB), 45.425 triangoli |

Autore e licenza sono stati verificati il 6 ottobre 2026 tramite l’API pubblica Sketchfab. Fonte e crediti della sala sono in [sorgenti della sala](../sala/README.md).

## rigenerazione

`npm run prepara-computer` legge l’originale in `originali/` e produce il derivato intermedio, il GLB web e `src/components/computer/misureComputer.json`: ingombri di postazione, monitor, mouse e tastiera; quattro angoli del vetro e scala.

Le parti con marchi Apple vengono suddivise lungo i rettangoli UV del marchio; solo quelle superfici ricevono un materiale neutro campionato accanto. Il foglio con la mela diventa neutro e il logo del post-it viene tolto conservandone il testo. Le texture fotografiche e gli accessori restano intatti. Il CRT e il pannello retrostante ricevono materiali scuri senza emissione; il contenuto originale «hello» non compare. Avvio e Finder restano quelli del sito.

Il derivato ha origine a pavimento e il monitor rivolto verso −x. Scala ×2,634177 e rotazione Y di 90° danno una postazione alta 3,1 u nel punto «computer» della sala. I quattro angoli del vetro sono calibrati davanti alla curvatura del tubo e condivisi da DOM, bagliore e luce. Le misure JSON si rigenerano dallo script, senza modificarle a mano.

`ComputerNellaScena.tsx` seleziona il mouse dai triangoli nell’ingombro misurato prima dell’ottimizzazione. L’inquadratura larga include tutta la scrivania; quella vicina guarda lungo la normale del vetro. Il volto usa solo l’ingombro del Macintosh per profondità e nascondino.

## attribuzione e controlli

La finestra «informazioni» riporta **kreems**, link Sketchfab, licenza CC BY 4.0 e modifiche (marchi rimossi, schermo adattato, ottimizzazione web), da `src/config/sito.ts` → `computer.crediti`.

Build, lint e flussi del computer sono descritti nella [guida alle verifiche](../../verifiche/README.md); misure e limiti in [computer](../../docs/computer.md). Screenshot e report stanno in `verifiche/risultati/`, fuori da Git.

## scelta definitiva — 6 ottobre 2026

Su richiesta esplicita di Alessandro sono eliminati `Computer.glb` (vecchio PC, provenienza non recuperata) e `Macintosh.glb` (Classic alternativo). Rimangono soltanto l’originale della scrivania scelta e la sua versione web. Il vecchio PC già registrato rimane recuperabile dalla cronologia Git; non è più presente nel progetto corrente.

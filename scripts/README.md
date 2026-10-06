# strumenti del progetto

Eseguire i comandi `npm run …` dalla radice: i nomi dei comandi restano stabili anche se gli script vengono riordinati.

| percorso | ruolo |
|---|---|
| `prepara-*.mjs` | ottimizzazione di computer, sala, progetti, avatar e audio |
| `genera-*.mjs` | favicon, nome in metallo e immagine social |
| `nuovo-progetto.mjs`, `valida-progetti.ts` | creazione e validazione dei contenuti; il validatore è usato dalla build Vite |
| `comprimi-pdf.swift`, `foto-palette.mjs` | conversione locale di materiali creativi |
| `blender/` | esportazioni da Blender |
| `verifiche/` | controlli di navigazione e computer, misure di fluidità, diagnostica della luce |
| `lib/chrome.mjs` | avvio e controllo Chrome via CDP condiviso dalle verifiche |

Per l’elenco dei comandi vedere il [README principale](../README.md); per controlli e risultati vedere [verifiche](../verifiche/README.md). Gli script browser richiedono Chrome già installato su macOS e non entrano nel deploy.

# verifiche locali e online

Gli script sono in `scripts/verifiche/`; Chrome viene controllato con il helper comune in `scripts/lib/chrome.mjs`. Screenshot e JSON sono raccolti in `risultati/`, esclusa da Git e Vercel. I risultati delle sessioni precedenti sono stati spostati qui senza eliminarli.

```sh
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
```

Con la preview aperta, da un altro terminale:

```sh
npm run verifica-navigazione -- http://127.0.0.1:4173/
npm run verifica-computer -- http://127.0.0.1:4173/
MISURA_OUTPUT=verifiche/risultati/fluidita-telefono.json npm run misura-fluidita -- http://127.0.0.1:4173/ telefono --computer-acceso
npm run diagnostica-luce -- http://127.0.0.1:4173/
```

| comando | copertura |
|---|---|
| `verifica-navigazione` | navbar, focus, finestre, link diretto, rotazione, rete lenta, movimento ridotto e WebGL assente |
| `verifica-computer` | GLB, appoggio, altezza, texture, mouse, accensione con monitor/mouse/Invio, Finder, ritorno e modello assente |
| `misura-fluidita` | ingresso e scroll, anche con Finder già acceso; telefono = viewport 390×844 e CPU rallentata 4× |
| `diagnostica-luce` | confronti fotografici della stessa posa con gli effetti esclusi a scopo diagnostico |

I primi due comandi e la diagnostica accettano anche una cartella di destinazione come argomento dopo l’URL. Per i controlli online sostituire l’URL con il dominio pubblico e scegliere una cartella distinta, per esempio `verifiche/risultati/produzione/computer`.

L’emulazione mobile conserva la GPU del Mac e non equivale a misure su telefono fisico. I risultati delle pubblicazioni sono in [pubblicazione](../docs/pubblicazione.md).

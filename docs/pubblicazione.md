# pubblicazione

## repository e ambiente

- [Repository GitHub](https://github.com/alessandrobottone2005-crypto/alessandrobottone) (rinominato il 2 ottobre 2026 da `ProvaLandingPagePortfolio_Claude`; i vecchi link reindirizzano).
- Progetto Vercel: `alessandrobottone` (rinominato da `provalandingpageportfolio-claude`), team ABDesign (`abd-esign1`), Vite e Node 24.
- [Dominio di produzione](https://alessandrobottone.vercel.app); il vecchio [provalandingpageportfolio-claude.vercel.app](https://provalandingpageportfolio-claude.vercel.app) resta attivo. Le righe sotto conservano gli indirizzi storici com’erano.
- Branch di produzione: `main`; il 6 ottobre 2026 integra anche `prova/audio-computer` e la postazione Macintosh definitiva. Il 1 ottobre 2026 vi è stato fuso `prova/computer-retro` (computer retrò, sala di cemento, avatar a punti, volto dietro il computer); il 2 ottobre 2026 `prova/nome-3d-schermo` (nome in metallo 3d, schermo realistico, scena noir, primi progetti veri).
- Branch storico: `codex/manutenzione-portfolio-3d`, da cui è stata pubblicata la versione del 29 settembre 2026.

## pubblicazione del 6 ottobre 2026 — postazione Macintosh definitiva

Autorizzata da Alessandro in chat: tenere la scrivania con Macintosh 128K, eliminare gli altri due computer, riordinare cartelle e file, aggiornare `main` su GitHub e pubblicare su Vercel. Il ramo `prova/audio-computer` è stato integrato in `main` con fast-forward, includendo il lavoro precedente su audio, app, navigazione e prestazioni.

| voce | esito verificato |
|---|---|
| commit del codice | [`8d4142a`](https://github.com/alessandrobottone2005-crypto/alessandrobottone/commit/8d4142ae0ddb73424b1f53e22ca1395f2cfb7dfe), push `29ae3b1..8d4142a` su `main` riuscito |
| modello definitivo | solo Macintosh 128K con scrivania; originale intatto in `sorgenti/computer/originali/ScrivaniaComputer.glb`, web in `public/computer/computer.glb`; PC precedente e Classic alternativo eliminati dal progetto corrente |
| attribuzioni | autore, link originale, licenza e modifiche del computer; autore, link originale e licenza della sala; verificati nella finestra informazioni online |
| riordino | strumenti browser in `scripts/verifiche/`, helper in `scripts/lib/`, screenshot e report in `verifiche/risultati/` esclusi da Git/deploy; indici in docs, sorgenti, scripts e verifiche; link interni corretti |
| controlli locali | lint e build riusciti, rigenerazione dal nuovo percorso identica alla build; asset e sette flussi del computer, sette flussi di navigazione superati |
| deploy di produzione | `READY`, 6 ottobre 2026 alle 10:50 (Europe/Rome); avviato dall’integrazione Git al push su `main` |
| versione immutabile | [alessandrobottone-bb3fcy12d-abd-esign1.vercel.app](https://alessandrobottone-bb3fcy12d-abd-esign1.vercel.app) |
| dominio pubblico | [alessandrobottone.vercel.app](https://alessandrobottone.vercel.app); vecchio dominio ancora collegato |
| deployment e durata | `dpl_HB7xiVjJiVDgQdPXb6S4nD5ic8TP`; 54 secondi di build, Vite/Node 24 |
| verifiche online | 123 rotte e asset in HTTP 200 (home, nove progetti, rotta inesistente e asset statici/chunk individuati dalla build pubblicata); GLB del computer identico via SHA-256, 1.108.492 byte; sette flussi computer e sette navigazione superati su desktop/tablet/telefono, anche orizzontale, movimento ridotto, WebGL/modello assente e rete lenta |
| applicazioni online | scacchi: apertura, mossa e risposta dell’avversario; paint: apertura e tela; nessuna eccezione runtime inattesa |
| limite già presente | nessuna variabile Google Drive configurata in produzione; `GET /api/dediche` restituisce 503 `non-configurato` e l’interfaccia segnala che le dediche non sono ancora attive; guida in [dediche](dediche-google-drive.md) |
| limiti delle prove | viewport mobile emulata sul Mac; non verificati telefoni fisici, Safari/Firefox o Lighthouse |

Report JSON e anteprime locali/online in `verifiche/risultati/pubblicazione-6-ottobre/` (fuori da Git). La registrazione degli esiti è un commit successivo di sola documentazione; il codice verificato resta quello indicato sopra. La build mantiene l’avviso Vite sui chunk oltre 500 kB, senza errori.

## pubblicazione del 2 ottobre 2026

Richiesta da alessandro in chat il 2 ottobre 2026: aggiornare il repository GitHub e il sito su Vercel. Come il 1 ottobre, **i crediti CC BY del computer e della sala restano segnaposto** (la build mostra i due avvisi; da completare in `src/config/sito.ts`, `computer.crediti`).

| voce | stato |
|---|---|
| merge in `main` e push GitHub | fast-forward di `prova/nome-3d-schermo` in `main`, push riuscito (`975aa0f..87d70a5`); pubblicato anche il branch `prova/nome-3d-schermo` |
| commit pubblicato | `87d70a5` (debugging, pulizia del codice e riordino dei sorgenti), che include `d2e6943` (nome in metallo 3d, schermo realistico, scena noir e primi progetti veri) |
| controlli prima del push | `npm run lint` senza segnalazioni, `npm run build` riuscita; preview locale in Chrome headless 1440×900 e 390×844 senza errori né risorse mancanti |
| deploy production (stato, data e ora) | `READY`, 2 ottobre 2026 alle 13:35 (ora italiana), avviato dall’integrazione Git di Vercel al push su `main` |
| URL immutabile della versione | https://alessandrobottone-rk3cskh8o-abd-esign1.vercel.app |
| alias pubblico | https://alessandrobottone.vercel.app |
| deployment e durata della build | `dpl_6B8gayBQHgHWLFnRidQmqTPdoBJx`, build 30s |
| verifica online | `/`, le nove rotte `/progetti/<slug>` e uno slug inesistente in 200; GLB di volto, computer, sala e cuphead, luci cotte, avatar, i quattro pdf, contorni del nome, `og.png` e `robots.txt` in 200; `og:url`/`og:image` sul nuovo dominio. Chrome headless desktop 1440×900 e telefono 390×844: link diretto apre le finestre di lorenzo, cuphead (con modello 3d) e inktober nel computer, slug inesistente torna a `/`, scroll fino al copyright, nessun errore in console né risorse mancanti. Non verificati: dispositivi fisici, Safari/Firefox, Lighthouse |

## pubblicazione del 1 ottobre 2026

Autorizzata da alessandro in chat il 1 ottobre 2026: merge di `prova/computer-retro` in `main`, push su GitHub e deploy Vercel in produzione. **Per sua scelta esplicita la pubblicazione avviene con i crediti CC BY del computer e della sala ancora segnaposto** (rischio accettato): la build mostra due avvisi e i crediti restano da completare in `src/config/sito.ts` (`computer.crediti`), vedi [sorgenti del computer](../sorgenti/computer/README.md) e [sorgenti della sala](../sorgenti/sala/README.md).

| voce | stato |
|---|---|
| merge in `main` e push GitHub | fast-forward di `prova/computer-retro` in `main`, push riuscito (`d889e56..47bffee`); pubblicato anche il branch `prova/computer-retro` |
| commit pubblicato | `47bffee` (computer retrò, sala di cemento, avatar e volto che sbuca dietro il monitor) |
| deploy production (stato, data e ora) | `READY`, 1 ottobre 2026 alle 21:00 (ora italiana), avviato dall’integrazione Git di Vercel al push su `main` |
| URL immutabile della versione | https://provalandingpageportfolio-claude-9qxw01f9n-abd-esign1.vercel.app |
| alias pubblico | https://provalandingpageportfolio-claude.vercel.app |
| deployment e durata della build | `dpl_43znGWQMaHWDvvDkMmHvXgn9hhk8`, build 39s |
| verifica online | rotte `/`, `/progetti/segnaposto-05` e slug inesistente in 200; GLB di volto, computer e sala, luci cotte, avatar, `og.png` e `robots.txt` in 200. Chrome headless desktop 1440×900 e telefono 390×844: link diretto con finestra «progetto 05» aperta nel computer, Esc torna a `/`, scroll fino ai contatti, nessun errore in console né risorse mancanti. Non verificati: dispositivi fisici, Safari/Firefox, Lighthouse |

Da controllare online: discesa al computer, accensione e spegnimento, cartelle e finestre, link diretto e ricarica di `/progetti/<slug>`, volto dietro il monitor e nascondino, biografia con avatar, contatti, movimento ridotto, telefono (viewport) e asset `public/computer/`, `public/sala/`, `public/avatar/` con risposta HTTP 200.

## storico: manutenzione del 29 settembre 2026

L’utente aveva autorizzato creazione/push del branch e deploy in produzione. **Quella versione è stata pubblicata dal branch di manutenzione, senza merge in `main`.**

| voce | stato |
|---|---|
| branch GitHub | [`codex/manutenzione-portfolio-3d`](https://github.com/alessandrobottone2005-crypto/ProvaLandingPagePortfolio_Claude/tree/codex/manutenzione-portfolio-3d), push riuscito |
| commit codice pubblicato | [`6db4e456239ee683268b7a6d0aeb512719bcb108`](https://github.com/alessandrobottone2005-crypto/ProvaLandingPagePortfolio_Claude/commit/6db4e456239ee683268b7a6d0aeb512719bcb108) |
| deploy production | `READY`, 29 settembre 2026, circa 00:08 (Europe/Rome) |
| URL immutabile della versione | [9g7a1ojwa](https://provalandingpageportfolio-claude-9g7a1ojwa-abd-esign1.vercel.app) |
| deployment | `dpl_Hdc8NqEk67VzLRdzBim6bGcdeTXy`, build Vite circa 21s |
| verifica online | superata sul dominio pubblico: spirale 3D, griglia 3/2/1, card e pannello, link diretto/refresh, movimento ridotto; nessun errore browser rilevato |

Prima di quel deploy erano stati completati lint/build e controlli browser locali (desktop e viewport mobile 390px, venti card, griglia, pannello, link diretto/refresh, movimento ridotto). Dopo il deploy erano stati verificati sul dominio pubblico desktop 1440px, tablet 820px e mobile 390px, senza overflow orizzontale; home, rotta progetto, modello V2, immagine social e robots rispondevano HTTP 200. Spirale, griglia, card e pannello sono stati sostituiti dal computer il 1 ottobre 2026. Le prove mobile erano a viewport emulata, non misure Lighthouse né prove su telefoni fisici.

## build e deploy

```sh
npm ci
npm run lint
npm run build
npm run preview
```

La build esegue TypeScript, il plugin di validazione progetti e Vite. Se un file/campo manca, si ferma con un messaggio italiano. L’output è `dist/`; il sito pubblica codice e asset runtime, non le cartelle di lavoro.

Prima del deploy controllare header, discesa al computer, accensione e spegnimento, cartelle e finestre dei progetti, volto dietro il monitor, link diretto, biografia, contatti e movimento ridotto. Dopo commit e push, il progetto locale già collegato può essere pubblicato in produzione con la CLI Vercel (`vercel --prod`). Controllare che il target sia il progetto corretto e annotare l’URL della versione restituita. La CLI aggiorna l’alias pubblico; non modifica né unisce i branch GitHub.

Il push di un branch può generare una preview se l’integrazione Git è attiva. Una preview e un deploy production sono distinti: verificare il target di ogni pubblicazione. Per altre pubblicazioni serve l’autorizzazione prevista nel [brief operativo](../CLAUDE.md).

## rotte e asset

`vercel.json` rimanda le rotte della SPA a `index.html`, mantenendo accessibili gli asset reali. Aprire e ricaricare `/progetti/<slug>` deve portare la home a metà della sosta davanti al computer acceso, con la finestra del progetto aperta, anche su telefono e con movimento ridotto.

`index.html` contiene descrizione, Open Graph e Twitter Card. `og:url` e `og:image` sono già assoluti sul dominio Vercel. Se cambia dominio aggiornare entrambi; se cambia `sito.descrizione`, aggiornare anche le descrizioni HTML. `npm run genera-og` produce `public/og.png` 1200×630 e richiede Outfit TTF installato. `public/robots.txt` permette l’indicizzazione.

## file conservati e file pubblicati

| posizione | GitHub | sito/deploy |
|---|---|---|
| `src/`, configurazioni, lockfile | sì | codice di build e asset importati |
| `public/` | sì | tutti i file della cartella: solo asset necessari |
| `sorgenti/`, scene Blender, texture, render finiti | sì | esclusi dall’upload CLI con `.vercelignore` |
| `docs/`, README e brief | sì | esclusi dall’upload CLI |
| `scripts/verifiche/`, `scripts/lib/` | sì | strumenti locali esclusi dall’upload CLI |
| `verifiche/risultati/` | no | screenshot e report locali esclusi |
| foto originali e `_originali/` dei progetti | conservati | esclusi dall’upload CLI se non importati |
| frame PNG rigenerabili | no | rimossi; rigenerabili dagli script Blender |
| `*.blend1` e altri backup numerati | sul disco, ignorati Git | esclusi |
| `.env*`, `.mcp.json`, impostazioni locali, `.vercel` | esclusi | chiavi/configurazioni locali non pubblicate |
| `node_modules`, `dist`, log, `._*` | esclusi | output ricreati, cache e metadati non caricati |

`.gitignore` governa Git; `.vercelignore` governa l’upload della CLI. Un file incluso nel repository pubblico è consultabile su GitHub anche quando non fa parte del sito. `pubblicato: false` nasconde un progetto, non costituisce accesso riservato ai suoi file.

## checklist di rilascio — 1 ottobre 2026

Da spuntare dopo il deploy, con gli esiti reali.

- [x] merge di `prova/computer-retro` in `main`, push e progetto Vercel corretti
- [x] lint e build completati, lockfile coerente e validazione dei progetti superata (avvisi attesi: crediti di computer e sala)
- [x] desktop/tablet/viewport telefono: discesa, accensione/spegnimento, cartelle, finestre, scroll inverso
- [x] link diretto e refresh di `/progetti/<slug>` verificati nella build e online
- [ ] fallback SVG/DOM e cambio movimento ridotto verificati localmente; movimento ridotto verificato anche online
- [x] testi, link, pulsante email, nome fisso, copyright e asset social controllati
- [x] pubblicazione riuscita, URL immutabile e commit annotati sopra
- [x] contenuti segnaposto dichiarati: i venti progetti e i crediti di computer e sala restano segnaposto per scelta di alessandro
- [ ] misure Lighthouse e prova su Safari iOS/Chrome Android fisici ripetute quando disponibili

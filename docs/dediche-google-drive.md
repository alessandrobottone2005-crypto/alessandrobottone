# dediche su google drive

Le dediche disegnate con «paint» nel computer del portfolio finiscono in una cartella del Google Drive di alessandro. Il sito non parla direttamente con Google: lo fa la funzione Vercel `api/dediche.ts`, che tiene nascoste le chiavi e serve le immagini (la cartella non deve essere pubblica). Nessuna libreria esterna: il codice firma da sé la richiesta a Google con `node:crypto` e usa le API di Drive con `fetch`.

Finché le variabili non sono inserite su Vercel, il sito funziona lo stesso: «paint» risponde «le dediche non sono ancora attive» e la cartella «dediche» mostra lo stesso avviso. In locale (`npm run dev`) non serve niente: le dediche restano in memoria finché il server di sviluppo è acceso (`vite.config.ts`, plugin `dediche-finte`).

## quale strada scegliere

Google non lascia scrivere un account di servizio nel «Il mio Drive» di una persona: gli account di servizio non hanno spazio proprio, e un file creato da loro in una cartella condivisa fallisce con l’errore `storageQuotaExceeded` («Service Accounts do not have storage quota. Leverage shared drives…»). Le strade che funzionano sono due:

| | serve | variabili |
|---|---|---|
| **a — account di servizio + drive condiviso** | Google Workspace (i drive condivisi non esistono negli account gmail gratuiti) | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `DRIVE_CARTELLA_ID` |
| **b — il tuo account gmail** | un account Google qualsiasi; i disegni usano il tuo spazio | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `DRIVE_CARTELLA_ID` |

Con un normale indirizzo `@gmail.com` usa la **b**. Se le variabili della b sono presenti hanno la precedenza sulla a. I nomi delle variabili sono anche in `.env.example` (senza valori: i valori veri non vanno mai su GitHub).

## passi comuni: progetto google cloud e api di drive

1. Apri [console.cloud.google.com](https://console.cloud.google.com) con il tuo account Google.
2. In alto, accanto al logo, apri il selettore dei progetti → **nuovo progetto** → nome per esempio `portfolio-dediche` → **crea**. Controlla che in alto sia selezionato il nuovo progetto.
3. Menu ☰ → **api e servizi** → **libreria** → cerca **google drive api** → **abilita**.

## strada a — account di servizio e drive condiviso (google workspace)

1. Menu ☰ → **iam e amministrazione** → **account di servizio** → **crea account di servizio**. Nome `dediche-sito`; i ruoli del progetto non servono: **fine**.
2. Apri l’account appena creato → scheda **chiavi** → **aggiungi chiave** → **crea nuova chiave** → **json** → si scarica un file `.json`. Tienilo al sicuro: è una password. Se la tua organizzazione blocca la creazione delle chiavi (criterio «disable service account key creation»), chiedi all’amministratore o usa la strada b.
3. Su [drive.google.com](https://drive.google.com): **drive condivisi** → **nuovo** → nome `dediche del sito`. Dentro, crea una cartella `dediche`.
4. Sul drive condiviso: **gestisci membri** → incolla l’email dell’account di servizio (nel file json è `client_email`, finisce con `.iam.gserviceaccount.com`) → ruolo **gestore contenuti** → invia (togli la spunta «invia notifica»).
5. Apri la cartella `dediche`: l’indirizzo è `https://drive.google.com/drive/folders/QUESTO_È_L_ID`. Copia l’ID.
6. Su Vercel (sotto) inserisci:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `client_email` del json;
   - `GOOGLE_PRIVATE_KEY` = `private_key` del json, tutto, da `-----BEGIN PRIVATE KEY-----` a `-----END PRIVATE KEY-----` (vanno bene sia gli a capo veri sia i `\n` scritti come nel json, anche con le virgolette);
   - `DRIVE_CARTELLA_ID` = l’ID copiato.

## strada b — il tuo account gmail

1. Menu ☰ → **api e servizi** → **schermata consenso oauth** (oppure **google auth platform**) → **inizia**. Nome app `dediche del portfolio`, email di assistenza la tua, pubblico **esterno**, contatto la tua email → crea.
2. **Pubblico** (audience): premi **pubblica app** per passare da «test» a **in produzione**. È importante: in «test» il permesso scade dopo 7 giorni e le dediche smettono di funzionare. Google non verificherà l’app (la usi solo tu): va bene.
3. **Client** → **crea client** → tipo **applicazione web**, nome `dediche`. In **uri di reindirizzamento autorizzati** aggiungi `https://developers.google.com/oauthplayground` → crea. Copia **id client** e **client secret**.
4. Apri [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground). In alto a destra l’ingranaggio ⚙ → spunta **use your own oauth credentials** → incolla id client e secret.
5. A sinistra, nel campo in fondo al passo 1, scrivi `https://www.googleapis.com/auth/drive` → **authorize apis** → scegli il tuo account. Comparirà «Google non ha verificato questa app»: **avanzate** → **vai a dediche del portfolio** → consenti.
6. Passo 2: **exchange authorization code for tokens**. Copia il **refresh token** (inizia di solito con `1//`).
7. Nel tuo Drive crea una cartella `dediche` e copiane l’ID dall’indirizzo, come sopra.
8. Su Vercel inserisci `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` e `DRIVE_CARTELLA_ID`.

Il refresh token smette di valere se cambi la password di Google, se revochi l’accesso da [myaccount.google.com/permissions](https://myaccount.google.com/permissions) o se non viene usato per sei mesi: in quel caso ripeti i passi 4–6 e aggiorna la variabile.

## variabili su vercel e nuovo deploy

1. [vercel.com](https://vercel.com) → progetto `alessandrobottone` → **settings** → **environment variables**.
2. Per ogni variabile: nome, valore, ambienti **production** (e **preview** se vuoi provarle sui link di anteprima) → **save**. Puoi marcarle come **sensitive**.
3. Le variabili valgono solo per i deploy nuovi: **deployments** → sull’ultimo deploy di produzione **⋯** → **redeploy**.
4. Prova: apri `https://alessandrobottone.vercel.app/api/dediche`. Deve rispondere `{"voci":[],"pagina":1,"pagine":1,"totale":0}` (o le dediche già arrivate). Se risponde `non-configurato` manca una variabile o non hai rifatto il deploy; se risponde `archivio-non-raggiungibile` guarda **logs** della funzione su Vercel: di solito la cartella non è condivisa con l’account di servizio, l’ID è sbagliato o il token è scaduto.

## come funziona

- **invio** (`POST /api/dediche`): png della tela (1 bit, 512×342, massimo 200 kB; la funzione controlla firma e misure), dedica fino a 140 caratteri, nome facoltativo fino a 40. I testi sono ripuliti dai caratteri invisibili. Massimo 3 invii all’ora per indirizzo e niente doppioni (stesso disegno con la stessa dedica). Il file va nella cartella con nome `dedica-<data>.png`; dedica e nome stanno nella **descrizione** del file (si leggono anche aprendo i dettagli su Drive), il conteggio delle segnalazioni nelle proprietà nascoste del file.
- **elenco** (`GET /api/dediche?pagina=1`): le 120 più recenti, 12 per pagina, senza dati personali oltre al nome scelto da chi scrive. L’indirizzo IP non viene salvato da nessuna parte (resta solo in memoria per il limite degli invii).
- **immagini** (`GET /api/dediche?file=<id>`): la funzione legge il file da Drive e lo serve con una cache di un’ora (un giorno sulla rete di Vercel); serve solo file presenti nell’elenco visibile.
- **segnala**: una segnalazione per indirizzo; alla terza la dedica sparisce dall’elenco (resta su Drive).

## moderazione

- Per togliere una dedica: cestinala su Drive. Sparisce dal sito entro pochi secondi (l’immagine può restare in cache fino a un giorno se qualcuno l’aveva già aperta).
- Una dedica nascosta dalle segnalazioni resta nella cartella. Per rimetterla online va azzerata la proprietà `segnalazioni` del file con l’API di Drive: chiedi a Claude, non si fa dall’interfaccia di Drive.

## limiti noti

- Limite degli invii e segnalazioni già fatte sono in memoria della singola istanza della funzione: un limite di buon senso, non una protezione assoluta (senza un database, scelta di questa versione).
- Le API di Drive hanno quote generose per questo uso; se il sito diventasse molto visitato conviene un archivio dedicato.
- Le dediche sono visibili subito a tutti, senza approvazione preventiva: la moderazione è a posteriori (segnalazioni e cestino).

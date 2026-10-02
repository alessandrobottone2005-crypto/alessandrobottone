// Funzione Vercel delle dediche disegnate con il paint del computer (docs/dediche-google-drive.md).
//   GET  /api/dediche?pagina=1      ultime dediche visibili, senza dati personali oltre al nome scelto da chi scrive
//   GET  /api/dediche?file=<id>     immagine png, servita da qui perché la cartella di Drive non è pubblica
//   POST /api/dediche               { azione: 'invia', immagine, dedica, nome } oppure { azione: 'segnala', id }
// Archivio su Google Drive senza librerie: JWT RS256 firmato con node:crypto, token OAuth2 e API Drive v3 con fetch.
// Un solo file, senza import relativi: lo stesso gestore gira su Vercel e, con un archivio in memoria, in vite dev.
import { createHash, createSign } from 'node:crypto'

export const REGOLE = {
  /** png 1-bit della tela: misura fissa */
  larghezza: 512,
  altezza: 342,
  maxByte: 200_000,
  maxDedica: 140,
  maxNome: 40,
  /** invii per indirizzo nella finestra di tempo (limite best-effort: vale per ogni istanza della funzione) */
  invii: 3,
  finestra: 60 * 60 * 1000,
  /** dopo tante segnalazioni la dedica sparisce dall’elenco (resta su Drive per alessandro) */
  soglia: 3,
  /** quante dediche recenti si leggono da Drive, e quante per pagina */
  ultime: 120,
  perPagina: 12,
}

/** voce pubblica dell’elenco */
export type Voce = { id: string; dedica: string; nome: string; data: string; immagine: string }

/** registro completo nell’archivio */
export type Registro = { id: string; dedica: string; nome: string; data: string; segnalazioni: number; impronta: string }

export interface Archivio {
  /** le più recenti per prime (anche quelle nascoste: il filtro lo fa il gestore) */
  elenca(): Promise<Registro[]>
  salva(png: Buffer, dati: { dedica: string; nome: string; impronta: string }): Promise<Registro>
  segnala(id: string, segnalazioni: number): Promise<void>
  immagine(id: string): Promise<Buffer | null>
}

// ---------------------------------------------------------------- gestore condiviso

const json = (dati: unknown, stato = 200, cache = 'no-store') =>
  new Response(JSON.stringify(dati), { status: stato, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache } })
const errore = (codice: string, stato: number) => json({ errore: codice }, stato)

const pubblica = (r: Registro): Voce => ({ id: r.id, dedica: r.dedica, nome: r.nome, data: r.data, immagine: `/api/dediche?file=${encodeURIComponent(r.id)}` })
const visibile = (r: Registro) => r.segnalazioni < REGOLE.soglia

// memoria della singola istanza: invii per indirizzo, segnalazioni già fatte, elenco recente
const invii = new Map<string, number[]>()
const segnalate = new Set<string>()
let elencoInCache: { registri: Registro[]; quando: number } | null = null

function indirizzo(req: Request) {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'sconosciuto').trim()
}

async function registri(archivio: Archivio, fresco = false) {
  if (!fresco && elencoInCache && Date.now() - elencoInCache.quando < 15_000) return elencoInCache.registri
  const registri = await archivio.elenca()
  elencoInCache = { registri, quando: Date.now() }
  return registri
}

// caratteri di controllo, invisibili e di direzione del testo (scritti come codici: nel file non devono comparire)
// oxlint-disable-next-line no-control-regex -- li cerco apposta per toglierli
const CONTROLLO = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u2028-\\u202e\\u2066-\\u2069]', 'g')

/** testo libero: niente caratteri di controllo né spazi ripetuti */
export function pulisci(testo: unknown, max: number) {
  if (typeof testo !== 'string') return ''
  return testo
    .replace(CONTROLLO, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

/** controlla firma e intestazione del png: 512×342, niente altro formato */
export function controllaPng(dati: Buffer) {
  const firma = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (dati.length < 33 || dati.length > REGOLE.maxByte) return false
  if (!firma.every((b, i) => dati[i] === b)) return false
  if (dati.toString('latin1', 12, 16) !== 'IHDR') return false
  return dati.readUInt32BE(16) === REGOLE.larghezza && dati.readUInt32BE(20) === REGOLE.altezza
}

export async function gestisci(req: Request, archivio: Archivio | null): Promise<Response> {
  if (!archivio) return errore('non-configurato', 503)
  const url = new URL(req.url)
  try {
    if (req.method === 'GET') {
      const file = url.searchParams.get('file')
      if (file !== null) {
        // solo immagini dell’elenco visibile: la funzione non diventa un accesso libero al drive
        if (!/^[\w-]{6,128}$/.test(file)) return errore('file-non-valido', 400)
        let r = (await registri(archivio)).find((x) => x.id === file)
        if (!r) r = (await registri(archivio, true)).find((x) => x.id === file)
        if (!r || !visibile(r)) return errore('non-trovata', 404)
        const png = await archivio.immagine(file)
        if (!png) return errore('non-trovata', 404)
        return new Response(new Uint8Array(png), {
          headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=3600, s-maxage=86400' },
        })
      }
      const tutte = (await registri(archivio)).filter(visibile)
      const pagine = Math.max(1, Math.ceil(tutte.length / REGOLE.perPagina))
      const pagina = Math.min(pagine, Math.max(1, Number.parseInt(url.searchParams.get('pagina') ?? '1', 10) || 1))
      const voci = tutte.slice((pagina - 1) * REGOLE.perPagina, pagina * REGOLE.perPagina).map(pubblica)
      return json({ voci, pagina, pagine, totale: tutte.length }, 200, 'public, max-age=0, s-maxage=5, stale-while-revalidate=30')
    }

    if (req.method !== 'POST') return errore('metodo-non-ammesso', 405)
    const testo = await req.text()
    if (testo.length > REGOLE.maxByte * 1.4 + 2000) return errore('troppo-grande', 413)
    let corpo: Record<string, unknown>
    try {
      corpo = JSON.parse(testo)
    } catch {
      return errore('richiesta-non-valida', 400)
    }
    const ip = indirizzo(req)

    if (corpo.azione === 'segnala') {
      const id = typeof corpo.id === 'string' ? corpo.id : ''
      const r = (await registri(archivio, true)).find((x) => x.id === id)
      if (!r || !visibile(r)) return errore('non-trovata', 404)
      const chiave = `${ip}:${id}`
      if (!segnalate.has(chiave)) {
        segnalate.add(chiave)
        r.segnalazioni += 1
        await archivio.segnala(id, r.segnalazioni)
      }
      return json({ ok: true, nascosta: !visibile(r) })
    }

    if (corpo.azione !== 'invia') return errore('richiesta-non-valida', 400)
    const ora = Date.now()
    const recenti = (invii.get(ip) ?? []).filter((t) => ora - t < REGOLE.finestra)
    if (recenti.length >= REGOLE.invii) return errore('troppi-invii', 429)

    const base64 = typeof corpo.immagine === 'string' ? corpo.immagine.replace(/^data:image\/png;base64,/, '') : ''
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return errore('immagine-non-valida', 400)
    const png = Buffer.from(base64, 'base64')
    if (png.length > REGOLE.maxByte) return errore('troppo-grande', 413)
    if (!controllaPng(png)) return errore('immagine-non-valida', 400)
    const dedica = pulisci(corpo.dedica, REGOLE.maxDedica)
    const nome = pulisci(corpo.nome, REGOLE.maxNome)
    if (typeof corpo.dedica === 'string' && corpo.dedica.trim().length > REGOLE.maxDedica) return errore('dedica-lunga', 400)

    // stesso disegno con la stessa dedica: è un doppio invio
    const impronta = createHash('sha256').update(png).update(`\u0000${dedica}`).digest('hex')
    if ((await registri(archivio, true)).some((x) => x.impronta === impronta)) return errore('doppione', 409)

    const r = await archivio.salva(png, { dedica, nome, impronta })
    invii.set(ip, [...recenti, ora])
    if (elencoInCache) elencoInCache.registri = [r, ...elencoInCache.registri]
    return json({ voce: pubblica(r) }, 201)
  } catch (e) {
    console.error('dediche:', e)
    return errore('archivio-non-raggiungibile', 502)
  }
}

// ---------------------------------------------------------------- google drive

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const DRIVE = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const SCOPE = 'https://www.googleapis.com/auth/drive'

const base64url = (s: string | Buffer) => Buffer.from(s).toString('base64url')

/** JWT RS256 dell’account di servizio (https://developers.google.com/identity/protocols/oauth2/service-account) */
export function firmaJwt(email: string, chiavePem: string, ora = Math.floor(Date.now() / 1000), scope = SCOPE) {
  const testa = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const corpo = base64url(JSON.stringify({ iss: email, scope, aud: TOKEN_URL, iat: ora, exp: ora + 3600 }))
  const firma = createSign('RSA-SHA256').update(`${testa}.${corpo}`).sign(chiavePem, 'base64url')
  return `${testa}.${corpo}.${firma}`
}

/** la chiave copiata nelle variabili di Vercel può avere `\n` scritti come testo, o le virgolette del json */
export const chiaveDaAmbiente = (valore: string) => valore.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n')

type Credenziali =
  | { tipo: 'servizio'; email: string; chiave: string }
  | { tipo: 'utente'; clientId: string; clientSecret: string; refreshToken: string }

export function credenzialiDaAmbiente(env: Record<string, string | undefined>): { credenziali: Credenziali; cartella: string } | null {
  const cartella = env.DRIVE_CARTELLA_ID?.trim()
  if (!cartella) return null
  // per un account gmail personale (niente drive condivisi): token dell’utente, vedi la guida
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN)
    return {
      cartella,
      credenziali: { tipo: 'utente', clientId: env.GOOGLE_CLIENT_ID.trim(), clientSecret: env.GOOGLE_CLIENT_SECRET.trim(), refreshToken: env.GOOGLE_REFRESH_TOKEN.trim() },
    }
  if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY)
    return { cartella, credenziali: { tipo: 'servizio', email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL.trim(), chiave: chiaveDaAmbiente(env.GOOGLE_PRIVATE_KEY) } }
  return null
}

export function archivioDrive(credenziali: Credenziali, cartella: string): Archivio {
  let token: { valore: string; scade: number } | null = null

  async function accesso() {
    if (token && Date.now() < token.scade - 60_000) return token.valore
    const corpo =
      credenziali.tipo === 'servizio'
        ? new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: firmaJwt(credenziali.email, credenziali.chiave) })
        : new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: credenziali.clientId,
            client_secret: credenziali.clientSecret,
            refresh_token: credenziali.refreshToken,
          })
    const r = await fetch(TOKEN_URL, { method: 'POST', body: corpo })
    if (!r.ok) throw new Error(`token google ${r.status}: ${await r.text()}`)
    const d = (await r.json()) as { access_token: string; expires_in: number }
    token = { valore: d.access_token, scade: Date.now() + d.expires_in * 1000 }
    return token.valore
  }

  async function chiama(url: string, init: RequestInit = {}) {
    const r = await fetch(url, { ...init, headers: { ...init.headers, authorization: `Bearer ${await accesso()}` } })
    if (!r.ok && r.status !== 404) throw new Error(`drive ${r.status}: ${await r.text()}`)
    return r
  }

  type FileDrive = { id: string; createdTime: string; description?: string; appProperties?: Record<string, string> }
  const daFile = (f: FileDrive): Registro => {
    let testi: { dedica?: unknown; nome?: unknown } = {}
    try {
      testi = JSON.parse(f.description ?? '{}')
    } catch {
      /* descrizione modificata a mano su drive: resta solo il disegno */
    }
    return {
      id: f.id,
      data: f.createdTime,
      dedica: pulisci(testi.dedica, REGOLE.maxDedica),
      nome: pulisci(testi.nome, REGOLE.maxNome),
      segnalazioni: Number(f.appProperties?.segnalazioni ?? 0) || 0,
      impronta: f.appProperties?.impronta ?? '',
    }
  }
  const CAMPI = 'id,createdTime,description,appProperties'

  return {
    async elenca() {
      const q = `'${cartella.replace(/'/g, "\\'")}' in parents and trashed = false and mimeType = 'image/png'`
      const parametri = new URLSearchParams({
        q,
        orderBy: 'createdTime desc',
        pageSize: String(REGOLE.ultime),
        fields: `files(${CAMPI})`,
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      })
      const r = await chiama(`${DRIVE}?${parametri}`)
      const d = (await r.json()) as { files?: FileDrive[] }
      return (d.files ?? []).map(daFile)
    },
    async salva(png, { dedica, nome, impronta }) {
      const confine = `dediche${Date.now().toString(36)}`
      const metadati = {
        name: `dedica-${new Date().toISOString().replace(/[:.]/g, '-')}.png`,
        mimeType: 'image/png',
        parents: [cartella],
        // i testi stanno nella descrizione (leggibile anche aprendo il file su drive); le appProperties hanno un limite di 124 byte
        description: JSON.stringify({ dedica, nome }),
        appProperties: { impronta, segnalazioni: '0' },
      }
      const corpo = Buffer.concat([
        Buffer.from(`--${confine}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadati)}\r\n--${confine}\r\ncontent-type: image/png\r\n\r\n`),
        png,
        Buffer.from(`\r\n--${confine}--`),
      ])
      const r = await chiama(`${UPLOAD}?uploadType=multipart&supportsAllDrives=true&fields=${CAMPI}`, {
        method: 'POST',
        headers: { 'content-type': `multipart/related; boundary=${confine}` },
        body: new Uint8Array(corpo),
      })
      if (!r.ok) throw new Error(`drive ${r.status}`)
      return daFile((await r.json()) as FileDrive)
    },
    async segnala(id, segnalazioni) {
      await chiama(`${DRIVE}/${encodeURIComponent(id)}?supportsAllDrives=true`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appProperties: { segnalazioni: String(segnalazioni) } }),
      })
    },
    async immagine(id) {
      const r = await chiama(`${DRIVE}/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`)
      return r.ok ? Buffer.from(await r.arrayBuffer()) : null
    },
  }
}

/** archivio in memoria: server di sviluppo (vite.config.ts) e prove */
export function archivioMemoria(): Archivio {
  const voci: (Registro & { png: Buffer })[] = []
  return {
    async elenca() {
      return voci.map(({ png: _png, ...r }) => ({ ...r }))
    },
    async salva(png, dati) {
      const r = { id: `prova-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, data: new Date().toISOString(), segnalazioni: 0, ...dati }
      voci.unshift({ ...r, png })
      return { ...r }
    },
    async segnala(id, segnalazioni) {
      const v = voci.find((x) => x.id === id)
      if (v) v.segnalazioni = segnalazioni
    },
    async immagine(id) {
      return voci.find((x) => x.id === id)?.png ?? null
    },
  }
}

// ---------------------------------------------------------------- funzione vercel (firma web standard)

let archivio: Archivio | null | undefined
function archivioDiProduzione() {
  if (archivio === undefined) {
    const c = credenzialiDaAmbiente(process.env)
    archivio = c ? archivioDrive(c.credenziali, c.cartella) : null
  }
  return archivio
}

export function GET(req: Request) {
  return gestisci(req, archivioDiProduzione())
}
export function POST(req: Request) {
  return gestisci(req, archivioDiProduzione())
}

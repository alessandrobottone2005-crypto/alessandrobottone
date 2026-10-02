// Dialogo con /api/dediche (api/dediche.ts) e avviso tra paint e cartella dediche:
// una dedica appena inviata compare subito in cartella, senza aspettare la cache dell’elenco.
export type Voce = { id: string; dedica: string; nome: string; data: string; immagine: string }
export type Pagina = { voci: Voce[]; pagina: number; pagine: number; totale: number }

/** codice d’errore dell’api ('non-configurato', 'troppi-invii', 'doppione', …) o 'rete' */
export class ErroreDediche extends Error {
  codice: string
  constructor(codice: string) {
    super(codice)
    this.codice = codice
  }
}

const URL_API = '/api/dediche'

async function risposta<T>(r: Response): Promise<T> {
  const dati = (await r.json().catch(() => ({}))) as { errore?: string }
  if (!r.ok) throw new ErroreDediche(dati.errore ?? 'rete')
  return dati as T
}

export async function elencaDediche(pagina: number, fresco = false) {
  const parametri = new URLSearchParams({ pagina: String(pagina) })
  // dopo un invio o una segnalazione si salta la cache dell’elenco
  if (fresco) parametri.set('t', Date.now().toString(36))
  return risposta<Pagina>(await fetch(`${URL_API}?${parametri}`))
}

const invia = (corpo: object) =>
  fetch(URL_API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) })

export async function inviaDedica(immagine: string, dedica: string, nome: string) {
  const { voce } = await risposta<{ voce: Voce }>(await invia({ azione: 'invia', immagine, dedica, nome }))
  appena.unshift(voce)
  ascoltatori.forEach((a) => a(voce))
  return voce
}

export async function segnalaDedica(id: string) {
  return risposta<{ ok: boolean; nascosta: boolean }>(await invia({ azione: 'segnala', id }))
}

// dediche inviate in questa visita: la cartella le mette in testa finché l’elenco non le contiene
const appena: Voce[] = []
const ascoltatori = new Set<(v: Voce) => void>()
export const dedicheAppena = () => appena
export function ascoltaNuove(a: (v: Voce) => void) {
  ascoltatori.add(a)
  return () => void ascoltatori.delete(a)
}

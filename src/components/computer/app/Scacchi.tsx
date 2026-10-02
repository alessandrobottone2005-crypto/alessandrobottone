// «scacchi» contro il computer: regole di chess.js, avversario nostro in un web worker.
// Scacchiera 1-bit con pezzi a pixel; clic o tocco per scegliere, da tastiera frecce + invio.
// Il volto dietro il monitor fa l’occhiolino quando il computer dà scacco e sorride se vinci.
import { Chess, type PieceSymbol, type Square } from 'chess.js'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { sito } from '@/config/sito'
import { useVolto } from '@/components/volto/VoltoContext'
import { PixelSvg } from './pixel'
import { righePezzo } from './scacchi/pezzi'
import type { Livello, MossaScelta } from './scacchi/avversario'
import { clic } from './suoni'

const testi = sito.app.scacchi
const COLONNE = 'abcdefgh'
const PROMOZIONI: PieceSymbol[] = ['q', 'r', 'b', 'n']
const casaDi = (riga: number, colonna: number) => `${COLONNE[colonna]}${8 - riga}` as Square

type Esito = 'gioca' | 'pensa' | 'vinto' | 'perso' | 'patta'

function motivoPatta(g: Chess) {
  if (g.isStalemate()) return testi.motivi.stallo
  if (g.isInsufficientMaterial()) return testi.motivi.materiale
  if (g.isThreefoldRepetition()) return testi.motivi.ripetizione
  return testi.motivi.cinquanta
}

/** avversario nel worker; se il worker non parte, calcola qui (la pagina si ferma un attimo, ma si gioca) */
function useAvversario(onMossa: (partita: number, fen: string, mossa: MossaScelta | null) => void) {
  const worker = useRef<Worker | null>(null)
  const risposta = useRef(onMossa)
  useEffect(() => {
    risposta.current = onMossa
  })
  useEffect(() => {
    try {
      const w = new Worker(new URL('./scacchi/avversario.worker.ts', import.meta.url), { type: 'module' })
      w.onmessage = (e) => risposta.current(e.data.partita, e.data.fen, e.data.mossa)
      worker.current = w
      return () => w.terminate()
    } catch {
      worker.current = null
    }
  }, [])
  return useCallback((partita: number, fen: string, livello: Livello) => {
    if (worker.current) return worker.current.postMessage({ partita, fen, livello })
    void import('./scacchi/avversario').then(({ scegliMossa }) => risposta.current(partita, fen, scegliMossa(fen, livello)))
  }, [])
}

export default function Scacchi() {
  // la partita vive in chess.js; `fen` cambia a ogni mossa e fa ridisegnare la scacchiera
  const [g] = useState(() => new Chess())
  const partita = useRef(0)
  const [fen, setFen] = useState(() => g.fen())
  const [scelta, setScelta] = useState<Square | null>(null)
  const [fuoco, setFuoco] = useState<Square>('e2')
  const [ultima, setUltima] = useState<{ from: Square; to: Square } | null>(null)
  const [esito, setEsito] = useState<Esito>('gioca')
  const [livello, setLivello] = useState<Livello>('facile')
  const [promozione, setPromozione] = useState<{ from: Square; to: Square } | null>(null)
  const [annuncio, setAnnuncio] = useState('')
  const griglia = useRef<HTMLDivElement>(null)
  const { azione } = useVolto()

  const scacchiera = fen ? g.board() : []
  const destinazioni = scelta ? new Set(g.moves({ square: scelta, verbose: true }).map((m) => m.to)) : new Set<string>()

  const fine = (): boolean => {
    if (g.isCheckmate()) {
      const vinto = g.turn() === 'b'
      setEsito(vinto ? 'vinto' : 'perso')
      if (vinto) azione('sorriso')
      return true
    }
    if (g.isDraw()) {
      setEsito('patta')
      return true
    }
    return false
  }

  const chiedi = useAvversario((n, fenChiesta, mossa) => {
    if (n !== partita.current || fenChiesta !== g.fen() || !mossa) return
    const m = g.move(mossa)
    setUltima({ from: m.from, to: m.to })
    setFen(g.fen())
    setAnnuncio(testi.mossaComputer(m.san))
    if (fine()) return
    setEsito('gioca')
    // il computer ti dà scacco: il volto fa l’occhiolino
    if (g.inCheck()) azione('occhiolino')
  })

  const muovi = (from: Square, to: Square, promotion?: PieceSymbol) => {
    const m = g.move({ from, to, promotion })
    setScelta(null)
    setPromozione(null)
    setUltima({ from: m.from, to: m.to })
    setFen(g.fen())
    setAnnuncio(m.san)
    if (fine()) return
    setEsito('pensa')
    const n = partita.current
    const posizione = g.fen()
    const livelloOra = livello
    // una breve pausa: la risposta istantanea sembra finta
    window.setTimeout(() => chiedi(n, posizione, livelloOra), 350)
  }

  const scegli = (casa: Square) => {
    clic()
    setFuoco(casa)
    if (esito !== 'gioca' || promozione) return
    const pezzo = g.get(casa)
    if (scelta && destinazioni.has(casa)) {
      const promuove = g.moves({ square: scelta, verbose: true }).some((m) => m.to === casa && m.promotion)
      if (promuove) return setPromozione({ from: scelta, to: casa })
      return muovi(scelta, casa)
    }
    setScelta(pezzo?.color === 'w' && casa !== scelta ? casa : null)
  }

  const nuova = () => {
    clic()
    partita.current += 1
    g.reset()
    setFen(g.fen())
    setScelta(null)
    setUltima(null)
    setPromozione(null)
    setEsito('gioca')
    setAnnuncio('')
  }

  // frecce: il fuoco si sposta tra le case (fuoco «mobile»: una sola casa è nel giro del tab)
  const tasti = (e: KeyboardEvent) => {
    const passi: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    if (e.key === 'Escape' && scelta) {
      e.preventDefault()
      e.stopPropagation()
      return setScelta(null)
    }
    const passo = passi[e.key]
    if (!passo) return
    e.preventDefault()
    const c = COLONNE.indexOf(fuoco[0])
    const r = 8 - Number(fuoco[1])
    const nuova = casaDi(Math.min(7, Math.max(0, r + passo[0])), Math.min(7, Math.max(0, c + passo[1])))
    setFuoco(nuova)
    griglia.current?.querySelector<HTMLElement>(`[data-casa="${nuova}"]`)?.focus()
  }

  const stato =
    esito === 'pensa'
      ? testi.pensa
      : esito === 'vinto'
        ? testi.vinto
        : esito === 'perso'
          ? testi.perso
          : esito === 'patta'
            ? testi.patta(motivoPatta(g))
            : g.inCheck()
              ? `${testi.scacco} ${testi.tocca}`
              : testi.tocca

  return (
    <div className="app-scacchi">
      <div className="scacchi-barra">
        <fieldset className="scacchi-livello">
          <legend>{testi.livello}</legend>
          {(['facile', 'medio'] as const).map((l) => (
            <label key={l} className="app-opzione">
              <input
                type="radio"
                name="scacchi-livello"
                checked={livello === l}
                onChange={() => {
                  clic()
                  setLivello(l)
                }}
              />
              {testi[l]}
            </label>
          ))}
        </fieldset>
        <button type="button" className="app-pulsante" onClick={nuova}>
          {testi.nuova}
        </button>
      </div>

      <div className="scacchi-tavolo">
        <div ref={griglia} role="grid" aria-label={testi.scacchiera} className="scacchi-scacchiera" data-pensa={esito === 'pensa' || undefined} onKeyDown={tasti}>
          {scacchiera.map((riga, r) => (
            <div role="row" key={r} className="scacchi-riga">
              {riga.map((p, c) => {
                const casa = casaDi(r, c)
                const nome = p ? `${testi.pezzi[p.type]} ${testi.colori[p.color]}` : undefined
                return (
                  <button
                    key={casa}
                    type="button"
                    role="gridcell"
                    data-casa={casa}
                    data-scura={(r + c) % 2 === 1 || undefined}
                    data-scelta={scelta === casa || undefined}
                    data-ultima={(ultima && (ultima.from === casa || ultima.to === casa)) || undefined}
                    aria-selected={scelta === casa}
                    aria-label={testi.casa(casa, nome)}
                    tabIndex={fuoco === casa ? 0 : -1}
                    className="scacchi-casa"
                    onClick={() => scegli(casa)}
                    onFocus={() => setFuoco(casa)}
                  >
                    {p && <PixelSvg righe={righePezzo(p.type, p.color)} className="scacchi-pezzo" />}
                    {destinazioni.has(casa) && <span aria-hidden="true" className={p ? 'scacchi-presa' : 'scacchi-meta'} />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {promozione && (
          <div
            role="group"
            aria-label={testi.promozione}
            className="scacchi-promozione"
            onKeyDown={(e) => {
              if (e.key !== 'Escape') return
              e.preventDefault()
              e.stopPropagation()
              setPromozione(null)
            }}
          >
            <p>{testi.promozione}</p>
            <div>
              {PROMOZIONI.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  className="app-quadro"
                  aria-label={testi.pezzi[t]}
                  autoFocus={i === 0}
                  onClick={() => {
                    clic()
                    muovi(promozione.from, promozione.to, t)
                  }}
                >
                  <PixelSvg righe={righePezzo(t, 'w')} />
                </button>
              ))}
            </div>
            <button type="button" className="app-pulsante" onClick={() => setPromozione(null)}>
              {testi.annulla}
            </button>
          </div>
        )}
      </div>

      <p className="scacchi-stato" role="status">
        {stato}
      </p>
      <p aria-live="polite" className="sr-only">
        {annuncio}
      </p>
    </div>
  )
}

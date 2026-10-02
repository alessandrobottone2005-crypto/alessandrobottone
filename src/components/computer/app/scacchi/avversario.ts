// Avversario degli scacchi scritto per il portfolio: negamax con potatura alfa-beta,
// valutazione = materiale + posizione (tabelle «semplificate» di Tomasz Michniewski, conoscenza comune).
// Gira nel web worker (avversario.worker.ts): la scena 3d non si ferma mentre pensa.
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'

export type Livello = 'facile' | 'medio'
export type MossaScelta = { from: Square; to: Square; promotion?: PieceSymbol }

const VALORE: Record<PieceSymbol, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }
const MATTO = 100_000

// tabelle dal punto di vista del bianco, prima riga = traversa 8 (come la scacchiera disegnata)
const TABELLE: Record<PieceSymbol, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5,
    -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20,
    15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0,
    -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0,
    -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5,
    5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
  ],
}

/** valutazione dal punto di vista di chi deve muovere */
function valuta(gioco: Chess) {
  let punti = 0
  const scacchiera = gioco.board()
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = scacchiera[r][c]
      if (!p) continue
      // per il nero la tabella si legge capovolta
      const i = p.color === 'w' ? r * 8 + c : (7 - r) * 8 + c
      const v = VALORE[p.type] + TABELLE[p.type][i]
      punti += p.color === 'w' ? v : -v
    }
  return gioco.turn() === 'w' ? punti : -punti
}

// prima le catture (vittima di valore alto, attaccante di valore basso) e le promozioni: la potatura lavora meglio
const ordine = (m: Move) => (m.captured ? 10 * VALORE[m.captured] - VALORE[m.piece] + 1000 : 0) + (m.promotion ? 800 : 0)
const ordina = (mosse: Move[]) => mosse.sort((a, b) => ordine(b) - ordine(a))

/** tempo scaduto: la ricerca in corso si abbandona e vale la profondità precedente */
class Scaduto extends Error {}
let limite = Infinity

function negamax(gioco: Chess, profondita: number, alfa: number, beta: number, ply: number): number {
  if (performance.now() > limite) throw new Scaduto()
  const mosse = gioco.moves({ verbose: true })
  if (mosse.length === 0) return gioco.inCheck() ? -MATTO + ply : 0
  if (gioco.isInsufficientMaterial() || gioco.isDrawByFiftyMoves()) return 0
  if (profondita === 0) return valuta(gioco)
  let migliore = -Infinity
  for (const m of ordina(mosse)) {
    gioco.move(m)
    const v = -negamax(gioco, profondita - 1, -beta, -alfa, ply + 1)
    gioco.undo()
    if (v > migliore) migliore = v
    if (v > alfa) alfa = v
    if (alfa >= beta) break
  }
  return migliore
}

/** facile: profondità 2 con un po’ di rumore; medio: profondità 3. Approfondimento iterativo con un tempo massimo:
 * se la profondità piena non finisce in tempo vale la migliore mossa della profondità precedente. */
export function scegliMossa(fen: string, livello: Livello, caso: () => number = Math.random): MossaScelta | null {
  const gioco = new Chess(fen)
  const profonditaMax = livello === 'facile' ? 2 : 3
  const rumore = livello === 'facile' ? 60 : 6
  let mosse = ordina(gioco.moves({ verbose: true }))
  if (!mosse.length) return null
  let migliore: Move = mosse[0]
  limite = performance.now() + (livello === 'facile' ? 1200 : 3000)
  try {
    for (let profondita = 1; profondita <= profonditaMax; profondita++) {
      let scelta = mosse[0]
      let punti = -Infinity
      let alfa = -Infinity
      for (const m of mosse) {
        gioco.move(m)
        let v: number
        try {
          // finestra allargata del rumore: una mossa appena peggiore può ancora vincere il sorteggio
          v = -negamax(gioco, profondita - 1, -Infinity, -(alfa - rumore), 1) + (caso() - 0.5) * rumore
        } finally {
          gioco.undo()
        }
        if (v > punti) {
          punti = v
          scelta = m
        }
        alfa = Math.max(alfa, v)
      }
      migliore = scelta
      // la prossima profondità parte dalla mossa migliore: la potatura lavora di più
      mosse = [scelta, ...mosse.filter((m) => m !== scelta)]
    }
  } catch (e) {
    if (!(e instanceof Scaduto)) throw e
  }
  return { from: migliore.from, to: migliore.to, promotion: migliore.promotion }
}

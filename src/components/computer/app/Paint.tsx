// «paint»: tela 1-bit 512×342 in stile 1984 (ma nostra), con dedica da inviare alla cartella dediche.
// Mouse, penna e tocco con pointer events (touch-action: none sulla tela); da tastiera frecce + invio.
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { sito } from '@/config/sito'
import { ErroreDediche, inviaDedica } from './clientDediche'
import { ICONE_STRUMENTI, type Strumento } from './paint/disegni'
import { ALTEZZA, LARGHEZZA, TRAME, dentro, disegna, linea, nuovaTela, pngDaTela, rettangolo, riempi, vuota, type Bitmap, type Inchiostro } from './paint/tela'
import { PixelSvg } from './pixel'
import { clic, floppy } from './suoni'

const testi = sito.app.paint
const STRUMENTI: Strumento[] = ['matita', 'pennello', 'gomma', 'linea', 'rettangolo', 'pieno', 'secchiello']
const SPESSORI = [1, 2, 4, 8]
const GOMMA = 12
const MAX_ANNULLA = 24
const MAX_DEDICA = 140
const MAX_NOME = 40

type Tratto = { x: number; y: number; base: Bitmap; inizio: { x: number; y: number }; ink: Inchiostro }

export default function Paint({ onInviata }: { onInviata: () => void }) {
  const tela = useRef<Bitmap>(nuovaTela())
  const storia = useRef<Bitmap[]>([])
  const canvas = useRef<HTMLCanvasElement>(null)
  const immagine = useRef<ImageData | null>(null)
  const tratto = useRef<Tratto | null>(null)
  const fotogramma = useRef(0)
  const [strumento, setStrumento] = useState<Strumento>('matita')
  const [spessore, setSpessore] = useState(2)
  const [trama, setTrama] = useState(0)
  const [puoAnnullare, setPuoAnnullare] = useState(false)
  // cursore da tastiera (coordinate della tela)
  const [mirino, setMirino] = useState<{ x: number; y: number } | null>(null)
  const [dedica, setDedica] = useState('')
  const [nome, setNome] = useState('')
  const [stato, setStato] = useState<{ tipo: 'pronto' | 'invio' | 'ok' | 'errore'; testo: string }>({ tipo: 'pronto', testo: '' })
  const id = useId()

  const ridisegna = () => {
    cancelAnimationFrame(fotogramma.current)
    fotogramma.current = requestAnimationFrame(() => {
      const ctx = canvas.current?.getContext('2d')
      if (!ctx) return
      immagine.current ??= ctx.createImageData(LARGHEZZA, ALTEZZA)
      disegna(ctx, tela.current, immagine.current)
    })
  }
  useEffect(() => {
    ridisegna()
    return () => cancelAnimationFrame(fotogramma.current)
  }, [])

  const salvaStoria = () => {
    storia.current.push(tela.current.slice())
    if (storia.current.length > MAX_ANNULLA) storia.current.shift()
    setPuoAnnullare(true)
  }
  const annulla = () => {
    clic()
    const prima = storia.current.pop()
    if (prima) tela.current = prima
    setPuoAnnullare(storia.current.length > 0)
    ridisegna()
  }
  const cancella = () => {
    clic()
    salvaStoria()
    tela.current = nuovaTela()
    ridisegna()
  }

  // ---------------------------------------------------------------- disegno
  const trascinabile = (s: Strumento) => s === 'linea' || s === 'rettangolo' || s === 'pieno'

  const inizia = (x: number, y: number) => {
    salvaStoria()
    const t = tela.current
    const tramaScelta = TRAME[trama]
    if (strumento === 'secchiello') {
      riempi(t, x, y, tramaScelta)
      ridisegna()
      return
    }
    // la matita del 1984: partendo da un punto nero cancella
    const ink: Inchiostro = strumento === 'matita' ? (t[y * LARGHEZZA + x] ? 0 : 1) : strumento === 'gomma' ? 0 : strumento === 'pennello' ? tramaScelta : 1
    tratto.current = { x, y, base: t.slice(), inizio: { x, y }, ink }
    continua(x, y)
  }

  const continua = (x: number, y: number) => {
    const tr = tratto.current
    if (!tr) return
    const t = tela.current
    if (trascinabile(strumento)) {
      // forme: si riparte ogni volta dalla tela di prima, come un’anteprima elastica
      t.set(tr.base)
      if (strumento === 'linea') linea(t, tr.inizio.x, tr.inizio.y, x, y, spessore, 1)
      else rettangolo(t, tr.inizio.x, tr.inizio.y, x, y, spessore, strumento === 'pieno' ? TRAME[trama] : null, 1)
    } else {
      const lato = strumento === 'matita' ? 1 : strumento === 'gomma' ? GOMMA : spessore
      linea(t, tr.x, tr.y, x, y, lato, tr.ink)
    }
    tr.x = x
    tr.y = y
    ridisegna()
  }
  const finisci = () => {
    tratto.current = null
  }

  // punto della tela sotto il puntatore: offsetX è già nelle coordinate locali (anche con la matrix3d dello schermo)
  const punto = (e: PointerEvent<HTMLCanvasElement>) => {
    const el = e.currentTarget
    const x = Math.floor((e.nativeEvent.offsetX * LARGHEZZA) / el.clientWidth)
    const y = Math.floor((e.nativeEvent.offsetY * ALTEZZA) / el.clientHeight)
    return { x: Math.min(LARGHEZZA - 1, Math.max(0, x)), y: Math.min(ALTEZZA - 1, Math.max(0, y)) }
  }

  const giu = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.focus({ preventScroll: true })
    setMirino(null)
    const p = punto(e)
    inizia(p.x, p.y)
  }
  const muovi = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!tratto.current) return
    const p = punto(e)
    continua(p.x, p.y)
  }

  // tastiera: frecce spostano il mirino (maiuscole: 8 pixel), invio o spazio abbassano/alzano la punta
  const tasti = (e: KeyboardEvent<HTMLCanvasElement>) => {
    const passi: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const m = mirino ?? { x: LARGHEZZA >> 1, y: ALTEZZA >> 1 }
    if (passi[e.key]) {
      e.preventDefault()
      const k = e.shiftKey ? 8 : 1
      const x = m.x + passi[e.key][0] * k
      const y = m.y + passi[e.key][1] * k
      if (!dentro(x, y)) return
      setMirino({ x, y })
      continua(x, y)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setMirino(m)
      if (tratto.current) finisci()
      else inizia(m.x, m.y)
    }
  }

  // ---------------------------------------------------------------- invio
  const invia = async () => {
    if (stato.tipo === 'invio') return
    clic()
    if (vuota(tela.current)) return setStato({ tipo: 'errore', testo: testi.vuota })
    setStato({ tipo: 'invio', testo: testi.invio })
    floppy()
    try {
      const png = await pngDaTela(tela.current)
      await inviaDedica(png, dedica, nome)
      setStato({ tipo: 'ok', testo: testi.inviata })
      setDedica('')
      onInviata()
    } catch (e) {
      const codice = e instanceof ErroreDediche ? e.codice : 'generico'
      const errori = testi.errori as Record<string, string>
      setStato({ tipo: 'errore', testo: errori[codice] ?? errori.generico })
    }
  }

  return (
    <div className="app-paint">
      <div className="paint-attrezzi">
        <div role="toolbar" aria-label={testi.strumenti} className="paint-strumenti">
          {STRUMENTI.map((s) => (
            <button
              key={s}
              type="button"
              className="app-quadro"
              aria-pressed={strumento === s}
              aria-label={testi.strumento[s]}
              title={testi.strumento[s]}
              onClick={() => {
                clic()
                setStrumento(s)
                finisci()
              }}
            >
              <PixelSvg righe={ICONE_STRUMENTI[s]} />
            </button>
          ))}
        </div>
        <fieldset className="paint-spessori">
          <legend className="sr-only">{testi.spessore}</legend>
          {SPESSORI.map((s) => (
            <label key={s} className="app-quadro" title={`${testi.spessore} ${s}`}>
              <input type="radio" name={`${id}-spessore`} className="sr-only" checked={spessore === s} onChange={() => (clic(), setSpessore(s))} />
              <span aria-hidden="true" className="paint-spessore" style={{ height: s }} />
              <span className="sr-only">{`${testi.spessore} ${s}`}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="paint-trame">
          <legend className="sr-only">{testi.trama}</legend>
          {TRAME.map((righe, i) => (
            <label key={testi.trame[i]} className="paint-trama" title={testi.trame[i]}>
              <input type="radio" name={`${id}-trama`} className="sr-only" checked={trama === i} onChange={() => (clic(), setTrama(i))} />
              <span aria-hidden="true" className="paint-campione" style={{ backgroundImage: campione(righe) }} />
              <span className="sr-only">{testi.trame[i]}</span>
            </label>
          ))}
        </fieldset>
        <div className="paint-comandi">
          <button type="button" className="app-pulsante" disabled={!puoAnnullare} onClick={annulla}>
            {testi.annulla}
          </button>
          <button type="button" className="app-pulsante" onClick={cancella}>
            {testi.cancella}
          </button>
        </div>
      </div>

      <div className="paint-spazio">
      <div className="paint-foglio">
        <canvas
          ref={canvas}
          width={LARGHEZZA}
          height={ALTEZZA}
          tabIndex={0}
          role="img"
          aria-label={testi.tela}
          className="paint-tela"
          onPointerDown={giu}
          onPointerMove={muovi}
          onPointerUp={finisci}
          onPointerCancel={finisci}
          onKeyDown={tasti}
          onBlur={() => setMirino(null)}
        />
        {mirino && (
          <span
            aria-hidden="true"
            className="paint-mirino"
            style={{ left: `${((mirino.x + 0.5) / LARGHEZZA) * 100}%`, top: `${((mirino.y + 0.5) / ALTEZZA) * 100}%` }}
          />
        )}
      </div>
      </div>

      <form
        className="paint-modulo"
        onSubmit={(e) => {
          e.preventDefault()
          void invia()
        }}
      >
        <label className="paint-campo">
          <span>
            {testi.dedica} <span className="cifre-tabellari">({testi.caratteri(dedica.length, MAX_DEDICA)})</span>
          </span>
          <input type="text" value={dedica} maxLength={MAX_DEDICA} autoComplete="off" placeholder={testi.dedicaSegnaposto} onChange={(e) => setDedica(e.target.value)} />
        </label>
        <label className="paint-campo paint-campo-nome">
          <span>{testi.campoNome}</span>
          <input type="text" value={nome} maxLength={MAX_NOME} autoComplete="off" onChange={(e) => setNome(e.target.value)} />
        </label>
        <div className="paint-invio">
          <p aria-live="polite" className="paint-stato">
            {stato.testo}
          </p>
          <button type="submit" className="app-pulsante app-pulsante-forte" disabled={stato.tipo === 'invio'}>
            {stato.tipo === 'invio' ? testi.invio : testi.invia}
          </button>
        </div>
      </form>
    </div>
  )
}

/** anteprima di una trama: un svg 8×8 ripetuto, nei colori dei fosfori */
function campione(righe: number[]) {
  let rett = ''
  righe.forEach((b, y) => {
    for (let x = 0; x < 8; x++) if ((b >> (7 - x)) & 1) rett += `<rect x='${x}' y='${y}' width='1' height='1'/>`
  })
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' shape-rendering='crispEdges'><rect width='8' height='8' fill='%23e7e1d1'/><g fill='%23161614'>${rett}</g></svg>`
  return `url("data:image/svg+xml,${svg}")`
}

// Sequenza di avvio dopo il clic: accordo e tubo che si apre, «hello» in corsivo che si scrive tratto per tratto
// in pixel 1-bit, il sistema che si bugga (righe che scivolano, blocchi invertiti, schermo che salta) con il volto
// di alessandro che affiora nel disturbo, la trama grigia e poi la scrivania. Saltabile con un clic o un tasto.
// Tutto disegnato da noi su un canvas a bassa risoluzione, ingrandito a pixel netti: niente font né marchi altrui.
import { useEffect, useRef } from 'react'
import { movimento } from '@/config/movimento'
import { sito } from '@/config/sito'
import { audio } from '@/lib/audio/motore'
import { glitch } from '@/lib/glitch'
import { useVolto } from '@/components/volto/VoltoContext'
import { fineAvvio, giaAvviato } from './stato'
import { MacFelice } from './icone'
import { useVoltoPixel } from './voltoPixel'

const A = movimento.computer.avvio
const FINE_HELLO = A.apertura + A.hello
const INIZIO_BUG = FINE_HELLO + A.pausa
const FINE_BUG = INIZIO_BUG + A.bug
const TOTALE = FINE_BUG + A.trama

// fosfori (claude.md §2, regola 1): solo questi due colori dentro lo schermo
const NERO = [0x16, 0x16, 0x14]
const BIANCO = [0xe7, 0xe1, 0xd1]

// «hello» in corsivo legato, disegnato a mano in un riquadro 112 × 56 (linea di base a 46): un solo tratto
// continuo, così si scrive come una penna. Nostro, non la scritta storica né il suo carattere.
const TRATTO_HELLO =
  'M4 44 C10 44 18 32 22 20 C25 11 23 5 19 8 C15 12 14 30 13 46 ' + // attacco e asta della h
  'C15 38 19 31 24 31 C29 31 28 40 28 44 C28 47 31 47 34 45 ' + // gobba della h
  'C38 42 44 38 45 34 C46 30 40 29 37 34 C34 39 36 47 42 46 C46 45 50 41 53 37 ' + // e
  'C57 30 61 18 61 11 C61 5 56 6 55 13 C54 22 54 37 56 44 C57 47 60 46 63 42 ' + // prima l
  'C67 35 71 18 71 11 C71 5 66 6 65 13 C64 22 64 37 66 44 C67 47 70 46 73 42 ' + // seconda l
  'C75 37 78 31 83 31 C89 31 89 43 84 46 C79 48 77 41 80 36 C83 32 88 32 92 33 ' + // o
  'C97 34 102 32 107 28' // svolazzo d’uscita
const HELLO_BOX = { w: 112, h: 56 }

/** lunghezza del tratto, misurata una volta con un path svg fuori dal documento */
let lunghezzaHello = 0
function misuraHello() {
  if (lunghezzaHello) return lunghezzaHello
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  p.setAttribute('d', TRATTO_HELLO)
  lunghezzaHello = p.getTotalLength?.() || 420
  return lunghezzaHello
}

const limita = (t: number) => Math.min(1, Math.max(0, t))
const morbida = (t: number) => {
  const v = limita(t)
  return v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2
}

export function Avvio() {
  const breve = giaAvviato()
  return breve ? <AvvioBreve /> : <AvvioCompleto />
}

/** riaccensione: trama grigia e il piccolo computer con il volto (oggi raro: acceso, resta acceso) */
function AvvioBreve() {
  useEffect(() => {
    const id = window.setTimeout(fineAvvio, movimento.computer.avvioBreve * 1000)
    return () => clearTimeout(id)
  }, [])
  return (
    <div className="mac-avvio" data-breve role="status" aria-label={sito.computer.avvio}>
      <MacFelice />
    </div>
  )
}

function AvvioCompleto() {
  const tela = useRef<HTMLCanvasElement>(null)
  const { azione } = useVolto()
  const volto = useVoltoPixel(64)
  const immagineVolto = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!volto) return
    const img = new Image()
    img.onload = () => (immagineVolto.current = img)
    img.src = volto
  }, [volto])

  // suoni, battito del volto e salto
  useEffect(() => {
    azione('battito')
    audio.suona('accensione')
    const disco = window.setTimeout(() => audio.suona('disco'), movimento.computer.disco * 1000)
    const bug = window.setTimeout(() => glitch.emetti({ bersaglio: 'camera', durata: 0.3, intensita: 0.5 }), INIZIO_BUG * 1000 + 200)
    const fine = window.setTimeout(fineAvvio, TOTALE * 1000)
    const partenza = performance.now()
    // il gesto che ha acceso non deve anche saltare
    const salta = (e: Event) => {
      if (performance.now() - partenza < 300) return
      if (e instanceof KeyboardEvent) {
        if (!['Enter', ' ', 'Escape'].includes(e.key)) return
        e.preventDefault()
      }
      fineAvvio()
    }
    addEventListener('click', salta)
    addEventListener('keydown', salta)
    return () => {
      clearTimeout(disco)
      clearTimeout(bug)
      clearTimeout(fine)
      removeEventListener('click', salta)
      removeEventListener('keydown', salta)
    }
  }, [azione])

  // disegno: a ogni fotogramma la scena intera, poi soglia a due colori e disturbi sui pixel
  useEffect(() => {
    const canvas = tela.current
    const ctx = canvas?.getContext('2d', { willReadFrequently: true })
    if (!canvas || !ctx) return
    // un pixel del sistema ≈ 3–4 px dello schermo
    const passo = Math.max(3, Math.round(canvas.offsetWidth / 200))
    const W = (canvas.width = Math.max(64, Math.round(canvas.offsetWidth / passo)))
    const H = (canvas.height = Math.max(48, Math.round(canvas.offsetHeight / passo)))
    const lunghezza = misuraHello()
    const tratto = new Path2D(TRATTO_HELLO)
    // il saluto occupa metà della larghezza (meno su schermi alti e stretti)
    const scala = Math.min((W * 0.56) / HELLO_BOX.w, (H * 0.5) / HELLO_BOX.h)
    let maschera: Uint8Array | null = null
    const preparaVolto = () => {
      const img = immagineVolto.current
      if (maschera || !img) return
      const lato = Math.round(Math.min(W, H) * 0.62)
      ctx.clearRect(0, 0, W, H)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, Math.round((W - lato) / 2), Math.round((H - lato) / 2), lato, lato)
      const d = ctx.getImageData(0, 0, W, H).data
      maschera = new Uint8Array(W * H)
      for (let i = 0; i < W * H; i++) maschera[i] = d[i * 4 + 3] > 100 ? 1 : 0
    }
    const partenza = performance.now()
    let id = 0
    const riga = new Uint8ClampedArray(W * 4)
    const disegna = () => {
      id = requestAnimationFrame(disegna)
      const t = (performance.now() - partenza) / 1000
      preparaVolto()
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, W, H)
      if (t < A.apertura) {
        // fosfori che si scaldano: lo schermo si accende a scatti
        ctx.fillStyle = Math.random() < 0.35 ? '#000' : '#fff'
        ctx.fillRect(0, 0, W, H)
      }
      if (t < FINE_BUG + 0.05) {
        const p = morbida((t - A.apertura) / A.hello)
        if (p > 0) {
          ctx.save()
          ctx.translate((W - HELLO_BOX.w * scala) / 2, (H - HELLO_BOX.h * scala) / 2)
          ctx.scale(scala, scala)
          ctx.lineCap = ctx.lineJoin = 'round'
          // circa due pixel del sistema
          ctx.lineWidth = 2.2 / scala
          ctx.strokeStyle = '#000'
          ctx.setLineDash([lunghezza * p, lunghezza + 1])
          ctx.stroke(tratto)
          ctx.restore()
        }
      }
      // soglia: solo nero e bianco dei fosfori
      const img = ctx.getImageData(0, 0, W, H)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const c = d[i] + d[i + 1] + d[i + 2] < 384 ? NERO : BIANCO
        d[i] = c[0]
        d[i + 1] = c[1]
        d[i + 2] = c[2]
        d[i + 3] = 255
      }
      const inverti = (i: number) => {
        const nero = d[i] === NERO[0]
        const c = nero ? BIANCO : NERO
        d[i] = c[0]
        d[i + 1] = c[1]
        d[i + 2] = c[2]
      }
      let salto = 0
      if (t >= INIZIO_BUG && t < FINE_BUG) {
        const u = (t - INIZIO_BUG) / A.bug
        const forza = Math.sin(Math.PI * u) ** 0.6
        // il volto affiora per un istante, a lampi, attraverso il disturbo
        if (maschera && u > 0.3 && u < 0.78 && Math.random() < 0.8) {
          for (let i = 0; i < W * H; i++) if (maschera[i]) inverti(i * 4)
        }
        // blocchi invertiti
        const blocchi = Math.round(2 + forza * 9)
        for (let b = 0; b < blocchi; b++) {
          const bw = Math.round(4 + Math.random() * W * 0.3),
            bh = Math.round(1 + Math.random() * H * 0.08)
          const bx = Math.floor(Math.random() * (W - bw)),
            by = Math.floor(Math.random() * (H - bh))
          for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) inverti((y * W + x) * 4)
        }
        // bande di righe che scivolano di lato
        const bande = Math.round(1 + forza * 6)
        for (let b = 0; b < bande; b++) {
          const y0 = Math.floor(Math.random() * H),
            alta = Math.round(1 + Math.random() * H * 0.12)
          const sposta = Math.round((Math.random() - 0.5) * W * 0.35 * forza)
          for (let y = y0; y < Math.min(H, y0 + alta); y++) {
            const o = y * W * 4
            riga.set(d.subarray(o, o + W * 4))
            for (let x = 0; x < W; x++) {
              const da = (((x - sposta) % W) + W) % W
              d[o + x * 4] = riga[da * 4]
              d[o + x * 4 + 1] = riga[da * 4 + 1]
              d[o + x * 4 + 2] = riga[da * 4 + 2]
            }
          }
        }
        // lo schermo salta in verticale (il segnale perde l’aggancio)
        if (Math.random() < 0.45 * forza) salto = Math.round((Math.random() - 0.5) * H * 0.25)
      }
      if (t >= FINE_BUG) {
        // trama grigia del sistema che parte: un pixel nero e uno bianco
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++) {
            const c = (x + y) % 2 ? NERO : BIANCO
            const i = (y * W + x) * 4
            d[i] = c[0]
            d[i + 1] = c[1]
            d[i + 2] = c[2]
          }
      }
      ctx.putImageData(img, 0, 0)
      canvas.style.transform = salto ? `translate3d(0, ${(salto / H) * 100}%, 0)` : ''
    }
    disegna()
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="mac-avvio mac-avvio-completo" role="status" aria-label={sito.computer.avvio}>
      <span className="sr-only">{sito.computer.accensione.saluto}</span>
      <canvas ref={tela} aria-hidden="true" className="mac-avvio-tela" />
    </div>
  )
}

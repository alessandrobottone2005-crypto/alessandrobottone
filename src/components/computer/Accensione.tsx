// Zone per accendere il computer, posate sopra il monitor e il mouse 3d con la stessa proiezione del vetro.
// Il Canvas non riceve eventi (pointer-events: none), quindi niente raycast: due elementi DOM fissi, robusti
// anche al tocco. Il monitor è un pulsante vero, invisibile ma con il focus visibile («accendi il computer»,
// Invio o Spazio); il mouse è una zona solo per puntatore e tocco. Compaiono solo con il computer spento
// e la camera ferma davanti a lui; il cursore del sito mostra «accendi».
import { useEffect, useRef, useState } from 'react'
import { sito } from '@/config/sito'
import { gsap } from '@/lib/gsap'
import { percorso } from '@/components/volto/percorso'
import { ricalcolaCursore } from '@/components/cursore/ricalcola'
import { proiettaMonitor, proiettaMouse, type Ingombro } from './inquadratura'
import { accendi, accendibile, useFaseComputer } from './stato'

// controlli principali almeno 48px (claude.md §4)
const MINIMO = 48

function posa(el: HTMLElement | null, r: Ingombro, margine: number) {
  if (!el) return
  const cx = (r.sinistra + r.destra) / 2,
    cy = (r.alto + r.basso) / 2
  const w = Math.max(MINIMO, r.destra - r.sinistra + margine * 2),
    h = Math.max(MINIMO, r.basso - r.alto + margine * 2)
  el.style.transform = `translate3d(${cx - w / 2}px, ${cy - h / 2}px, 0)`
  el.style.width = `${w}px`
  el.style.height = `${h}px`
}

export function Accensione() {
  const fase = useFaseComputer()
  const monitor = useRef<HTMLButtonElement>(null)
  const mouse = useRef<HTMLButtonElement>(null)
  const [pronto, setPronto] = useState(false)
  // accesa da tastiera: a desktop pronto il focus entra nello schermo
  const daTastiera = useRef(false)

  useEffect(() => {
    if (fase !== 'spento') return
    const r: Ingombro = { sinistra: 0, destra: 0, alto: 0, basso: 0, profondita: 0 }
    const tick = () => {
      const ora = accendibile()
      setPronto((p) => (p === ora ? p : ora))
      if (!ora) return
      const w = document.documentElement.clientWidth,
        h = innerHeight
      const s = percorso.stazione
      if (proiettaMonitor(s, w, h, r)) posa(monitor.current, r, 0)
      if (proiettaMouse(s, w, h, r)) posa(mouse.current, r, 10)
    }
    tick()
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      setPronto(false)
    }
  }, [fase])

  // le zone compaiono o spariscono sotto un mouse fermo: il cursore deve saperlo
  useEffect(() => {
    const id = requestAnimationFrame(ricalcolaCursore)
    return () => cancelAnimationFrame(id)
  }, [pronto])

  // acceso con la tastiera: quando la scrivania diventa utilizzabile il focus va sul primo controllo dello schermo
  useEffect(() => {
    if (fase !== 'acceso' || !daTastiera.current) return
    daTastiera.current = false
    let id = 0
    const prova = (volte: number) => {
      const primo = document.querySelector<HTMLElement>('[data-mac]:not([inert]) button')
      if (primo) primo.focus()
      else if (volte > 0) id = requestAnimationFrame(() => prova(volte - 1))
    }
    prova(120)
    return () => cancelAnimationFrame(id)
  }, [fase])

  if (fase !== 'spento') return null
  const alClic = (e: React.MouseEvent) => {
    if (!accendibile()) return
    // un clic da tastiera (Invio, Spazio) arriva con detail 0
    daTastiera.current = e.detail === 0
    accendi()
  }
  const stile = { visibility: pronto ? 'visible' : 'hidden' } as const
  return (
    <>
      <button
        ref={monitor}
        type="button"
        data-cursore={sito.computer.accensione.cursore}
        aria-label={sito.computer.accensione.pulsante}
        onClick={alClic}
        className="fixed top-0 left-0 z-[16] cursor-pointer rounded-[6%] bg-transparent"
        style={stile}
      />
      <button
        ref={mouse}
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        data-cursore={sito.computer.accensione.cursore}
        onClick={alClic}
        className="fixed top-0 left-0 z-[16] cursor-pointer rounded-full bg-transparent"
        style={stile}
      />
    </>
  )
}

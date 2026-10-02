// cursore personalizzato, solo con il mouse (claude.md §7).
// gsap muove il contenitore (posizione con inerzia); motion anima la forma dentro (stati).
// per cambiare forma su un elemento: data-cursore="apri" (o sfoglia, ruota, play, pausa, chiudi, tieni premuto, accendi).
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { media, movimento } from '@/config/movimento'
import { gsap } from '@/lib/gsap'
import { EVENTO_RICALCOLA } from './ricalcola'

type Forma = { tipo: 'punto' } | { tipo: 'anello' } | { tipo: 'nascosto' } | { tipo: 'etichetta'; testo: string }

const INTERATTIVI = 'a[href], button, [role="button"], input, select, textarea, label, summary, [tabindex]:not([tabindex="-1"])'
const PUNTO = 10
const ANELLO = 44
const LENTE = 96

const ease = [0.16, 1, 0.3, 1] as const

function formaDi(el: Element | null): Forma {
  // sullo schermo del computer vale la freccia pixel del 1984
  if (el?.closest('[data-mac]')) return { tipo: 'nascosto' }
  const conEtichetta = el?.closest<HTMLElement>('[data-cursore]')
  const testo = conEtichetta?.dataset.cursore
  if (testo) return { tipo: 'etichetta', testo }
  if (el?.closest(INTERATTIVI)) return { tipo: 'anello' }
  return { tipo: 'punto' }
}

const uguali = (a: Forma, b: Forma) => a.tipo === b.tipo && (a.tipo !== 'etichetta' || a.testo === (b as { testo: string }).testo)

export function Cursore() {
  const [attivo, setAttivo] = useState(false)

  useEffect(() => {
    const mouse = matchMedia(media.mouse)
    const ridotto = matchMedia(media.ridotto)
    const aggiorna = () => setAttivo(mouse.matches && !ridotto.matches)
    aggiorna()
    mouse.addEventListener('change', aggiorna)
    ridotto.addEventListener('change', aggiorna)
    return () => {
      mouse.removeEventListener('change', aggiorna)
      ridotto.removeEventListener('change', aggiorna)
    }
  }, [])

  return attivo ? <CursoreAttivo /> : null
}

function CursoreAttivo() {
  const posizione = useRef<HTMLDivElement>(null)
  const [forma, setForma] = useState<Forma>({ tipo: 'punto' })
  const [premuto, setPremuto] = useState(false)
  const [visibile, setVisibile] = useState(false)
  const formaRef = useRef(forma)
  // ricalcola la forma guardando cosa c’è sotto il cursore (preparata dentro l’effetto qui sotto)
  const ricalcola = useRef(() => {})
  const { pathname } = useLocation()

  // aprendo o chiudendo la finestra di un progetto cambia ciò che sta sotto il cursore anche se il mouse è fermo:
  // la forma si ricalcola subito e poi mentre la finestra compare o sparisce
  useEffect(() => {
    const id = requestAnimationFrame(() => ricalcola.current())
    const tempi = [120, 450, 900].map((ms) => window.setTimeout(() => ricalcola.current(), ms))
    return () => {
      cancelAnimationFrame(id)
      tempi.forEach(clearTimeout)
    }
  }, [pathname])

  useEffect(() => {
    const el = posizione.current!
    document.documentElement.classList.add('cursore-personalizzato')
    const x = gsap.quickTo(el, 'x', { duration: 0.18, ease: 'power3.out' })
    const y = gsap.quickTo(el, 'y', { duration: 0.18, ease: 'power3.out' })
    let primo = true

    const cambiaForma = (bersaglio: Element | null) => {
      const nuova = formaDi(bersaglio)
      if (!uguali(nuova, formaRef.current)) {
        formaRef.current = nuova
        setForma(nuova)
      }
    }
    const muovi = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (primo) {
        // al primo movimento compare già al suo posto, senza volare dall’angolo
        gsap.set(el, { x: e.clientX, y: e.clientY })
        primo = false
      }
      x(e.clientX)
      y(e.clientY)
      ultimo = { x: e.clientX, y: e.clientY }
      setVisibile(true)
      cambiaForma(e.target instanceof Element ? e.target : null)
    }
    // dopo uno scroll (o l’apertura di una finestra) l’elemento sotto il cursore cambia anche senza muovere il mouse
    let ultimo = { x: 0, y: 0 }
    const dopoScroll = () => {
      if (primo) return
      cambiaForma(document.elementFromPoint(ultimo.x, ultimo.y))
    }
    ricalcola.current = dopoScroll
    const giu = () => setPremuto(true)
    const su = () => setPremuto(false)
    const esci = () => setVisibile(false)
    const perdeFocus = () => {
      su()
      esci()
    }

    addEventListener('pointermove', muovi, { passive: true })
    addEventListener('pointerdown', giu)
    addEventListener('pointerup', su)
    addEventListener('pointercancel', su)
    addEventListener('blur', perdeFocus)
    // in cattura: così arrivano anche gli scroll interni (le finestre del computer scorrono per conto loro)
    addEventListener('scroll', dopoScroll, { passive: true, capture: true })
    addEventListener('focusin', dopoScroll)
    addEventListener(EVENTO_RICALCOLA, dopoScroll)
    document.documentElement.addEventListener('mouseleave', esci)
    return () => {
      document.documentElement.classList.remove('cursore-personalizzato')
      removeEventListener('pointermove', muovi)
      removeEventListener('pointerdown', giu)
      removeEventListener('pointerup', su)
      removeEventListener('pointercancel', su)
      removeEventListener('blur', perdeFocus)
      removeEventListener('scroll', dopoScroll, { capture: true })
      removeEventListener('focusin', dopoScroll)
      removeEventListener(EVENTO_RICALCOLA, dopoScroll)
      ricalcola.current = () => {}
      document.documentElement.removeEventListener('mouseleave', esci)
      x.tween.kill()
      y.tween.kill()
    }
  }, [])

  const t = { duration: movimento.durata.micro, ease }
  const etichetta = forma.tipo === 'etichetta'

  return (
    <div ref={posizione} aria-hidden="true" className="pointer-events-none fixed top-0 left-0 z-[100]">
      <motion.div
        className="relative"
        initial={false}
        animate={{ scale: premuto ? 0.8 : 1, opacity: visibile && forma.tipo !== 'nascosto' ? 1 : 0 }}
        transition={t}
      >
        {/* disco pieno: punto da 10px oppure lente da 96px con l’etichetta */}
        <motion.div
          className="absolute rounded-full bg-bianco"
          style={{ width: LENTE, height: LENTE, left: -LENTE / 2, top: -LENTE / 2 }}
          initial={false}
          animate={{ scale: etichetta ? 1 : forma.tipo === 'punto' ? PUNTO / LENTE : 0 }}
          transition={t}
        />
        {/* anello da 44px su link e pulsanti */}
        <motion.div
          className="absolute rounded-full border-[1.5px] border-bianco"
          style={{ width: ANELLO, height: ANELLO, left: -ANELLO / 2, top: -ANELLO / 2 }}
          initial={false}
          animate={{ scale: forma.tipo === 'anello' ? 1 : 0.3, opacity: forma.tipo === 'anello' ? 1 : 0 }}
          transition={t}
        />
        <AnimatePresence>
          {etichetta && (
            <motion.span
              key={forma.testo}
              className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-etichetta whitespace-nowrap text-nero"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={t}
            >
              {forma.testo}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

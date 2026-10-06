// preloader (claude.md §6.1): il volto si disegna in proporzione al caricamento reale, con gli occhi chiusi;
// a 100 si sveglia, il contatore esce e il volto vola al suo posto nell’header. Lo scroll si sblocca con il
// pulsante «inizia a scrollare» (Ingresso.tsx), o subito con un link diretto a un progetto.
import { useEffect, useRef, useState } from 'react'
import { Volto, type ManigliaVolto, type StatoVolto } from '@/components/volto/Volto'
import { media, movimento, volto as misure } from '@/config/movimento'
import { avviaCaricamento } from '@/lib/caricamento'
import { gsap, useGSAP } from '@/lib/gsap'
import { fermaScroll, riprendiScroll } from '@/lib/scroll'
import { useAvvio } from './AvvioContext'

const CHIAVE_SESSIONE = 'ab-visitato'

function giaVisitato() {
  try {
    return sessionStorage.getItem(CHIAVE_SESSIONE) === '1'
  } catch {
    return false
  }
}

export function Preloader() {
  const { setPronto, setPreparaScena, entrato, voltoHeader } = useAvvio()
  const [finito, setFinito] = useState(false)
  const [stato, setStato] = useState<StatoVolto>('dorme')
  const radice = useRef<HTMLDivElement>(null)
  const involucro = useRef<HTMLDivElement>(null)
  const contatore = useRef<HTMLSpanElement>(null)
  const volto = useRef<ManigliaVolto>(null)

  // scroll bloccato e pagina in cima per tutta la durata del preloader
  useEffect(() => {
    if (!location.pathname.startsWith('/progetti/')) scrollTo(0, 0)
    fermaScroll()
    return riprendiScroll
  }, [])

  // a preloader finito e ingresso fatto lo scroll torna libero (il componente resta montato, quindi non basta la pulizia sopra)
  useEffect(() => {
    if (finito && entrato) riprendiScroll()
  }, [finito, entrato])

  useGSAP(
    () => {
      const ridotto = matchMedia(media.ridotto).matches
      const breve = giaVisitato()
      const { minimo, massimo, breve: durataBreve } = movimento.preloader
      const durataMinima = breve ? durataBreve : minimo
      const caricamento = avviaCaricamento()
      const inizio = performance.now()
      let mostrato = 0
      let chiuso = false

      const scrivi = (p: number) => {
        if (contatore.current) contatore.current.textContent = String(Math.round(p * 100)).padStart(3, '0')
        volto.current?.disegna(p)
      }
      scrivi(0)

      const fine = () => {
        chiuso = true
        gsap.ticker.remove(tick)
        try {
          sessionStorage.setItem(CHIAVE_SESSIONE, '1')
        } catch {
          // sessione non disponibile: la prossima volta il preloader sarà di nuovo intero
        }

        if (ridotto) {
          gsap.to(radice.current, { opacity: 0, duration: movimento.durata.ridotta, onComplete: chiudi })
          return
        }

        // Le risorse iniziali sono pronte: la GPU lavora durante l’uscita del preloader.
        // Il pulsante d’ingresso mantiene i suoi tempi e non aspetta sala o computer.
        setPreparaScena(true)

        const tl = gsap.timeline({ onComplete: chiudi })
        // il sito si sveglia: occhi aperti, poi il battito (con gli occhi ancora chiusi il volto lo ignorerebbe)
        tl.call(() => setStato('naturale'), [], 0.1)
          .call(() => volto.current?.battito(), [], 0.5)
          // il contatore esce verso il basso
          .to(contatore.current, { yPercent: 110, duration: 0.6, ease: movimento.ease.transizione }, 0.3)
        // il volto vola al suo posto nell’header
        tl.add(() => {
          const da = involucro.current?.getBoundingClientRect()
          const a = voltoHeader.current?.getBoundingClientRect()
          if (!da || !a || !da.width) return
          gsap.to(involucro.current, {
            x: a.left + a.width / 2 - (da.left + da.width / 2),
            y: a.top + a.height / 2 - (da.top + da.height / 2),
            scale: a.width / da.width,
            duration: breve ? 0.8 : 1.2,
            ease: movimento.ease.transizione,
          })
        }, 0.8)
        tl.to({}, { duration: breve ? 0.8 : 1.2 })
      }

      const chiudi = () => {
        setPronto(true)
        setFinito(true)
      }

      // avanzamento mostrato: insegue quello reale, ma non prima della durata minima
      // e comunque arriva a 100 entro la durata massima
      const tick = () => {
        if (chiuso) return
        const trascorso = (performance.now() - inizio) / 1000
        const reale = trascorso >= massimo ? 1 : caricamento.leggi()
        const obiettivo = Math.min(reale, trascorso / durataMinima)
        mostrato += (obiettivo - mostrato) * (ridotto ? 1 : 0.12)
        if (obiettivo >= 1 && mostrato > 0.995) mostrato = 1
        scrivi(mostrato)
        if (mostrato >= 1) fine()
      }
      gsap.ticker.add(tick)
      return () => gsap.ticker.remove(tick)
    },
    { scope: radice },
  )

  if (finito) return null

  return (
    <div ref={radice} aria-hidden="true" className="fixed inset-0 z-50 flex items-center justify-center bg-nero">
      <div ref={involucro} className="will-change-transform">
        <Volto ref={volto} stato={stato} dimensione={misure.preloader} interattivo={false} />
      </div>
      <p className="absolute right-4 bottom-4 overflow-hidden text-etichetta md:right-8 md:bottom-8" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <span ref={contatore} className="block text-[clamp(2.5rem,6vw,5rem)] leading-none font-extralight cifre-tabellari">
          000
        </span>
      </p>
    </div>
  )
}

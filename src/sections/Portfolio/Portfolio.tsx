// Portfolio: dopo l’header la camera scende verso il computer a terra e si ferma su monitor, tastiera e mouse.
// Un clic (o tocco, o Invio) lo accende: la camera entra verso lo schermo, che si usa. Una volta acceso resta acceso.
// Nessun pin: lo scroll avanza sempre; durante la sosta la camera resta ferma sull’inquadratura corrente.
// Con movimento ridotto: scena ferma sul computer già acceso.
import { lazy, Suspense, useEffect, useRef } from 'react'
import { media, movimento } from '@/config/movimento'
import { sito } from '@/config/sito'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { latiDisponibili, percorso, type Lato } from '@/components/volto/percorso'
import { useVolto, type Azione } from '@/components/volto/VoltoContext'
import { accendi, leggiFase, useFaseComputer, type Fase } from '@/components/computer/stato'
import { useAvvio } from '@/components/preloader/AvvioContext'
import { getLenis } from '@/lib/scroll'

// three.js, il modello e l’interfaccia arrivano dopo il preloader: il bundle iniziale resta leggero
const ScenaRidotta = lazy(() => import('@/components/volto/ScenaRidotta'))
const Interfaccia = lazy(() => import('@/components/computer/Interfaccia'))
const C = movimento.computer

export function Portfolio() {
  const ridotto = useMediaQuery(media.ridotto)
  const { pronto } = useAvvio()

  // il modello si scarica dopo il preloader, senza rallentarlo
  useEffect(() => {
    if (pronto) void import('@/components/volto/modelloComputer').then((m) => m.caricaComputer())
  }, [pronto])

  // Cambiando la preferenza di movimento, le posizioni di scroll vanno ricalcolate.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [ridotto])

  return (
    <section
      id="portfolio"
      tabIndex={-1}
      aria-labelledby="titolo-portfolio"
      className={`relative z-20 ${ridotto ? '' : '-mt-[100svh]'}`}
    >
      <h2 id="titolo-portfolio" className="sr-only">
        {sito.sezioni.portfolio}
      </h2>
      {ridotto ? <ComputerFermo /> : <ComputerNelPercorso />}
    </section>
  )
}

function ComputerNelPercorso() {
  const palco = useRef<HTMLDivElement>(null)
  useNascondino()
  useZoom()

  useGSAP(
    () => {
      const stato = percorso.computer
      const vh = () => innerHeight / 100
      gsap.set(stato, { vicino: 0 })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          id: 'portfolio-computer',
          refreshPriority: 20,
          trigger: palco.current,
          start: 'top top',
          end: () => `+=${(C.avvicinamento + C.sosta) * vh()}`,
          scrub: innerWidth < 768 ? movimento.scrub.mobile : movimento.scrub.desktop,
          invalidateOnRefresh: true,
        },
      })
      tl.to(stato, { vicino: 1, duration: C.avvicinamento }, 0)
      // la sosta: la camera resta ferma davanti al computer (larga se spento, vicina se acceso)
      tl.to({}, { duration: C.sosta }, C.avvicinamento)

      // resize e rotazione: le altezze delle sezioni cambiano ma lo scroll resta allo stesso pixel. Chi stava
      // usando il computer resta nella sosta, nello stesso punto (anche con un progetto aperto).
      // La posizione si legge al primo evento resize, prima che i matchMedia dell’header rifacciano il pin
      // (dopo, scrollY è già falsato); negli altri refresh (font, sezioni) basta leggerla al refreshInit.
      let ancora: number | null = null
      let inResize = false
      let scadenza = 0
      // ruotando, il browser può spostare lo scroll prima ancora dell’evento resize: vale la posizione
      // dell’ultimo fotogramma prima del cambio, registrata sul ticker
      let ultimaY = scrollY
      const registra = () => {
        if (!inResize) ultimaY = scrollY
      }
      gsap.ticker.add(registra)
      const segna = (y = scrollY) => {
        const st = tl.scrollTrigger
        ancora = null
        if (!st || st.end <= st.start) return
        const p = (y - st.start) / (st.end - st.start)
        if (p >= C.avvicinamento / (C.avvicinamento + C.sosta) && p <= 1) ancora = p
      }
      const alResize = () => {
        clearTimeout(scadenza)
        // se non segue nessun refresh (piccoli cambi d’altezza su mobile) la posizione non vale più
        scadenza = window.setTimeout(() => {
          inResize = false
          ancora = null
        }, 1500)
        if (inResize) return
        inResize = true
        segna(ultimaY)
      }
      const primaDelRefresh = () => {
        if (!inResize) segna()
      }
      const dopoIlRefresh = () => {
        const st = tl.scrollTrigger
        const p = ancora
        inResize = false
        ancora = null
        if (p === null || !st) return
        const y = Math.round(st.start + (st.end - st.start) * p)
        if (Math.abs(y - scrollY) < 2) return
        const lenis = getLenis()
        if (lenis) {
          lenis.resize()
          lenis.scrollTo(y, { immediate: true, force: true })
        } else scrollTo(0, y)
        st.update()
        st.getTween()?.progress(1)
      }
      addEventListener('resize', alResize, { passive: true })
      ScrollTrigger.addEventListener('refreshInit', primaDelRefresh)
      ScrollTrigger.addEventListener('refresh', dopoIlRefresh)
      return () => {
        clearTimeout(scadenza)
        gsap.ticker.remove(registra)
        removeEventListener('resize', alResize)
        ScrollTrigger.removeEventListener('refreshInit', primaDelRefresh)
        ScrollTrigger.removeEventListener('refresh', dopoIlRefresh)
        gsap.set(stato, { vicino: 0 })
      }
    },
    { scope: palco },
  )

  return (
    // spazio di scroll: avvicinamento e sosta, più uno schermo prima che arrivi la biografia
    <div ref={palco} className="pointer-events-none" style={{ height: `calc(${C.avvicinamento + C.sosta}svh + 100svh)` }}>
      <div className="pointer-events-auto">
        <Suspense fallback={null}>
          <Interfaccia modo="percorso" />
        </Suspense>
      </div>
    </div>
  )
}

/**
 * Zoom dell’accensione: con il clic la camera entra dall’inquadratura larga a quella davanti allo schermo,
 * con un movimento suo (GSAP su percorso.computer.zoom), non legato allo scroll. Acceso senza avvio
 * (link diretto, ritorno dal movimento ridotto): subito vicina. Il computer non si spegne più, lo zoom resta.
 */
let tweenZoom: gsap.core.Tween | null = null
const zoomInCorso = () => Boolean(tweenZoom?.isActive())
function useZoom() {
  const fase = useFaseComputer()
  const prima = useRef<Fase>(leggiFase())
  useEffect(() => {
    const c = percorso.computer
    const era = prima.current
    prima.current = fase
    if (fase === 'spento') {
      tweenZoom?.kill()
      c.zoom = 0
    } else if (fase === 'avvio' && era === 'spento') {
      tweenZoom?.kill()
      tweenZoom = gsap.to(c, { zoom: 1, duration: C.zoom.durata, ease: C.zoom.ease })
    } else if (fase === 'acceso') {
      tweenZoom?.kill()
      tweenZoom = null
      c.zoom = 1
    }
  }, [fase])
}

/**
 * Nascondino del volto dietro il monitor: esce da un lato, resta qualche secondo, rientra e cambia lato.
 * GSAP anima percorso.computer.sbircia, la scena lo legge per fotogramma (leggiPosa); fuori dalla sosta non si vede.
 * Aprendo o chiudendo un progetto, se è nascosto sbuca subito e ripete l’espressione quando è fuori.
 */
function useNascondino() {
  const { umore, azione, ascoltaAzioni } = useVolto()
  const dorme = useRef(false)
  useEffect(() => {
    dorme.current = umore === 'dorme'
  }, [umore])

  useEffect(() => {
    const S = movimento.computer.sbircia
    const sb = percorso.computer.sbircia
    const caso = (min: number, max: number) => min + Math.random() * (max - min)
    // fermi davanti al computer (non durante la discesa, lo zoom o verso la biografia)
    const davanti = () =>
      percorso.computer.vicino >= 0.999 && percorso.stazione < 1.001 && !zoomInCorso()
    let attesa: gsap.core.Tween | null = null
    let giro: gsap.core.Timeline | null = null
    let ultimo: Lato | null = null
    let ripeto = false

    const aspetta = () => {
      attesa = gsap.delayedCall(caso(S.nascostoMin, S.nascostoMax), () => esci())
    }
    const esci = (poi?: () => void) => {
      attesa?.kill()
      const lati = latiDisponibili()
      const scelti = lati.length > 1 ? lati.filter((l) => l !== ultimo) : lati
      if (!scelti.length || dorme.current || !davanti()) return aspetta()
      ultimo = sb.lato = scelti[Math.floor(Math.random() * scelti.length)]
      giro = gsap
        .timeline({ onComplete: aspetta })
        .to(sb, { uscita: 1, duration: S.uscita, ease: 'back.out(1.4)', onComplete: poi })
        .to(sb, { uscita: 0, duration: S.rientro, ease: 'power2.in' }, `+=${caso(S.restaMin, S.restaMax)}`)
    }
    // reazioni del Finder: le vede solo chi sta davanti allo schermo
    const smetti = ascoltaAzioni((a: Azione) => {
      if (ripeto || a === 'battito' || !davanti() || giro?.isActive()) return
      esci(() => {
        ripeto = true
        azione(a)
        ripeto = false
      })
    })
    aspetta()
    return () => {
      smetti()
      attesa?.kill()
      giro?.kill()
      sb.uscita = 0
    }
  }, [azione, ascoltaAzioni])
}

function ComputerFermo() {
  // già acceso, senza avvio; resta acceso anche tornando al movimento normale
  useEffect(() => accendi(true), [])
  return (
    <div className="relative h-svh min-h-[32rem] overflow-hidden">
      <Suspense fallback={null}>
        <ScenaRidotta />
      </Suspense>
      <Suspense fallback={null}>
        <Interfaccia modo="ridotto" />
      </Suspense>
    </div>
  )
}

import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router'
import { AudioComputer } from './components/audio/AudioComputer'
import { Ingresso } from './components/audio/Ingresso'
import { PulsanteAudio } from './components/audio/PulsanteAudio'
import { Cursore } from './components/cursore/Cursore'
import { LogoContinuo } from './components/volto/LogoContinuo'
import { Grana } from './components/effetti/Grana'
import { useAvvio } from './components/preloader/AvvioContext'
import { Preloader } from './components/preloader/Preloader'
import { accendi } from './components/computer/stato'
import { movimento } from './config/movimento'
import { ScrollTrigger } from './lib/gsap'
import { trovaProgetto } from './lib/progetti'
import { aggiornaDopoCaricamento, avviaScroll, getLenis } from './lib/scroll'
import { RotteModali } from './router'
import { ChiSono } from './sections/ChiSono/ChiSono'
import { Contatti } from './sections/Contatti/Contatti'
import { Header } from './sections/Header/Header'
import { Portfolio } from './sections/Portfolio/Portfolio'

// pagina di prova: esiste solo in sviluppo, nel sito pubblicato non viene nemmeno inclusa
const Laboratorio = import.meta.env.DEV ? lazy(() => import('./laboratorio/Laboratorio')) : null

export default function App() {
  const { pathname } = useLocation()
  const { pronto, entrato } = useAvvio()
  const laboratorio = Boolean(Laboratorio) && pathname === '/laboratorio'

  useEffect(() => {
    const ferma = avviaScroll()
    aggiornaDopoCaricamento()
    return ferma
  }, [])

  // a sito pronto: posizioni ricalcolate; con un link diretto a un progetto, la home va davanti al computer acceso
  useEffect(() => {
    if (!pronto) return
    ScrollTrigger.refresh()
    if (pathname.startsWith('/progetti/') && trovaProgetto(pathname.split('/')[2])) {
      const computer = ScrollTrigger.getById('portfolio-computer')
      if (computer) {
        // a metà della sosta, su tutti i dispositivi
        const { avvicinamento, sosta } = movimento.computer
        const y = computer.start + (avvicinamento + sosta / 2) * (innerHeight / 100)
        const lenis = getLenis()
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
        else scrollTo(0, y)
        computer.getTween()?.progress(1)
        accendi(true)
      } else document.getElementById('portfolio')?.scrollIntoView()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto])

  if (laboratorio && Laboratorio)
    return (
      <>
        <Suspense fallback={null}>
          <Laboratorio />
        </Suspense>
        <Cursore />
        <Grana />
      </>
    )

  return (
    <>
      {/* fino all’ingresso la pagina non si usa: niente focus o scroll verso elementi nascosti */}
      <main aria-busy={!pronto} inert={!entrato}>
        <Header />
        <Portfolio />
        <ChiSono />
        <Contatti />
      </main>
      <LogoContinuo />
      {pronto && <RotteModali />}
      <Preloader />
      <Ingresso />
      <PulsanteAudio />
      <AudioComputer />
      <Cursore />
      <Grana />
    </>
  )
}

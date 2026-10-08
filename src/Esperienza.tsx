import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router'
import { AudioComputer } from './components/audio/AudioComputer'
import { LogoContinuo } from './components/volto/LogoContinuo'
import { Grana } from './components/effetti/Grana'
import { useAvvio } from './components/preloader/AvvioContext'
import { Preloader } from './components/preloader/Preloader'
import { ScrollTrigger } from './lib/gsap'
import { tornaA, getLenis, type Destinazione } from './lib/scroll'
import { Header } from './sections/Header/Header'
import { Portfolio } from './sections/Portfolio/Portfolio'
import { ChiSono } from './sections/ChiSono/ChiSono'
import { Contatti } from './sections/Contatti/Contatti'

const posizioni = new Map<string, { y: number; focus: HTMLElement | null }>()
export default function Esperienza() {
  const location = useLocation()
  const navigazione = useNavigationType()
  const { pronto, entrato, scenaAttiva, ingressoVisibile } = useAvvio()
  useLayoutEffect(() => {
    if (!pronto || !scenaAttiva) return
    ScrollTrigger.refresh()
    const salvata = navigazione === 'POP' ? posizioni.get(location.key) : undefined
    if (salvata) {
      if (getLenis()) getLenis()!.scrollTo(salvata.y, { immediate: true, force: true })
      else scrollTo(0, salvata.y)
      ScrollTrigger.update()
      salvata.focus?.focus({ preventScroll: true })
    } else {
      tornaA((location.hash.slice(1) || 'header') as Destinazione, true)
    }
    let y = scrollY
    let focus = document.activeElement as HTMLElement | null
    const salva = () => { y = scrollY; posizioni.set(location.key, { y, focus }) }
    const ricordaFocus = (e: FocusEvent) => { focus = e.target as HTMLElement; salva() }
    salva()
    addEventListener('scroll', salva, { passive: true })
    document.addEventListener('focusin', ricordaFocus)
    return () => {
      removeEventListener('scroll', salva)
      document.removeEventListener('focusin', ricordaFocus)
      posizioni.set(location.key, { y, focus })
    }
  }, [pronto, scenaAttiva, location.key, location.hash, navigazione])
  useEffect(() => {
    if (!pronto) return
    // Il layout del Finder può arrivare dopo il completamento del preloader.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pronto])
  return <>
    <main aria-busy={!pronto} inert={!entrato || !scenaAttiva} aria-hidden={ingressoVisibile || undefined}>
      <Header /><Portfolio /><ChiSono /><Contatti />
    </main>
    <LogoContinuo />
    <Preloader />
    {scenaAttiva && <AudioComputer />}
    {scenaAttiva && <Grana />}
  </>
}

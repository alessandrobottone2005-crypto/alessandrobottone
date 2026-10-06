import { Component, lazy, Suspense, useEffect, useRef, type ReactNode } from 'react'
import { useAvvio } from '@/components/preloader/AvvioContext'
import { gsap } from '@/lib/gsap'
import { leggiPosa, percorso } from './percorso'
import { Volto } from './Volto'
import { useVolto } from './VoltoContext'

const Scena = lazy(() => import('./Volto3D'))

class ScenaProtetta extends Component<{ children: ReactNode }, { rotto: boolean }> {
  state = { rotto: false }
  static getDerivedStateFromError() {
    return { rotto: true }
  }
  componentDidCatch(errore: unknown) {
    console.warn('volto 3d non disponibile:', errore)
    // il chi sono mostra l’avatar fermo al posto dell’ologramma
    document.documentElement.dataset.voltoRiserva = ''
  }
  render() {
    return this.state.rotto ? <Riserva /> : this.props.children
  }
}
function Riserva() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const aggiorna = () => {
      if (!ref.current) return
      const p = leggiPosa()
      const host = ref.current.parentElement
      if (host) {
        host.style.opacity = '1'
        host.dataset.fase = p.fase
      }
      Object.assign(ref.current.style, {
        width: `${p.larghezza}px`,
        left: `${p.x}px`,
        top: `${p.y}px`,
        // nel chi sono il posto del logo è dell’avatar
        opacity: String(p.fase === 'biografia' && percorso.biografia.ologramma > 0.5 ? 0 : p.opacity),
        transform: 'translate(-50%,-50%)',
      })
    }
    gsap.ticker.add(aggiorna)
    return () => gsap.ticker.remove(aggiorna)
  }, [])
  return (
    <div ref={ref} className="absolute">
      <Volto dimensione="100%" interattivo={false} />
    </div>
  )
}
export function LogoContinuo() {
  const { pronto, preparaScena } = useAvvio()
  const { azione, ridotto } = useVolto()
  useEffect(() => {
    if (!pronto || ridotto) return
    const clic = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target instanceof Element && e.target.closest('button,a,[role="dialog"],[data-mac]'))) return
      const p = leggiPosa(),
        altezza = (p.larghezza * 180) / 247.41
      if (p.opacity > 0.5 && Math.abs(e.clientX - p.x) < p.larghezza / 2 && Math.abs(e.clientY - p.y) < altezza / 2)
        azione('occhiolino')
    }
    addEventListener('pointerup', clic)
    return () => removeEventListener('pointerup', clic)
  }, [pronto, ridotto, azione])
  if ((!pronto && !preparaScena) || ridotto) return null
  return (
    <div data-logo-continuo aria-hidden="true" className="pointer-events-none fixed inset-0 z-10">
      <ScenaProtetta>
        <Suspense fallback={<Riserva />}>
          <Scena />
        </Suspense>
      </ScenaProtetta>
    </div>
  )
}

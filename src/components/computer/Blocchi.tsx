// i blocchi del progetto, nell’ordine di progetto.json, dentro la finestra del computer (claude.md §6.5).
// ogni tipo si scarica solo quando serve (react.lazy): pdf, 3d e video pesano parecchio.
import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { sito } from '@/config/sito'
import type { Blocco } from '@/lib/progetti'

const Pdf = lazy(() => import('./blocchi/Pdf'))
const Modello3D = lazy(() => import('./blocchi/Modello3D'))
const Video = lazy(() => import('./blocchi/Video'))
const Immagini = lazy(() => import('./blocchi/Immagini'))
const Testo = lazy(() => import('./blocchi/Testo'))

/** spazio d’attesa mentre il blocco si scarica: stessa forma del blocco, così la pagina non salta */
function Attesa({ forma }: { forma: string }) {
  return <div aria-hidden="true" className={`${forma} animate-pulse rounded-card border border-grigio motion-reduce:animate-none`} />
}

/** se un blocco si rompe, il resto della finestra continua a funzionare */
class Confine extends Component<{ children: ReactNode }, { rotto: boolean }> {
  state = { rotto: false }
  static getDerivedStateFromError() {
    return { rotto: true }
  }
  componentDidCatch(errore: unknown) {
    console.warn('blocco del progetto non disponibile:', errore)
  }
  render() {
    return this.state.rotto ? <div className="archivio-errore" role="status"><p>{sito.archivio.errore}</p><button type="button" onClick={() => location.reload()}>{sito.archivio.ricarica}</button></div> : this.props.children
  }
}

function Contenuto({ blocco, titolo, ripristina }: { blocco: Blocco; titolo: string; ripristina: boolean }) {
  switch (blocco.tipo) {
    case 'pdf':
      return <Pdf file={blocco.file} titolo={titolo} />
    case 'modello3d':
      return <Modello3D file={blocco.file} titolo={titolo} />
    case 'video':
      return <Video blocco={blocco} titolo={titolo} />
    case 'immagini':
      return <Immagini prioritaria={ripristina} file={blocco.file} layout={blocco.layout} titolo={titolo} />
    case 'testo':
      return <Testo testo={blocco.testo} />
  }
}

const FORME: Record<Blocco['tipo'], string> = {
  pdf: 'aspect-[4/3]',
  modello3d: 'aspect-4/5 md:aspect-video',
  video: 'aspect-video',
  immagini: 'aspect-video',
  testo: 'h-24',
}

/** Il modulo pesante non viene importato finché il blocco non si avvicina alla lettura. */
function Vicino({ blocco, titolo, ripristina }: { blocco: Blocco; titolo: string; ripristina: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [attivo, setAttivo] = useState(false)
  const differito = blocco.tipo === 'pdf' || blocco.tipo === 'modello3d' || blocco.tipo === 'video'
  useEffect(() => {
    if (attivo || !differito || ripristina) return
    const el = ref.current!
    const root = el.closest('.archivio-scroll')
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAttivo(true); observer.disconnect() }
    }, { root, rootMargin: `${root?.clientHeight ?? innerHeight}px 0px` })
    observer.observe(el)
    return () => observer.disconnect()
  }, [attivo, differito, ripristina])
  return <div ref={ref} data-blocco={blocco.tipo}>
    <Suspense fallback={<Attesa forma={FORME[blocco.tipo]} />}>
      {!differito || attivo || ripristina ? <Contenuto blocco={blocco} titolo={titolo} ripristina={ripristina} /> : <Attesa forma={FORME[blocco.tipo]} />}
    </Suspense>
  </div>
}

export function Blocchi({ blocchi, titolo, ripristina = false }: { blocchi: Blocco[]; titolo: string; ripristina?: boolean }) {
  return blocchi.map((blocco, i) => (
    <Confine key={i}><Vicino blocco={blocco} titolo={titolo} ripristina={ripristina} /></Confine>
  ))
}

import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router'
import { Ingresso } from './components/audio/Ingresso'
import { Cursore } from './components/cursore/Cursore'
import { ConfineCaricamento } from './components/preloader/ConfineCaricamento'
import { useAvvio } from './components/preloader/AvvioContext'
import { aggiornaDopoCaricamento, avviaScroll } from './lib/scroll'
import { sito } from './config/sito'
import { RotteModali } from './router'

const Esperienza = lazy(() => import('./Esperienza'))
const ArchivioProgetti = lazy(() => import('./components/progetti/ArchivioProgetti'))
const Laboratorio = import.meta.env.DEV ? lazy(() => import('./laboratorio/Laboratorio')) : null
const attesa = <p className="caricamento-interfaccia" role="status">{sito.archivio.caricamento}</p>
export default function App() {
  const { pathname } = useLocation()
  const { esperienzaRichiesta } = useAvvio()
  useEffect(() => {
    const ferma = avviaScroll()
    aggiornaDopoCaricamento()
    return ferma
  }, [])
  if (Laboratorio && pathname === '/laboratorio') return <Suspense fallback={attesa}><Laboratorio /></Suspense>
  return <>
    {esperienzaRichiesta && <ConfineCaricamento><Suspense fallback={attesa}><Esperienza /></Suspense></ConfineCaricamento>}
    <Ingresso />
    <RotteModali />
    <Cursore />
    <ConfineCaricamento><Suspense fallback={pathname.startsWith('/progetti') ? attesa : null}><ArchivioProgetti /></Suspense></ConfineCaricamento>
  </>
}

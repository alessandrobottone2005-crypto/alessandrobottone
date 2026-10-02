// Applicazioni della scrivania: scacchi, paint, dediche. Il codice di ognuna è un chunk a parte
// (React.lazy): si scarica solo aprendo la finestra, il caricamento iniziale non cambia.
import { Component, lazy, Suspense, type ReactNode } from 'react'
import { sito } from '@/config/sito'
import type { App } from './elenco'
import './app.css'

const Scacchi = lazy(() => import('./Scacchi'))
const Paint = lazy(() => import('./Paint'))
const Dediche = lazy(() => import('./Dediche'))

/** se un’applicazione non si scarica o si rompe, il resto del computer continua a funzionare */
class Confine extends Component<{ children: ReactNode }, { rotto: boolean }> {
  state = { rotto: false }
  static getDerivedStateFromError() {
    return { rotto: true }
  }
  componentDidCatch(errore: unknown) {
    console.warn('applicazione non disponibile:', errore)
  }
  render() {
    return this.state.rotto ? <p className="app-avviso">{sito.app.errore}</p> : this.props.children
  }
}

export function ContenutoApp({ app, onApri }: { app: App; onApri: (app: App) => void }) {
  return (
    <Confine>
      <Suspense fallback={<p className="app-avviso">{sito.app.caricamento}</p>}>
        {app === 'scacchi' ? <Scacchi /> : app === 'paint' ? <Paint onInviata={() => onApri('dediche')} /> : <Dediche />}
      </Suspense>
    </Confine>
  )
}

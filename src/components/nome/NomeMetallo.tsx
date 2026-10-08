// il nome in metallo si carica a parte: se il 3d non è disponibile resta la scritta dom
import { Component, lazy, Suspense, type ReactNode, type RefObject } from 'react'

const Nome3D = lazy(() => import('./Nome3D'))

class Protetto extends Component<{ children: ReactNode }, { rotto: boolean }> {
  state = { rotto: false }
  static getDerivedStateFromError() {
    return { rotto: true }
  }
  componentDidCatch(errore: unknown) {
    console.warn('nome 3d non disponibile:', errore)
  }
  render() {
    return this.state.rotto ? null : this.props.children
  }
}

export function NomeMetallo({ radice, attivo }: { radice: RefObject<HTMLElement | null>; attivo: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40">
      <Protetto>
        <Suspense fallback={null}>
          <Nome3D radice={radice} attivo={attivo} />
        </Suspense>
      </Protetto>
    </div>
  )
}

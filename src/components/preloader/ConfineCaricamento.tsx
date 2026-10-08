import { Component, type ReactNode } from 'react'
import { sito } from '@/config/sito'

/** Un chunk respinto da React.lazy richiede una nuova richiesta di pagina. */
export class ConfineCaricamento extends Component<{ children: ReactNode }, { errore: boolean }> {
  state = { errore: false }
  static getDerivedStateFromError() { return { errore: true } }
  render() {
    return this.state.errore ? <div className="caricamento-interfaccia" role="alert">
      <p>{sito.archivio.errore}</p><button type="button" onClick={() => location.reload()}>{sito.archivio.riprova}</button>
    </div> : this.props.children
  }
}

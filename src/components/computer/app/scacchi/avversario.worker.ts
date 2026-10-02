// Web worker dell’avversario: riceve la posizione, risponde con la mossa scelta.
import { scegliMossa, type Livello } from './avversario'

self.onmessage = (e: MessageEvent<{ partita: number; fen: string; livello: Livello }>) => {
  const { partita, fen, livello } = e.data
  postMessage({ partita, fen, mossa: scegliMossa(fen, livello) })
}

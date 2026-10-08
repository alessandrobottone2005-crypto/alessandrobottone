// La scelta iniziale non carica la scena né avvia l’audio del portfolio.
import { Link, useNavigate } from 'react-router'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { Bottone } from '@/components/bottoni/Bottone'
import { useAvvio } from '@/components/preloader/AvvioContext'
import { ingresso, sito } from '@/config/sito'
import { audio } from '@/lib/audio/motore'
import { fermaScroll, riprendiScroll } from '@/lib/scroll'

export function Ingresso() {
  const navigate = useNavigate()
  const ultimoFocus = useRef<string | null>(null)
  const { ingressoVisibile, richiediEsperienza } = useAvvio()
  useEffect(() => {
    if (!ingressoVisibile) return
    fermaScroll('ingresso')
    return () => riprendiScroll('ingresso')
  }, [ingressoVisibile])
  useLayoutEffect(() => {
    if (ingressoVisibile && ultimoFocus.current) document.querySelector<HTMLElement>(ultimoFocus.current)?.focus({ preventScroll: true })
  }, [ingressoVisibile])
  if (!ingressoVisibile) return null
  return <main onFocusCapture={(e) => { ultimoFocus.current = e.target.closest('[data-ingresso-progetti]') ? '[data-ingresso-progetti]' : '.ingresso-esperienza button' }} className="ingresso-rapido" aria-labelledby="ingresso-nome" aria-busy="false">
    <div className="ingresso-identita">
      <h1 id="ingresso-nome">{sito.nome}<br />{sito.cognome}</h1>
      <p>{ingresso.descrizione}</p>
    </div>
    <div className="ingresso-azioni">
      <Link className="ingresso-progetti" to="/progetti" data-ingresso-progetti>{ingresso.progetti}</Link>
      <Bottone testo={ingresso.pulsante} dimensione="big" className="ingresso-esperienza" onClick={() => {
        void audio.avvia()
        richiediEsperienza()
        navigate('/#header')
      }} />
    </div>
  </main>
}

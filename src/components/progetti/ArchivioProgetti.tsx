import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useMatch, useNavigate } from 'react-router'
import { ArrowLeft, ArrowUpRight, Monitor } from 'lucide-react'
import { sito } from '@/config/sito'
import { disciplineVisibili } from '@/config/discipline'
import { media } from '@/config/movimento'
import { progetti, trovaProgetto } from '@/lib/progetti'
import type { Disciplina } from '@/lib/schema'
import { fermaScroll, riprendiScroll } from '@/lib/scroll'
import { useVolto } from '@/components/volto/VoltoContext'
import { Blocchi } from '@/components/computer/Blocchi'
import { TitoloVolto } from '@/components/computer/BarraMenu'
import { useAvvio } from '@/components/preloader/AvvioContext'
import { usePosizioneProgetto } from './usePosizioneProgetto'
import { ImmagineEspandibile } from './ImmagineEspandibile'
import '@/components/computer/computer.css'
import './archivio.css'

const T = sito.archivio
const FILTRI = ['branding', 'illustrazione', '3d', 'web design'].filter((d) => disciplineVisibili.includes(d as Disciplina)) as Disciplina[]
type Navigazione = { dalComputer?: boolean; dallArchivio?: boolean } | null

/** Il dialog nativo vive nel top layer, fuori dal vetro e da tutti gli effetti della scena. */
export default function ArchivioProgetti() {
  const location = useLocation()
  const navigate = useNavigate()
  const slug = useMatch('/progetti/:slug')?.params.slug
  const progetto = trovaProgetto(slug)
  const aperto = location.pathname.replace(/\/$/, '') === '/progetti' || Boolean(progetto)
  const [filtro, setFiltro] = useState<Disciplina | 'tutti'>('tutti')
  const dialog = useRef<HTMLDialogElement>(null)
  const scorrimento = useRef<HTMLDivElement>(null)
  const titolo = useRef<HTMLHeadingElement>(null)
  const ultimaScheda = useRef<string | null>(null)
  const { azione } = useVolto()
  const { richiediEsperienza } = useAvvio()
  const ripristinaMateriali = usePosizioneProgetto(scorrimento, location.key, aperto)
  const stato = location.state as Navigazione
  const ingressoDalComputer = useEffectEvent(() => Boolean(stato?.dalComputer))

  useLayoutEffect(() => {
    if (!aperto || !dialog.current) return
    const el = dialog.current
    const vetro = document.querySelector('.mac-schermo')?.getBoundingClientRect()
    fermaScroll('progetti')
    el.showModal()
    const animazione = ingressoDalComputer() && vetro && vetro.width > 0 && !matchMedia(media.ridotto).matches
      ? el.animate([
          { transform: `translate(${vetro.x}px, ${vetro.y}px) scale(${vetro.width / innerWidth}, ${vetro.height / innerHeight})`, clipPath: 'inset(0 round 24px)' },
          { transform: 'translate(0, 0) scale(1)', clipPath: 'inset(0 round 0px)' },
        ], { duration: 460, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })
      : null
    return () => {
      animazione?.cancel()
      el.close()
      riprendiScroll('progetti')

    }
  }, [aperto])

  useLayoutEffect(() => {
    if (!aperto || !scorrimento.current) return
    const area = scorrimento.current
    const scheda = !progetto && ultimaScheda.current
      ? area.querySelector<HTMLElement>(`[data-progetto="${ultimaScheda.current}"]`)
      : null
    ;(scheda ?? titolo.current)?.focus({ preventScroll: true })
  }, [aperto, progetto])

  useEffect(() => {
    if (progetto) azione('sorriso')
  }, [progetto, azione])

  const tornaArchivio = () => {
    if (stato?.dallArchivio) navigate(-1)
    else navigate('/progetti', { replace: true })
  }
  const tornaComputer = () => {
    richiediEsperienza()
    navigate('/#portfolio')
    azione('occhiolino')
  }
  const elenco = filtro === 'tutti' ? progetti : progetti.filter((p) => p.discipline.includes(filtro))

  if (!aperto) return null
  return createPortal(
    <dialog ref={dialog} className="archivio" data-mac aria-labelledby="archivio-titolo" onKeyDown={(e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      e.preventDefault()
      e.stopPropagation()
      if (progetto) tornaArchivio()
      else tornaComputer()
    }} onCancel={(e) => {
      e.preventDefault()
      if (progetto) tornaArchivio()
      else tornaComputer()
    }}>
      <header className="archivio-barra">
        {progetto ? <button type="button" className="archivio-comando" aria-label={T.indietro} onClick={tornaArchivio}><ArrowLeft size={18} aria-hidden="true" /><span className="archivio-etichetta-lunga" aria-hidden="true">{T.indietro}</span><span className="archivio-etichetta-breve" aria-hidden="true">{T.archivioBreve}</span></button> : <span className="archivio-marchio" aria-hidden="true"><TitoloVolto /></span>}
        <div className="archivio-righe"><h1 id="archivio-titolo" ref={titolo} tabIndex={-1}>{progetto?.titolo ?? T.titolo}</h1></div>
        <button type="button" className="archivio-comando" aria-label={T.computer} onClick={tornaComputer}><Monitor size={18} aria-hidden="true" /><span className="archivio-etichetta-lunga" aria-hidden="true">{T.computer}</span><span className="archivio-etichetta-breve" aria-hidden="true">{T.computerBreve}</span></button>
      </header>
      {!progetto && <nav className="archivio-filtri" aria-label={T.filtri}>
        <div>{(['tutti', ...FILTRI] as const).map((f) => <button key={f} type="button" aria-pressed={filtro === f} onClick={() => {
          setFiltro(f)
          if (scorrimento.current) scorrimento.current.scrollTop = 0
        }}>{f === 'tutti' ? T.tutti : f}</button>)}</div>
        <p aria-live="polite">{T.conteggio(elenco.length)}</p>
      </nav>}
      <div ref={scorrimento} className="archivio-scroll" data-lenis-prevent>
        {progetto ? <article key={progetto.slug} className="archivio-progetto">
          <ImmagineEspandibile src={progetto.copertina} alt={sito.computer.copertina(progetto.titolo)} copertina />
          <div className="archivio-introduzione">
            <p className="archivio-meta">{[progetto.discipline.join(', '), progetto.anno, progetto.cliente].filter(Boolean).join(' · ')}</p>
            <p>{progetto.descrizione}</p>
          </div>
          <div className="archivio-blocchi"><Blocchi blocchi={progetto.blocchi} titolo={progetto.titolo} ripristina={ripristinaMateriali} /></div>
          <footer className="archivio-contatti"><button type="button" className="archivio-comando" onClick={() => {
            richiediEsperienza()
            navigate('/#contatti')
          }}>{sito.sezioni.contatti}<ArrowUpRight size={18} aria-hidden="true" /></button></footer>
        </article> : <>
          <ul className="archivio-griglia">{elenco.map((p) => <li key={p.slug}>
            <Link to={`/progetti/${p.slug}`} state={{ dallArchivio: true }} data-progetto={p.slug} className="archivio-scheda" aria-label={T.apri(p.titolo)} onClick={() => {
              ultimaScheda.current = p.slug
            }}>
              <div className="archivio-anteprima"><img src={p.copertina} alt={sito.computer.copertina(p.titolo)} loading="lazy" decoding="async" /></div>
              <div className="archivio-didascalia"><h2>{p.titolo}</h2><ArrowUpRight size={20} aria-hidden="true" /></div>
              <p className="archivio-meta">{p.discipline.join(', ')} · {p.anno}</p>
            </Link>
          </li>)}</ul>
          {elenco.length === 0 && <p className="archivio-vuoto">{T.vuoto}</p>}
        </>}
      </div>
    </dialog>, document.body,
  )
}

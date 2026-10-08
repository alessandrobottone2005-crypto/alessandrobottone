// Desktop del Macintosh: progetti a tutta vista e applicazioni conservate nel monitor.
import { useCallback, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { sito } from '@/config/sito'
import { BarraMenu, TitoloVolto, type Menu } from './BarraMenu'
import { Finestra, type Rettangolo } from './Finestra'
import { IconaCartella, IconaDediche, IconaPaint, IconaScacchi } from './icone'
import { ContenutoApp } from './app/Applicazioni'
import { APPLICAZIONI, type App } from './app/elenco'
import { clic, disco } from './app/suoni'

const ALTEZZA_BARRA = 24

type IdFinestra = `app:${App}` | 'informazioni'
const ICONE_APP: Record<App, () => ReactNode> = { scacchi: IconaScacchi, paint: IconaPaint, dediche: IconaDediche }
const titoloDi = (id: IdFinestra) =>
  id === 'informazioni' ? sito.computer.voci.informazioni : sito.app[id.slice('app:'.length) as App].nome

/** clic seleziona, doppio clic apre; con tocco, penna o tastiera basta un’attivazione */
function useAttivazione(onSeleziona: () => void, onApri: () => void) {
  const tipo = useRef('mouse')
  return {
    onPointerDown: (e: PointerEvent) => (tipo.current = e.pointerType),
    onClick: (e: MouseEvent) => {
      clic()
      if (e.detail === 0 || tipo.current !== 'mouse') onApri()
      else onSeleziona()
    },
    onDoubleClick: onApri,
  }
}

function Icona({
  etichetta,
  selezionata,
  onSeleziona,
  onApri,
  children,
  ...resto
}: {
  etichetta: string
  selezionata: boolean
  onSeleziona: () => void
  onApri: () => void
  children: ReactNode
  'data-icona'?: string
}) {
  const attivazione = useAttivazione(onSeleziona, onApri)
  return (
    <button type="button" className="mac-icona" data-selezionata={selezionata || undefined} {...attivazione} {...resto}>
      {children}
      <span className="mac-etichetta">{etichetta}</span>
    </button>
  )
}

type Props = { larghezza: number; altezza: number; telefono: boolean; scala: () => number }

export function Finder({ larghezza, altezza, telefono, scala }: Props) {
  const navigate = useNavigate()
  const [aperte, setAperte] = useState<IdFinestra[]>([])
  const [posizioni, setPosizioni] = useState<Partial<Record<IdFinestra, { x: number; y: number }>>>({})
  const [selezione, setSelezione] = useState<string | null>(null)
  const [annuncio, setAnnuncio] = useState('')
  const aprenti = useRef(new Map<IdFinestra, HTMLElement>())
  const scrivania = useRef<HTMLDivElement>(null)
  // su telefono ogni finestra occupa la scrivania
  const piena = telefono
  const alta = altezza - ALTEZZA_BARRA

  const rettangoloDi = useCallback(
    (id: IdFinestra): Rettangolo => {
      if (id === 'informazioni') {
        const l = Math.min(360, larghezza - 40)
        return { x: Math.round((larghezza - l) / 2), y: Math.round(alta * 0.2), larghezza: l, altezza: Math.min(220, alta - 40) }
      }
      if (id.startsWith('app:')) {
        const app = id.slice('app:'.length) as App
        // paint: quasi tutto lo schermo; scacchi: una scacchiera quadrata; dediche: una cartella grande
        const l = app === 'paint' ? Math.min(larghezza - 24, 760) : app === 'scacchi' ? Math.min(larghezza - 40, 420) : Math.min(larghezza - 40, 500)
        const h = app === 'paint' ? alta - 16 : app === 'scacchi' ? Math.min(alta - 24, 470) : Math.min(alta - 30, 400)
        const base = { x: Math.max(8, Math.round((larghezza - l) / 2) + (app === 'dediche' ? 24 : 0)), y: Math.max(6, Math.round((alta - h) / 2)) }
        const p = posizioni[id] ?? base
        return { ...p, larghezza: l, altezza: h }
      }
      return { x: 0, y: 0, larghezza, altezza: alta }
    },
    [larghezza, alta, posizioni],
  )

  const primoPiano = useCallback((id: IdFinestra) => {
    setAperte((a) => (a.at(-1) === id ? a : [...a.filter((f) => f !== id), id]))
  }, [])

  const apriFinestra = (id: IdFinestra) => {
    const attivo = document.activeElement
    if (attivo instanceof HTMLElement && !aprenti.current.has(id)) aprenti.current.set(id, attivo)
    primoPiano(id)
    setAnnuncio(sito.computer.aperta(titoloDi(id)))
    // aprendo un’applicazione il disco lavora
    if (id.startsWith('app:')) disco()
  }

  const apriArchivio = () => {
    clic()
    setSelezione('progetti')
    navigate('/progetti', { state: { dalComputer: true } })
  }

  const chiudiFinestra = (id: IdFinestra) => {
    const titolo = titoloDi(id)
    setAperte((a) => a.filter((f) => f !== id))
    setAnnuncio(sito.computer.chiusa(titolo))
    const aprente = aprenti.current.get(id)
    aprenti.current.delete(id)
    requestAnimationFrame(() => {
      if (aprente?.isConnected) aprente.focus({ preventScroll: true })
      else scrivania.current?.querySelector<HTMLElement>('.mac-icona')?.focus({ preventScroll: true })
    })
  }

  const davanti = aperte.at(-1)
  const apriSelezione = () => {
    if (selezione === 'progetti') apriArchivio()
    else if (selezione?.startsWith('app:')) apriFinestra(selezione as IdFinestra)
  }

  const menu: Menu[] = [
    {
      id: 'volto',
      etichetta: sito.computer.menu.volto,
      titolo: <TitoloVolto />,
      voci: [{ testo: sito.computer.voci.informazioni, azione: () => apriFinestra('informazioni') }],
    },
    {
      id: 'archivio',
      etichetta: sito.computer.menu.archivio,
      titolo: sito.computer.menu.archivio,
      voci: [
        { testo: sito.computer.voci.apri, azione: apriSelezione, disattivata: !selezione },
        { testo: sito.computer.voci.chiudi, azione: () => davanti && chiudiFinestra(davanti), disattivata: !davanti },
      ],
    },
    {
      id: 'speciale',
      etichetta: sito.computer.menu.speciale,
      titolo: sito.computer.menu.speciale,
      voci: [{ testo: sito.computer.voci.riordina, azione: () => setPosizioni({}) }],
    },
  ]

  // esc chiude la finestra in primo piano (i menu aperti fermano il tasto prima)
  const tasti = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && davanti) {
      e.preventDefault()
      chiudiFinestra(davanti)
    }
  }

  const contenuto = (id: IdFinestra) => {
    if (id === 'informazioni') return <Informazioni />
    return <ContenutoApp app={id.slice('app:'.length) as App} onApri={(app) => apriFinestra(`app:${app}`)} />
  }

  return (
    <div className="mac-finder" onKeyDown={tasti}>
      <BarraMenu menu={menu} />
      <div
        ref={scrivania}
        className="mac-scrivania"
        aria-label={sito.computer.scrivania}
        role="group"
        onPointerDown={(e) => e.target === e.currentTarget && setSelezione(null)}
      >
        <ul className="mac-icone-scrivania">
          <li>
            <button type="button" className="mac-icona" data-icona="progetti" data-selezionata={selezione === 'progetti' || undefined} onClick={apriArchivio}>
              <IconaCartella />
              <span className="mac-etichetta">{sito.archivio.titolo}</span>
            </button>
          </li>
          {APPLICAZIONI.map((app) => {
            const Disegno = ICONE_APP[app]
            return (
              <li key={app}>
                <Icona
                  etichetta={sito.app[app].nome}
                  data-icona={`app:${app}`}
                  selezionata={selezione === `app:${app}`}
                  onSeleziona={() => setSelezione(`app:${app}`)}
                  onApri={() => {
                    setSelezione(`app:${app}`)
                    apriFinestra(`app:${app}`)
                  }}
                >
                  <Disegno />
                </Icona>
              </li>
            )
          })}
        </ul>
        {aperte.map((id, i) => {
          const r = rettangoloDi(id)
          return (
            <Finestra
              key={id}
              titolo={titoloDi(id)}
              rettangolo={r}
              davanti={id === davanti}
              livello={i + 1}
              piena={piena}
              scala={scala}
              onPrimoPiano={() => primoPiano(id)}
              onSposta={(x, y) =>
                setPosizioni((p) => ({
                  ...p,
                  [id]: { x: Math.min(Math.max(x, 40 - r.larghezza), larghezza - 40), y: Math.min(Math.max(y, 0), alta - 24) },
                }))
              }
              onChiudi={() => chiudiFinestra(id)}
            >
              {contenuto(id)}
            </Finestra>
          )
        })}
      </div>
      <p aria-live="polite" className="sr-only">
        {annuncio}
      </p>
    </div>
  )
}

function Informazioni() {
  const { crediti } = sito.computer
  return (
    <div className="mac-documento">
      <p>
        {crediti.modelloLink ? (
          <a href={crediti.modelloLink} target="_blank" rel="noreferrer">
            {crediti.modello}
          </a>
        ) : (
          crediti.modello
        )}
      </p>
      <p>
        {crediti.ambienteLink ? (
          <a href={crediti.ambienteLink} target="_blank" rel="noreferrer">
            {crediti.ambiente}
          </a>
        ) : (
          crediti.ambiente
        )}
      </p>
      <p>{crediti.carattere}</p>
    </div>
  )
}

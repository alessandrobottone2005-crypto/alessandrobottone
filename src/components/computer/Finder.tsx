// Scrivania del computer: quattro cartelle (una per disciplina), dentro un documento per progetto,
// e tre applicazioni (scacchi, paint, dediche) scaricate solo quando si aprono (app/Applicazioni.tsx).
// La finestra del progetto segue l’indirizzo /progetti/:slug: indietro la chiude, un link diretto la apre.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { useLocation, useMatch, useNavigate } from 'react-router'
import { disciplineVisibili } from '@/config/discipline'
import { sito } from '@/config/sito'
import { useVolto } from '@/components/volto/VoltoContext'
import { progetti, trovaProgetto, type Progetto } from '@/lib/progetti'
import type { Disciplina } from '@/lib/schema'
import { BarraMenu, TitoloVolto, type Menu } from './BarraMenu'
import { Blocchi } from './Blocchi'
import { Finestra, type Rettangolo } from './Finestra'
import { IconaCartella, IconaDediche, IconaDocumento, IconaPaint, IconaScacchi } from './icone'
import { ContenutoApp } from './app/Applicazioni'
import { APPLICAZIONI, type App } from './app/elenco'
import { clic, disco } from './app/suoni'

// stesso ordine delle discipline nell’header; web design si riaccende in config/discipline.ts
const CARTELLE: Disciplina[] = disciplineVisibili
const ALTEZZA_BARRA = 24

type IdFinestra = `cartella:${Disciplina}` | `app:${App}` | 'informazioni' | 'progetto'
const ICONE_APP: Record<App, () => ReactNode> = { scacchi: IconaScacchi, paint: IconaPaint, dediche: IconaDediche }
type Vista = 'icone' | 'nome'
type StatoNavigazione = { dalComputer?: boolean } | null

const titoloDi = (id: IdFinestra, progetto?: Progetto) =>
  id === 'progetto'
    ? (progetto?.titolo ?? '')
    : id === 'informazioni'
      ? sito.computer.voci.informazioni
      : id.startsWith('app:')
        ? sito.app[id.slice('app:'.length) as App].nome
        : id.slice('cartella:'.length)

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

function RigaElenco({ progetto, selezionata, onSeleziona, onApri }: { progetto: Progetto; selezionata: boolean; onSeleziona: () => void; onApri: () => void }) {
  const attivazione = useAttivazione(onSeleziona, onApri)
  return (
    <tr data-selezionata={selezionata || undefined}>
      <td>
        <button type="button" className="mac-riga" data-icona={`file:${progetto.slug}`} {...attivazione}>
          <IconaDocumento />
          {progetto.titolo}
        </button>
      </td>
      <td className="cifre-tabellari">{progetto.anno}</td>
      <td>{progetto.discipline.join(', ')}</td>
    </tr>
  )
}

type Props = { larghezza: number; altezza: number; telefono: boolean; scala: () => number }

export function Finder({ larghezza, altezza, telefono, scala }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const slug = useMatch('/progetti/:slug')?.params.slug
  const progetto = trovaProgetto(slug)

  const [aperte, setAperte] = useState<IdFinestra[]>(progetto ? ['progetto'] : [])
  const [posizioni, setPosizioni] = useState<Partial<Record<IdFinestra, { x: number; y: number }>>>({})
  const [vista, setVista] = useState<Vista>('icone')
  const [selezione, setSelezione] = useState<string | null>(null)
  const [annuncio, setAnnuncio] = useState('')
  const aprenti = useRef(new Map<IdFinestra, HTMLElement>())
  const scrivania = useRef<HTMLDivElement>(null)
  const { azione } = useVolto()

  // il volto dietro il monitor reagisce: sorride quando si apre un progetto, fa l’occhiolino quando si chiude
  const progettoPrima = useRef<string | undefined>(undefined)
  useEffect(() => {
    const ora = progetto?.slug
    if (ora && ora !== progettoPrima.current) azione('sorriso')
    else if (!ora && progettoPrima.current) azione('occhiolino')
    progettoPrima.current = ora
  }, [progetto?.slug, azione])

  // su telefono ogni finestra occupa la scrivania
  const piena = telefono
  const alta = altezza - ALTEZZA_BARRA

  // indirizzo inesistente → home
  useEffect(() => {
    if (slug && !progetto) navigate('/', { replace: true })
  }, [slug, progetto, navigate])

  // la finestra del progetto esiste finché l’indirizzo è /progetti/:slug
  const [ultimo, setUltimo] = useState(progetto)
  if (progetto !== ultimo) {
    setUltimo(progetto)
    setAperte((a) => (progetto ? [...a.filter((f) => f !== 'progetto'), 'progetto'] : a.filter((f) => f !== 'progetto')))
    if (progetto) setAnnuncio(sito.computer.aperta(progetto.titolo))
  }

  const rettangoloDi = useCallback(
    (id: IdFinestra): Rettangolo => {
      if (id === 'progetto') {
        const l = Math.round(larghezza * 0.86)
        return { x: Math.round((larghezza - l) / 2), y: 10, larghezza: l, altezza: Math.round(alta - 20) }
      }
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
      const i = CARTELLE.indexOf(id.slice('cartella:'.length) as Disciplina)
      const l = Math.min(Math.round(larghezza * 0.6), 440)
      const base = { x: 18 + i * 22, y: 14 + i * 20 }
      const p = posizioni[id] ?? base
      return { ...p, larghezza: l, altezza: Math.min(Math.round(alta * 0.62), 340) }
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
    setAnnuncio(sito.computer.aperta(titoloDi(id, progetto)))
    // aprendo una cartella il volto sbatte le palpebre
    if (id.startsWith('cartella:')) azione('battito')
    // aprendo un’applicazione il disco lavora
    if (id.startsWith('app:')) disco()
  }

  const apriProgetto = (p: Progetto) => {
    const attivo = document.activeElement
    if (attivo instanceof HTMLElement) aprenti.current.set('progetto', attivo)
    setSelezione(`file:${p.slug}`)
    if (p.slug === slug) return primoPiano('progetto')
    navigate(`/progetti/${p.slug}`, { state: { dalComputer: true } satisfies StatoNavigazione, replace: Boolean(progetto) })
  }

  const chiudiFinestra = (id: IdFinestra) => {
    const titolo = titoloDi(id, progetto)
    if (id === 'progetto') {
      // aperto dal computer: si torna indietro nella cronologia; link diretto: si va alla home
      if ((location.state as StatoNavigazione)?.dalComputer) navigate(-1)
      else navigate('/', { replace: true })
    } else setAperte((a) => a.filter((f) => f !== id))
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
    if (!selezione) return
    if (selezione.startsWith('cartella:') || selezione.startsWith('app:')) apriFinestra(selezione as IdFinestra)
    else {
      const p = trovaProgetto(selezione.slice('file:'.length))
      if (p) apriProgetto(p)
    }
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
      id: 'vista',
      etichetta: sito.computer.menu.vista,
      titolo: sito.computer.menu.vista,
      voci: [
        { testo: sito.computer.voci.perIcona, azione: () => setVista('icone'), spuntata: vista === 'icone' },
        { testo: sito.computer.voci.perNome, azione: () => setVista('nome'), spuntata: vista === 'nome' },
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

  const perCartella = useMemo(
    () => Object.fromEntries(CARTELLE.map((c) => [c, progetti.filter((p) => p.discipline.includes(c))])) as Record<Disciplina, Progetto[]>,
    [],
  )

  const contenuto = (id: IdFinestra) => {
    if (id === 'progetto') return progetto && <Documento progetto={progetto} />
    if (id === 'informazioni') return <Informazioni />
    if (id.startsWith('app:')) return <ContenutoApp app={id.slice('app:'.length) as App} onApri={(app) => apriFinestra(`app:${app}`)} />
    const elenco = perCartella[id.slice('cartella:'.length) as Disciplina]
    if (vista === 'nome')
      return (
        <table className="mac-elenco">
          <thead>
            <tr>
              <th scope="col">{sito.computer.colonne.nome}</th>
              <th scope="col">{sito.computer.colonne.anno}</th>
              <th scope="col">{sito.computer.colonne.discipline}</th>
            </tr>
          </thead>
          <tbody>
            {elenco.map((p) => (
              <RigaElenco
                key={p.slug}
                progetto={p}
                selezionata={selezione === `file:${p.slug}`}
                onSeleziona={() => setSelezione(`file:${p.slug}`)}
                onApri={() => apriProgetto(p)}
              />
            ))}
          </tbody>
        </table>
      )
    return (
      <ul className="mac-griglia-icone">
        {elenco.map((p) => (
          <li key={p.slug}>
            <Icona
              etichetta={p.titolo}
              data-icona={`file:${p.slug}`}
              selezionata={selezione === `file:${p.slug}`}
              onSeleziona={() => setSelezione(`file:${p.slug}`)}
              onApri={() => apriProgetto(p)}
            >
              <IconaDocumento copertina={p.copertinaCard ?? p.copertina} />
            </Icona>
          </li>
        ))}
      </ul>
    )
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
          {CARTELLE.map((c) => (
            <li key={c}>
              <Icona
                etichetta={c}
                data-icona={`cartella:${c}`}
                selezionata={selezione === `cartella:${c}`}
                onSeleziona={() => setSelezione(`cartella:${c}`)}
                onApri={() => {
                  setSelezione(`cartella:${c}`)
                  apriFinestra(`cartella:${c}`)
                }}
              >
                <IconaCartella />
              </Icona>
            </li>
          ))}
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
              key={id === 'progetto' ? `progetto:${slug}` : id}
              titolo={titoloDi(id, progetto)}
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

function Documento({ progetto }: { progetto: Progetto }) {
  const meta = [progetto.discipline.join(', '), progetto.anno, progetto.cliente].filter(Boolean).join(' · ')
  return (
    <article className="mac-documento">
      <img src={progetto.copertina} alt={sito.computer.copertina(progetto.titolo)} className="mac-copertina" />
      <p className="mac-meta cifre-tabellari">{meta}</p>
      <p>{progetto.descrizione}</p>
      <div className="mac-blocchi">
        <Blocchi blocchi={progetto.blocchi} titolo={progetto.titolo} />
      </div>
    </article>
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
